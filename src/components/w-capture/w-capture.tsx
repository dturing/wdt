import { Component, Prop, State, Watch } from '@stencil/core';
import { RouterHistory } from '@stencil/router';
import { WAnalysis } from '../../helpers/w-analysis';
import { WCaptureMode } from '../../helpers/w-capturemode';
import { WCountdown } from '../w-countdown/w-countdown';
import { CV as cv } from '../../helpers/cv';

const FRAMERATE = 30;


@Component({
  tag: 'w-capture',
  styleUrl: 'w-capture.css',
  shadow: true
})
export class WCapture {
  @Prop() history: RouterHistory;

  @Prop({ mutable:true }) frames: number = FRAMERATE*5;
  @Watch("frames")
  changeFrames(newValue:number, _oldValue:number) {
    if (newValue>this.tape.length) {
        for (let i=this.tape.length; i<newValue; i++) {
           this.tape[i] = new cv.Mat(this.inputWidth, this.inputHeight, cv.CV_8UC4);
           // TODO: clear
        }
    }
  }

  private analysis:WAnalysis;

  private inputWidth:number;
  private inputHeight:number;

  private tape = [];

  private tmp:any;
  private dst1:any;
  private dst2:any;
  private background:any;

  private triggers:Array<{x:number,y:number,mode:WCaptureMode}> = [
  /* widht/height always 0.1 */
    { mode:WCaptureMode.Record, x:0.9-0.025, y:0.025},
    { mode:WCaptureMode.SlowMotion, x:0.3, y:0.025 },
    { mode:WCaptureMode.Reverse, x:0.45, y:0.025 },
    { mode:WCaptureMode.Replay, x:0.6, y:0.025 },
  ];

  private triggerResults:{ [key: string]: any } = {};

  @State() haveCapture:boolean  = false;
  @State() currentMode:WCaptureMode = WCaptureMode.Idle;
  private countdown:WCountdown;

  private writePos:number = 0;
  private readPos:number = 0;

  componentDidLoad () {
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
        let h = 0.13*height;
        this.tmp = new cv.Mat(h, width, cv.CV_32FC4);
        this.dst1 = new cv.Mat(h, width, cv.CV_8UC4);
        this.dst2 = new cv.Mat(h, width, cv.CV_8UC4);
      },
      (src, width, height, t) => {

        if (this.currentMode == WCaptureMode.Idle) {
          
          return this.analyzeTriggers(src, width, height);

        } else if (this.currentMode == WCaptureMode.Record) {

          if (this.writePos < this.frames) {
            cv.convertScaleAbs(src, this.tape[Math.floor(this.writePos)], 1, 0);
            this.writePos ++;

            if (this.writePos >= this.frames) {
              this.haveCapture = true;
              this.currentMode = WCaptureMode.Idle;
              this.countdown.playSound();
            }
          }

        } else if (this.currentMode == WCaptureMode.Replay) {
          this.readPos += (t/FRAMERATE);

          if (this.readPos > this.frames) {
              console.log("STOP replay");
              this.currentMode = WCaptureMode.Idle;
          }
          return this.tape[Math.floor(this.readPos)];

        } else if (this.currentMode == WCaptureMode.SlowMotion) {
          this.readPos += (t/FRAMERATE)*0.2;

          if (this.readPos > this.frames) {
              console.log("STOP slowmo");
              this.currentMode = WCaptureMode.Idle;
          }
          return this.tape[Math.floor(this.readPos)];

        } else if (this.currentMode == WCaptureMode.Reverse) {
          this.readPos -= (t/FRAMERATE);

          if (this.readPos < 1) {
              console.log("STOP reverse");
              this.currentMode = WCaptureMode.Idle;
          }
          return this.tape[Math.floor(this.readPos)];

        }

        return src;

      },
      (ctx,w,h) => {
        ctx.clearRect(0,0,w,h);
        ctx.save();

        if (this.currentMode == WCaptureMode.Idle) {

          ctx.strokeWidth = 1/w;
          ctx.strokeStyle = "#ef2929";

          for (let trigger of this.triggers) {
            if (trigger.mode == WCaptureMode.Record || this.haveCapture) {
              ctx.beginPath();
              ctx.rect( trigger.x * w, trigger.y * h, 0.1 * w, 0.1 * h );

              let result = this.triggerResults[trigger.mode];
              if (result) {
                ctx.fillStyle = "rgba(204,0,0,"+(result.v/200)+")";
                ctx.fill();
    /*
                ctx.save();
                  ctx.translate((0.05+trigger.x) * w, (0.05+trigger.y) * h);
                  ctx.font = "13px Barlow";
                  ctx.fillStyle = "white";
                  ctx.textAlign = "center";
                  ctx.fillText(trigger.mode+"\n"+result.v, 0, 5);
                ctx.restore();
                */
              }

              ctx.stroke();
            }
          }
        }

        ctx.translate(50,50);
        ctx.font = "26px Barlow";
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.fillText(""+(this.frames/FRAMERATE)+"s - "+this.currentMode, 0, 10);

        ctx.restore();
      });

  }

  analyzeTriggers(_src, width, height) {
    let h = 0.13*height;
    let rect = new cv.Rect(0, 0, width, h);
    let src = _src.roi(rect);

    src.convertTo(this.tmp, cv.CV_32F);

    if (!this.background) {
      this.background = new cv.Mat(h, width, cv.CV_32FC4);
      src.convertTo(this.background, cv.CV_32F);
    }

    cv.addWeighted(this.tmp, 0.01, this.background, 1.0-0.01, 0, this.background);

    this.background.convertTo(this.dst1, cv.CV_8U);
    cv.absdiff(src, this.dst1, this.dst2);

    cv.cvtColor(this.dst2, this.dst1, cv.COLOR_RGB2GRAY);
    
    cv.threshold(this.dst1, this.dst2, 50, 200, cv.THRESH_BINARY);

    for (let trigger of this.triggers) {
      if (trigger.mode == WCaptureMode.Record || this.haveCapture) {
        let rect = new cv.Rect(trigger.x*width, trigger.y*height, 0.1*width, 0.1*height);
        let img = this.dst2.roi(rect);
        let result = {
          v:Math.min(300,cv.countNonZero(img)),
        };
        if (result.v > 80) {
          this.trigger(trigger.mode);
        }
        this.triggerResults[trigger.mode] = result;
        //console.log("trigger", trigger.name, ":", cv.mean(img), cv.countNonZero(img));
      }
    }

    src.delete();
    return _src;
  }

  trigger(mode:WCaptureMode) {
    if (this.currentMode==WCaptureMode.Idle) {

      switch (mode) {
        case WCaptureMode.Record:
          this.currentMode = WCaptureMode.Timer;
          this.countdown.startCountdown(mode, 3, ()=>{
            this.currentMode = WCaptureMode.Record;
            this.writePos = 0;
          });
          break;

        case WCaptureMode.Replay:
          this.currentMode = mode;
          this.readPos = 0;
          break;

        case WCaptureMode.SlowMotion:
          this.currentMode = mode;
          this.readPos = 0;
          break;

        case WCaptureMode.Reverse:
          this.currentMode = WCaptureMode.Reverse;
          this.readPos = this.frames;
          break;

      }
    }
  }

  componentDidUnload() {
    this.analysis.unload();

    this.dst1.delete();
    this.dst2.delete();
    this.tmp.delete();
    if (this.background) this.background.delete();
    for (var img of this.tape) {
      img.delete();
    }
    this.tape = [];
  }


  render() {
    return <div>
        <w-countdown ref={(el) => this.countdown = el as any as WCountdown } />
        <w-commandpalette commands={{
          "ArrowUp":    { symbol:"↥", description:"Longer Tape",  execute:()=>{ this.frames = Math.min( this.frames+FRAMERATE, 30*FRAMERATE); } },
          "ArrowDown":  { symbol:"↧", description:"Shorter Tape", execute:()=>{ this.frames = Math.max( this.frames-FRAMERATE,  2*FRAMERATE); } },
          "q": { symbol:"q", description:"Quit", execute:()=>{ this.history.replace("/", {}); } },
        }}>
        </w-commandpalette>
      </div>
  }
}
