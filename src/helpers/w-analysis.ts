import { CV as cv,loadOpenCv } from './cv';

export class WAnalysis {

	private videoElement:HTMLVideoElement;
	private canvasElement:HTMLCanvasElement;
	private overlayCanvasElement:HTMLCanvasElement;

	private width:number;
	private height:number;
	private realWidth:number;
	private realHeight:number;
	private leftMargin:number;
	private topMargin:number;

	private _init:any; // function
	private _process:any; // function
	private _draw:any; // function

	private stream:MediaStream = null;
	private vc:any = null;
	private src:any = null;

	private context:any = null;
	private overlayContext:any = null;

	private lastTime:number = undefined;
	private stop:boolean = false;

	constructor(width:number, height:number,
			init, process, draw) {
		this.width = width;
		this.height = height;

		this.realWidth = width;
		this.realHeight = height;

		this._init = init;
		this._process = process;
		this._draw = draw;

    	this.videoElement = document.createElement("video");
        this.canvasElement = document.createElement("canvas");
        this.overlayCanvasElement = document.createElement("canvas");

	    loadOpenCv((_cv)=>{
	      this.startCamera();
//	      console.log("CV loaded:", cv, this.canvasElement);
	    });

	    window.addEventListener("resize", () => {
	    	this.onWindowResized();
	    });
	}

	convertCoordinates(x:number, y:number) {
		return {
			x:(x-this.leftMargin)/this.realWidth,
			y:(y-this.topMargin)/this.realHeight
		}
	}

	onWindowResized() {
		var dpr = window.devicePixelRatio || 1;

	    this.overlayCanvasElement.width = window.innerWidth * dpr;
		this.overlayCanvasElement.height = window.innerHeight * dpr;

		this.overlayContext.scale(dpr, dpr);



    	let windowAspect = window.innerWidth/window.innerHeight;
    	let aspect = this.width/this.height;


    	if (windowAspect > aspect) {
	        this.realWidth = window.innerHeight*aspect;
	        this.realHeight = window.innerHeight;
    	} else {
	        this.realWidth = window.innerWidth;
	        this.realHeight = window.innerWidth/aspect;
    	}

        this.canvasElement.style.width = ""+this.realWidth+"px";
        this.canvasElement.style.height = ""+this.realHeight+"px";

        this.overlayCanvasElement.width = this.realWidth;
		this.overlayCanvasElement.height = this.realHeight;

		this.topMargin = ((window.innerHeight-this.realHeight)/2);
		this.leftMargin = ((window.innerWidth-this.realWidth)/2);
        this.overlayCanvasElement.style.top = 
        this.canvasElement.style.top = 
        	""+this.topMargin+"px";
        this.overlayCanvasElement.style.left = 
        this.canvasElement.style.left = 
        	""+this.leftMargin+"px";
        
	}

	startCamera() {
	    let videoConstraint:any = { width: { exact: this.width },
	                           height: { exact: this.height } };
	                           

	    let deviceId = window.localStorage.getItem("cameraDevice");
  		if (deviceId) {
  			videoConstraint.deviceId = {exact:deviceId};
  		}
  		console.log("Video constraint:", videoConstraint);

	    if (this.src) this.stopCamera();
	    if (this._init) this._init(this.width, this.height);

	    navigator.mediaDevices.getUserMedia({video: videoConstraint, audio: false})
	        .then((stream) => {
	        	var el = document.getElementById("background");
	        	//if (!el) el = document.body;

	        	this.videoElement.style.display = "none";
	        	document.body.appendChild(this.videoElement);

//        		let i = stream.getTracks()[0].getSettings();

	        	this.stream = stream;
	            this.videoElement.srcObject = stream;
	            this.videoElement.play();

	            this.videoElement.setAttribute('width', ""+this.width);
	            this.videoElement.setAttribute('height', ""+this.height);
	            this.vc = new cv.VideoCapture(this.videoElement);
	            this.videoElement.addEventListener('canplay', () => { this.videoCanPlay() }, false);


	            this.canvasElement.style.position = "absolute";
	            this.canvasElement.style.zIndex = "-1";
	            el.appendChild(this.canvasElement);

			    this.canvasElement.width = this.width;
    			this.canvasElement.height = this.height;
    			this.context = this.canvasElement.getContext("2d");

	            //this.overlayCanvasElement.style.width = "100vw";
	            //this.overlayCanvasElement.style.height = "100vh";
	            this.overlayCanvasElement.style.position = "absolute";
	            this.overlayCanvasElement.style.left = "0";
	            this.overlayCanvasElement.style.top = "0";
	            this.overlayCanvasElement.style.zIndex = "-1";
	            el.appendChild(this.overlayCanvasElement);

    			this.overlayContext = this.overlayCanvasElement.getContext("2d");

		    	this.onWindowResized();
		    	this.stop = false;

	        })
	        .catch((err) => {
	            console.log('Camera Error: ' + err.name + ' ' + err.message);
	            if (err.name == "OverconstrainedError") {
    	  			window.localStorage.removeItem("cameraDevice");
    	  			this.startCamera();
	            }
	        });

		this.src = new cv.Mat(this.height, this.width, cv.CV_8UC4);

	}

	process(t) {

        if (!this.lastTime) this.lastTime = t-(1000/30);
        let tDiff = (t-this.lastTime);
        //console.log("tDiff", tDiff, "30fps", 1000/30);

        //if (tDiff >= 1000/30) {
	        this.lastTime = t;

	    if (this.vc) {
			this.vc.read(this.src);

			let dst = this.src;
			cv.flip(dst,dst,1);
			if (this._process) dst = this._process(this.src, this.width, this.height, tDiff);

			if (dst) {
				let imgData = new ImageData(new Uint8ClampedArray(dst.data), dst.cols, dst.rows);
				this.context.save();
				this.context.clearRect(0,0,this.width,this.height);
				this.context.putImageData(imgData, 0, 0);
				// Alternative, maybe faster? can be scaled, might avoid dual canvases?
				// createImageBitmap(imgData).then(bmp => this.context.drawImage(bmp,0,0));
				this.context.restore();
			}

			if (this._draw) this._draw(this.overlayContext, this.realWidth, this.realHeight, tDiff);
		}

		if (!this.stop)
			requestAnimationFrame((t)=>{ this.process(t); });
	}

	stopCamera() {
		delete this.vc;
		this.stop = true;
		this.src.delete();
		this.videoElement.pause();
		if (this.stream) {
			this.stream.getTracks().forEach(function(track) {
	            track.stop();
	        });
	    }	
	}

	unload() {
		this.stopCamera();
		this.videoElement.parentNode.removeChild(this.videoElement);
		this.canvasElement.parentNode.removeChild(this.canvasElement);
		this.overlayCanvasElement.parentNode.removeChild(this.overlayCanvasElement);
	}

	videoCanPlay() {
		requestAnimationFrame((t)=>{ this.process(t); });
//		setInterval(()=>{ this.process(); }, 1000/30);
	}

}
