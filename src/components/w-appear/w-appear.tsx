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

  @Prop() alpha: number = 0.006;

  @State() showHelp = false;

  private analysis:WAnalysis;

  private tmp:any;
  private dst1:any;
  private background:any;

  componentDidLoad() {
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

        cv.addWeighted(this.tmp, this.alpha, this.background, 1.0-this.alpha, 0, this.background);

        this.background.convertTo(this.dst1, cv.CV_8U);

        return this.dst1;
      },
      () => {
//        console.log("DRAW");
      });
  }

  componentDidUnload() {
    this.analysis.unload();
  }

  render() {
    return <w-commandpalette commands={{
          "q": { symbol:"q", description:"Quit", execute:()=>{ this.history.replace("/", {}); } },
        }}>
        </w-commandpalette>

  }
}
