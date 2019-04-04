import { Component, Prop, Watch, State } from '@stencil/core';
import { RouterHistory } from '@stencil/router';
import { WAnalysis } from '../../helpers/w-analysis';
import { CV as cv } from '../../helpers/cv';

const FRAMERATE = 30;

@Component({
  tag: 'w-delay',
  styleUrl: 'w-delay.css',
  shadow: true
})
export class WDelay {
  @Prop() history: RouterHistory;

  @Prop({ mutable:true }) speed: number = 1.0;

  @Prop({ mutable:true }) frames: number = FRAMERATE*3;
  @Watch("frames")
  changeFrames(newValue:number, oldValue:number) {
    if (newValue>oldValue) {
        for (let i=oldValue; i<newValue; i++) {
           this.tape[i] = new cv.Mat(this.inputWidth, this.inputHeight, cv.CV_8UC4);
        }
    } else if (newValue<oldValue) {
      this.assureValidPositions();
    }
  }

  @State() showHelp = false;

  private analysis:WAnalysis;

  private inputWidth:number;
  private inputHeight:number;

  private tape = [];
  private readPos:number = 0;
  private actualWritePos:number = 0;
  private writePos:number = 0;

  private keyboardListener:any;
  private showHelpTimer:number = 0;

  private assureValidPositions() {
    while (this.readPos<0) this.readPos+=this.frames;
    this.readPos = this.readPos % this.frames;
    while (this.writePos<0) this.writePos+=this.frames;
    while (this.writePos>=this.frames) {
      this.writePos-=this.frames;
      this.actualWritePos-=this.frames;
    }
    this.writePos = this.writePos % this.frames;
  }

  componentDidLoad () {
    this.reset();

    if (this.analysis) {
      console.log("Analysis exists. clear first");
      this.analysis.unload();
    }
    this.analysis = new WAnalysis(640, 480,
      (width,height) => {
        this.inputWidth = width;
        this.inputHeight = height;
        for (let i=0; i<FRAMERATE*10; i++) {
           this.tape[i] = new cv.Mat(this.inputWidth, this.inputHeight, cv.CV_8UC4);
        }
      },
      (src,_width,_height, t) => {

        let fps = FRAMERATE;

        this.writePos = this.writePos + (t/fps);

        while(this.actualWritePos<this.writePos) {
          this.actualWritePos = (this.actualWritePos+1);
          //cv.flip(src, this.tape[Math.floor(this.actualWritePos % this.frames)], 0);
          cv.convertScaleAbs(src, this.tape[Math.floor(this.actualWritePos % this.frames)], 1, 0);
        }

        this.readPos += this.speed * (t/fps);

        this.assureValidPositions();
        let ret = this.tape[Math.floor(this.readPos)];

//        console.log(""+(Math.round(10000/t)/10)+" fps");

        this.showHelpTimer--;
        if (this.showHelpTimer==0) this.showHelp = false;

        return ret;
      },
      (ctx,w,h) => {
//        let l = 300;
        let r = 40;

        ctx.clearRect(0,0,w,h);
        ctx.save();

        ctx.translate(50+r,50+r);

        ctx.font = "26px Barlow";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(""+(this.frames/30)+"s", 0, 10);

/*
        ctx.strokeWidth = 0.2;
        ctx.translate(30,70);
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(l,0);
        ctx.strokeStyle = "white";
        ctx.stroke();
*/
        ctx.strokeWidth = 0.2;
        ctx.beginPath();
        ctx.arc(0,0,r,0,2*Math.PI)
        ctx.strokeStyle = "gray";
        ctx.stroke();

        ctx.strokeStyle = "none";

        ctx.save();
          ctx.fillStyle = "#8ae234";
          //ctx.translate((this.readPos/this.frames)*l,0);
          ctx.rotate((this.readPos/this.frames)*Math.PI*2,0);
          ctx.translate(0,r);
          this.fillTriangle(ctx);
        ctx.restore();

        ctx.save();
          ctx.fillStyle = "#ef2929";
//          ctx.translate((this.actualWritePos/this.frames)*l,0);
          ctx.rotate((this.actualWritePos/this.frames)*Math.PI*2,0);
          ctx.translate(0,r);
          ctx.rotate(Math.PI);
          this.fillTriangle(ctx);
        ctx.restore();
/*
        ctx.save();
          ctx.fillStyle = "#fff";
          ctx.translate((this.writePos/this.frames)*l,0);
          this.fillTriangle(ctx);
        ctx.restore();
*/
        ctx.restore();
      });


    this.keyboardListener = (ev) => {
      console.log(ev.key);
      switch(ev.key) {
        
        case "ArrowUp":
          this.frames += FRAMERATE;
          this.reset();
          break;
        
        case "ArrowDown":
          this.frames -= FRAMERATE;
          this.reset();
          break;

        case "ArrowLeft":
          this.speed = -1;
          this.reset();
          break;

        case "ArrowRight":
          this.speed = 1;
          this.reset();
          break;

        case "q":
         // window.history.back();
          this.history.replace("/", {});
          break;

        case " ":
          this.showHelp = !this.showHelp;
          this.showHelpTimer = -1;
          break;

        default:
          this.showHelpTimer = 200;
          this.showHelp = true;
      }
    };
    window.addEventListener("keydown", this.keyboardListener);
  }

  reset() {
    if (this.frames > FRAMERATE*10) this.frames = FRAMERATE*10;
    if (this.frames < FRAMERATE*2) this.frames = FRAMERATE*2;
    this.readPos = 3;
    this.writePos = this.actualWritePos = 0;
  }

  componentDidUnload() {
    this.analysis.unload();
    window.removeEventListener("keydown", this.keyboardListener);
    delete this.keyboardListener;
  }

  fillTriangle(ctx) {
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(4,10);
    ctx.lineTo(-4,10);
    ctx.lineTo(0,0);
    ctx.closePath();
    ctx.fill();
  }

  render() {
      if (this.showHelp) {
        return <ul class="help">
            <li><span class="key">↥</span> Longer Tape</li>
            <li><span class="key">↧</span> Shorter Tape</li>
            <li><span class="key">↤</span> Reverse Mode</li>
            <li><span class="key">↦</span> Delay Mode</li>
            <li><span class="key">Q</span> Quit</li>
          </ul>;
      } else {
        return <div/>
      }
      //
  }
}
