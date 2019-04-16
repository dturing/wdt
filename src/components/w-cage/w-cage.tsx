import { Component, Prop, Method } from '@stencil/core';
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

  private analysis:WAnalysis;

  private inputWidth:number;
  private inputHeight:number;

  private tmp:any;
  private tmp2:any;
  private dst1:any;
  private dst2:any;
  private background:any;

  private current:Rectangle = { l:0, r:0, t:0, b:0 };
  private isInside:boolean = true;


  private audioElement!: HTMLAudioElement;

  componentDidLoad() {
    if (this.analysis) {
      console.log("Analysis exists. clear first");
      this.analysis.unload();
    }
    this.analysis = new WAnalysis(160, 120,
      (width,height) => {
        this.inputWidth = width;
        this.inputHeight = height;
        this.tmp  = new cv.Mat(height, width, cv.CV_32FC4);
        this.tmp2 = new cv.Mat(height, width, cv.CV_32FC1);
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
          ctx.strokeRect(this.left*w,this.top*h,( this.right-this.left)*w,(this.bottom-this.top)*h)

          ctx.strokeStyle = this.isInside ? "#8ae234" : "#edd400";
          ctx.strokeRect(this.current.l*w,this.current.t*h,( this.current.r-this.current.l)*w,(this.current.b-this.current.t)*h)

        ctx.restore();
      });

    this.playSound();

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

  @Method() playSound() {
    this.audioElement.play();
  }

  render() {
    return <div>
        <audio src="/assets/sound/rassel.ogg" loop preload="auto" volume="0" ref={ (el) => this.audioElement = el as HTMLAudioElement }></audio>
        <w-commandpalette commands={{
          "q": { symbol:"q", description:"Quit", execute:()=>{ this.history.replace("/", {}); } },
          " ": { symbol:"space", description:"Reset", execute:()=>{ this.background.delete(); this.background=null; } },
        }}>
        </w-commandpalette>
      </div>
  }
}
