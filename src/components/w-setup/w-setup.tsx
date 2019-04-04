import { Component, State } from '@stencil/core';
import { WAnalysis } from '../../helpers/w-analysis';
import { loadOpenCv, CV as cv } from '../../helpers/cv';

@Component({
  tag: 'w-setup',
  styleUrl: 'w-setup.css',
  shadow: true
})
export class WSetup {

  private analysis:WAnalysis;
  @State() loading = true;

  private dst1:any;

  componentDidLoad() {
      loadOpenCv((_cv)=>{
        this.loading = false;
      });

    this.analysis = new WAnalysis(640, 480,
      (width,height) => {
        this.dst1 = new cv.Mat(height, width, cv.CV_8UC4);
      },
      (src,_width,_height) => {
        cv.cvtColor(src, this.dst1, cv.COLOR_RGBA2GRAY);
        cv.cvtColor(this.dst1, src, cv.COLOR_GRAY2RGBA);
        return src;
      },
      () => {
//        console.log("DRAW");
      });
  }

  componentDidUnload() {
    this.analysis.unload();
  }

  render() {
    if (this.loading) {
      return <div class="loading">Loading...</div>;
    }

    return <slot/>
  }
}
