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

  private keyboardListener:any;
  private showHelpTimer:number = 0;

  componentDidLoad() {
    this.analysis = new WAnalysis(640, 480,
      (width,height) => {
        this.tmp = new cv.Mat(height, width, cv.CV_32FC4);
        this.dst1 = new cv.Mat(height, width, cv.CV_8UC4);
      },
      (src,width,height) => {
        src.convertTo(this.tmp, cv.CV_32F);

        if (!this.background) {
          console.log("Set BG");
          this.background = new cv.Mat(height, width, cv.CV_32FC4);
          src.convertTo(this.background, cv.CV_32F);
        }

        cv.addWeighted(this.tmp, this.alpha, this.background, 1.0-this.alpha, 0, this.background);

        this.background.convertTo(this.dst1, cv.CV_8U);

        this.showHelpTimer--;
        if (this.showHelpTimer==0) this.showHelp = false;

        return this.dst1;
      },
      () => {
//        console.log("DRAW");
      });

    this.keyboardListener = (ev) => {
      console.log(ev.key);
      switch(ev.key) {
        
        case "q":
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

  componentDidUnload() {
    this.analysis.unload();
    window.removeEventListener("keydown", this.keyboardListener);
    delete this.keyboardListener;
  }

  render() {
      if (this.showHelp) {
        return <ul class="help">
            <li><span class="key">Q</span> Quit</li>
          </ul>;
      } else {
        return <div/>
      }
      //
  }
}
