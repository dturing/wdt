import { Component, Prop } from '@stencil/core';
import { RouterHistory } from '@stencil/router';
import { WAnalysis } from '../../helpers/w-analysis';
import { CV as cv } from '../../helpers/cv';

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

  componentDidLoad () {
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

        return this.analyze(src, width, height, t);

      },
      (ctx,w,h) => {
        ctx.clearRect(0,0,w,h);
        ctx.save();

        let cs = this.trackBox;
        let context = ctx;
        let lastangle = this.lastangle;
        let rotation = 0;
        if (cs) {
            let angle = cs.angle;

            let sh=90;
            if( lastangle != -10000 ) {
                while( angle < lastangle-sh ) angle+=sh*2;
                while( angle > lastangle+sh ) angle-=sh*2;
            }
            angle = angle % 360; //Math.fmod( angle, 360 );
            while( angle < -180 ) angle += 360;
            while( angle > 180 ) angle -= 360;
            // while( box.angle<M_PI*2 ) box.angle += M_PI*2;
            // while( box.angle>M_PI*2 ) box.angle -= M_PI*2;
            lastangle = angle;

                rotation = (angle/180)*Math.PI;

            var c = { x:cs.center.x, y:cs.center.y, 
                      width:cs.size.width, height:cs.size.height, 
                      angle:rotation }
            context.fillStyle = "#3b3";
            context.save();

            context.scale(w/this.inputWidth, h/this.inputHeight);
            
            context.translate(c.x, c.y);
            context.rotate(c.angle);
            context.fillRect(-(c.width / 2), -3, c.width, 6);
            context.fillRect(-3, -(c.height / 2), 6, c.height);
            context.fillStyle = "#ff0";
            context.fillRect(-5, c.height / 2 - 10, 10, 10);

            context.restore();

            ctx.translate(100,50);
            ctx.font = "26px Barlow";
            ctx.fillStyle = "white";
            ctx.textAlign = "right";
            ctx.fillText(""+Math.round(angle)+"°", 0, 10);

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


  render() {
    return <div>
        <w-commandpalette commands={{
          "q": { symbol:"q", description:"Quit", execute:()=>{ this.history.replace("/", {}); } },
          "r": { symbol:"r", description:"Reset", execute:()=>{ this.background.delete(); this.background=null; } },
        }}>
        </w-commandpalette>
      </div>
  }
}
