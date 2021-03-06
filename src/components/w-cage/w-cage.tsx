import { Component, Prop, Listen } from '@stencil/core';
import { RouterHistory } from '@stencil/router';
import { WAnalysis } from '../../helpers/w-analysis';
import { CV as cv } from '../../helpers/cv';

interface Rectangle {
  l:number,
  r:number,
  t:number,
  b:number
}


@Component({
  tag: 'w-cage',
  styleUrl: 'w-cage.css',
  shadow: true
})
export class WCapture {
  @Prop() history: RouterHistory;
  @Prop({ mutable:true }) left:number = 0.2;
  @Prop({ mutable:true }) right:number = 0.8;
  @Prop({ mutable:true }) top:number = 0.3;
  @Prop({ mutable:true }) bottom:number = 1.0;

  @Listen("window:mousedown")
  onMouseDown(e) {
    let p = this.analysis.convertCoordinates(e.clientX, e.clientY);
    this.left = p.x;
    this.top = p.y;

    let moveHandler = e => {
      let p = this.analysis.convertCoordinates(e.clientX, e.clientY);
      this.right = p.x;
      this.bottom = p.y;
    };
    let upHandler = _e => {
      if (this.right<this.left) {
        let t = this.right;
        this.right = this.left;
        this.left = t;
      }
      if (this.bottom<this.top) {
        let t = this.bottom;
        this.bottom = this.top;
        this.top = t;
      }
      this.left = Math.max(0,this.left);
      this.top = Math.max(0,this.top);
      this.right = Math.min(1,this.right);
      this.bottom = Math.min(1,this.bottom);
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseup", upHandler);
    };
    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("mouseup", upHandler);
  }

  private analysis:WAnalysis;

  private tmp:any;
//  private tmp2:any;
  private dst1:any;
  private dst2:any;
  private background:any;

  private current:Rectangle = { l:0, r:0, t:0, b:0 };
  private isInside:boolean = true;


  private audioElement!: HTMLAudioElement;

  componentDidLoad() {
    this.audioElement.play();
    this.audioElement.volume = 0;

    if (this.analysis) {
      console.log("Analysis exists. clear first");
      this.analysis.unload();
    }
    this.analysis = new WAnalysis(160, 120,
      (width,height) => {
        this.tmp  = new cv.Mat(height, width, cv.CV_32FC4);
        //this.tmp2 = new cv.Mat(height, width, cv.CV_32FC1);
        this.dst1 = new cv.Mat(height, width, cv.CV_8UC4);
        this.dst2 = new cv.Mat(height, width, cv.CV_8UC4);
      },
      (src, width, height, t) => {

        var r = this.analyze(src, width, height, t);
        return r;

      },
      (ctx,w,h) => {
        ctx.clearRect(0,0,w,h);
        ctx.save();

          ctx.lineWidth = 2;
          ctx.strokeStyle = "#ef2929";
          ctx.strokeRect(this.left*w,this.top*h,((this.right-this.left)*w)-2,((this.bottom-this.top)*h)-2)

          ctx.strokeStyle = this.isInside ? "#8ae234" : "#edd400";
          ctx.strokeRect(this.current.l*w,this.current.t*h,( this.current.r-this.current.l)*w,(this.current.b-this.current.t)*h)

        ctx.restore();
      });

  }

  analyze(src, width, height, _t) {

    src.convertTo(this.tmp, cv.CV_32F);

    if (!this.background) {
      this.background = new cv.Mat(height, width, cv.CV_32FC4);
      src.convertTo(this.background, cv.CV_32F);
    }

    let alpha = 0.0001;
    cv.addWeighted(this.tmp, alpha, this.background, 1.0-alpha, 0, this.background);

    this.background.convertTo(this.dst1, cv.CV_8U);
    cv.absdiff(src, this.dst1, this.dst2);
    cv.cvtColor(this.dst2, this.dst1, cv.COLOR_RGB2GRAY);
    cv.threshold(this.dst1, this.dst2, 80, 150, cv.THRESH_BINARY);

/*
    alpha = 0.1;
    this.dst2.convertTo(this.tmp, cv.CV_32F);
    cv.addWeighted(this.tmp, alpha, this.tmp2, 1.0-alpha, 0, this.tmp2);
    this.tmp2.convertTo(this.dst1, cv.CV_8U);
    cv.threshold(this.dst1, this.dst2, 60, 150, cv.THRESH_TOZERO);
*/
    
    // find extremes

    let frame = this.dst2;
    let step = 1;
    let th = 0;

    // from left:
    let left = undefined;
    let x = 0;
    while (!left && x<width-step) {
      let rect = new cv.Rect(x, 0, step, height-1);
      let img = frame.roi(rect);
      let v = cv.countNonZero(img);
      if (v>th) left=x;
      img.delete();
      x+=step;
    }

    // from right:
    let right = undefined;
    x = width-step;
    while (!right && x>left) {
      let rect = new cv.Rect(x, 0, step, height-1);
      let img = frame.roi(rect);
      let v = cv.countNonZero(img);
      if (v>th) right=x;
      img.delete();
      x-=step;
    }

    // from top:
    let top = undefined;
    let y = 0;
    while (!top && y<height-step) {
      let rect = new cv.Rect(0, y, width-1, step);
      let img = frame.roi(rect);
      let v = cv.countNonZero(img);
      if (v>th) top=y;
      img.delete();
      y+=step;
    }

    // from right:
    let bottom = undefined;
    y = height-step;
    while (!bottom && y>top) {
      let rect = new cv.Rect(0, y, width-1, step);
      let img = frame.roi(rect);
      let v = cv.countNonZero(img);
      if (v>th) bottom=y;
      img.delete();
      y-=step;
    }

    this.current = {
      l:(left+0.5)/width,
      r: (right+0.5)/width,
      t: (top+0.5) /height,
      b: (bottom+0.5)/height
    };

    this.isInside = 
      this.left <= this.current.l
      && this.right >= this.current.r
      && this.top <= this.current.t
      && this.bottom >= this.current.b;

    if (this.right-this.left > 10
      && this.bottom-this.top > 10)
      this.isInside = true;

    this.audioElement.volume = this.isInside ? 0.0 : 1.0;

    //this.tmp2.convertTo(this.dst2, cv.CV_8U);
    cv.cvtColor(this.dst2, this.dst1, cv.COLOR_GRAY2RGBA);

    return this.dst1;
  }

  componentDidUnload() {
    this.analysis.unload();

    this.dst1.delete();
    this.dst2.delete();
    this.tmp.delete();
    if (this.background) this.background.delete();
  }

  render() {
    return <div>
        <audio src="/assets/sound/rassel.ogg" loop preload="auto" ref={ (el) => this.audioElement = el as HTMLAudioElement }></audio>
        <w-commandpalette commands={{
          "q": { symbol:"q", description:"Quit", execute:()=>{ this.history.replace("/", {}); } },
          " ": { symbol:"space", description:"Reset", execute:()=>{ this.background.delete(); this.background=null; } },
        }}>
        </w-commandpalette>
      </div>
  }
}
