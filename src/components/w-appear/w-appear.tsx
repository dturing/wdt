import { Component, Prop, State } from '@stencil/core';
import { RouterHistory } from '@stencil/router';
import { WAnalysis } from '../../helpers/w-analysis';
import { CV as cv } from '../../helpers/cv';

@Component({
  tag: 'w-appear',
  styleUrl: 'w-appear.css',
  shadow: true
})
export class WAppear {
  @Prop() history: RouterHistory;

  @State() alpha: number = 10;

  private analysis:WAnalysis;

  private tmp:any;
  private dst1:any;
  private background:any;

  componentDidLoad() {
    this.alpha = 5;

    this.analysis = new WAnalysis(640, 480,
      (width,height) => {
        this.tmp = new cv.Mat(height, width, cv.CV_32FC4);
        this.dst1 = new cv.Mat(height, width, cv.CV_8UC4);
      },
      (src,width,height) => {
        src.convertTo(this.tmp, cv.CV_32F);

        if (!this.background) {
          this.background = new cv.Mat(height, width, cv.CV_32FC4);
          src.convertTo(this.background, cv.CV_32F);
        }

        let alpha = 0.001 + (Math.pow(this.alpha/10, 2)/10);

        cv.addWeighted(this.tmp, alpha, this.background, 1.0-alpha, 0, this.background);

        this.background.convertTo(this.dst1, cv.CV_8U);

        return this.dst1;
      },
      (ctx,w,h) => {
        ctx.clearRect(0,0,w,h);
        ctx.save();

        if (this.alpha) {
          ctx.translate(50,50);
          ctx.font = "26px Barlow";
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.fillText(""+(this.alpha), 0, 10);
        }

        ctx.restore();
      });
  }

  setSpeed(change:number) {
    this.alpha += change;

    if (this.alpha > 10) this.alpha = 10;
    if (this.alpha < 1) this.alpha = 1;
  }

  componentDidUnload() {
    this.analysis.unload();
  }

  render() {
    return <w-commandpalette commands={{
          "ArrowUp":    { symbol:"↥", description:"Faster",  execute:()=>{ this.setSpeed(+1); } },
          "ArrowDown":  { symbol:"↧", description:"Slower", execute:()=>{ this.setSpeed(-1); } },
          "q": { symbol:"q", description:"Quit", execute:()=>{ this.history.replace("/", {}); } },
        }}>
        </w-commandpalette>

  }
}
