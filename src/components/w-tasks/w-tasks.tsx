import { Component, Prop, Method } from '@stencil/core';
import { RouterHistory } from '@stencil/router';
import { WAnalysis } from '../../helpers/w-analysis';
import { CV as cv } from '../../helpers/cv';

class Task {

  check(_trackBox) :boolean {
    return true;
  }

  draw(_ctx,_w,_h) {
  }

  toString() {
    return "<base task>";
  }
}

class Settle extends Task {
  framesToGo: number = 30;

  check(_trackBox) :boolean {
    return (this.framesToGo-- <= 0);
  }
}

class StandAtAngle extends Task {
  targetAngle: number;
  lastAngle: number;
  required: number = 5;

  constructor(targetAngle) {
    super();
    this.targetAngle = targetAngle;
  }

  check(trackBox) :boolean {
    this.lastAngle = trackBox.angle;
    if (Math.abs( this.targetAngle - this.lastAngle ) < 2) {
      this.required--;
    } else {
      this.required = 5;
    }

    return this.required <= 0;
  }

  draw(ctx,w,h) {

      let rotation = ((90-this.targetAngle)/180)*Math.PI;
      ctx.save();
        ctx.fillStyle = "red";
        ctx.translate(w/2,h/2);
        ctx.rotate(rotation);
        ctx.fillRect(-2, -1000, 4, 2000);
      ctx.restore();

      ctx.translate(100,50);
      ctx.fillStyle = "white";
      ctx.textAlign = "left";

      ctx.font = "bold 26px Barlow";
      ctx.fillText("Stand at an Angle of "+Math.round(this.targetAngle)+"°", 0, 10);

      ctx.font = "64px Barlow";
      ctx.fillText(""+Math.round(this.lastAngle)+"°", 0, 80);
  }

  toString() {
    return "Stand at an Angle of "+this.targetAngle+"°";
  }
}

class MoveTo extends Task {
  targetX: number;
  targetY: number;
  lastX: number;
  lastY: number;
  required: number = 25;

  constructor(targetX, targetY) {
    super();
    this.targetX = targetX;
    this.targetY = targetY;
  }

  check(trackBox) :boolean {
    this.lastX = trackBox.x;
    this.lastY = trackBox.y;
    if ( Math.abs( this.targetX - this.lastX ) < 0.01
      && Math.abs( this.targetY - this.lastY ) < 0.01) {
      this.required--;
    } else {
      this.required = 25;
    }

    return this.required <= 0;
  }

  draw(ctx,w,h) {
      ctx.save();
        ctx.fillStyle = "red";
        ctx.translate(w*this.targetX,h*this.targetY);
        ctx.fillRect(-2, -100, 4, 200);
        ctx.fillRect(-100, -2, 200, 4);
      ctx.restore();

      ctx.translate(100,50);
      ctx.fillStyle = "white";
      ctx.textAlign = "left";

      ctx.font = "bold 26px Barlow";
      ctx.fillText("Move to "+(Math.round(this.targetX*100)/100)+"/"+(Math.round(this.targetY*100)/100), 0, 10);

      ctx.font = "48px Barlow";
      ctx.fillText(""+(Math.round(this.lastX*100)/100)+"/"+(Math.round(this.lastY*100)/100), 0, 60);
  }

  toString() {
    return "Move to "+(Math.round(this.targetX*100)/100)+"/"+(Math.round(this.targetY*100)/100);
  }
}

@Component({
  tag: 'w-tasks',
  styleUrl: 'w-tasks.css',
  shadow: true
})
export class WCapture {
  @Prop() history: RouterHistory;

  private analysis:WAnalysis;

  private inputWidth:number;
  private inputHeight:number;

  private tmp:any;
  private dst1:any;
  private dst2:any;
  private background:any;

  private trackBox:any;
  private lastangle = -10000;

  private audioElement!: HTMLAudioElement;

  private currentTask:Task = new Settle();
  private taskIndex = 0;
  private tasks:Array<Task> = [
    new MoveTo(0.5, 0.8),
    new StandAtAngle(90),
    new StandAtAngle(15),
    new StandAtAngle(30),
    new StandAtAngle(45),
    new StandAtAngle(60),
    new StandAtAngle(75),
  ];

  componentDidLoad() {
    if (this.analysis) {
      console.log("Analysis exists. clear first");
      this.analysis.unload();
    }
    this.analysis = new WAnalysis(320, 240,
      (width,height) => {
        this.inputWidth = width;
        this.inputHeight = height;
        this.tmp = new cv.Mat(height, width, cv.CV_32FC4);
        this.dst1 = new cv.Mat(height, width, cv.CV_8UC4);
        this.dst2 = new cv.Mat(height, width, cv.CV_8UC4);
      },
      (src, width, height, t) => {

        var r = this.analyze(src, width, height, t);

            let angle = 90-this.trackBox.angle;

            let sh=90;
            if( this.lastangle != -10000 ) {
                while( angle < this.lastangle-sh ) angle+=sh*2;
                while( angle > this.lastangle+sh ) angle-=sh*2;
            }
            angle = angle % 360; //Math.fmod( angle, 360 );
            while( angle < 0 ) angle += 360;
            while( angle > 360 ) angle -= 360;
            this.lastangle = angle;

            this.trackBox.angle = angle;
            this.trackBox.x = this.trackBox.center.x/width;
            this.trackBox.y = this.trackBox.center.y/height;

        if (this.currentTask) {
          if (this.currentTask.check(this.trackBox)) {
            console.log("Task fulfilled: ", this.currentTask);
            this.playSound();
            this.currentTask = this.tasks[this.taskIndex];
            this.taskIndex = (this.taskIndex+1)%this.tasks.length;
          }
        }

        return r;

      },
      (ctx,w,h) => {
        ctx.clearRect(0,0,w,h);
        ctx.save();

        let cs = this.trackBox;
        if (cs) {
            let angle = cs.angle;

            let rotation = ((90-angle)/180)*Math.PI;


            ctx.fillStyle = "#8ae234";
            ctx.save();

            ctx.scale(w/this.inputWidth, h/this.inputHeight);
            
            ctx.translate(cs.center.x, cs.center.y);
            ctx.rotate(rotation);
            ctx.fillRect(-(cs.size.width / 2), -2, cs.size.width, 4);
            ctx.fillRect(-2   , -(cs.size.height / 2), 4, cs.size.height);
            ctx.fillStyle = "#edd400";
            ctx.fillRect(-5, -cs.size.height / 2 - 10, 10, 10);

            ctx.restore();
/*
            ctx.translate(100,50);
            ctx.font = "26px Barlow";
            ctx.fillStyle = "white";
            ctx.textAlign = "right";
            ctx.fillText(""+Math.round(angle)+"°", 0, 10);
*/
        }

        if (this.currentTask) {
          this.currentTask.draw(ctx, w, h);
        }

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
    cv.threshold(this.dst1, this.dst2, 50, 150, cv.THRESH_BINARY);

    
// for triggers, use roi with: console.log("mean:", cv.mean(dst2));

    let frame = this.dst2;
    let trackWindow = new cv.Rect(0, 0, width, height);
    //let roi = frame.roi(trackWindow);
    let termCrit = new cv.TermCriteria(cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT, 10, 1);

    
    [this.trackBox, trackWindow] = cv.CamShift(frame, trackWindow, termCrit);

/*
        let pts = cv.rotatedRectPoints(this.trackBox);
        cv.line(frame, pts[0], pts[1], [255, 0, 0, 255], 3);
        cv.line(frame, pts[1], pts[2], [255, 0, 0, 255], 3);
        cv.line(frame, pts[2], pts[3], [255, 0, 0, 255], 3);
        cv.line(frame, pts[3], pts[0], [255, 0, 0, 255], 3);
*/
//    console.log("camshift:", this.trackBox);

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

  @Method() playSound() {
    this.audioElement.play();
  }

  render() {
    return <div>
        <audio src="/assets/sound/pluck.ogg" preload="auto" ref={ (el) => this.audioElement = el as HTMLAudioElement }></audio>
        <w-commandpalette commands={{
          "q": { symbol:"q", description:"Quit", execute:()=>{ this.history.replace("/", {}); } },
          " ": { symbol:"␠", description:"Reset", execute:()=>{ this.background.delete(); this.background=null; } },
        }}>
        </w-commandpalette>
      </div>
  }
}
