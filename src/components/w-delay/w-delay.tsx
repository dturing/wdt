import { Component, Prop, Watch } from '@stencil/core';
import { WAnalysis } from '../../helpers/w-analysis';
import { CV as cv } from '../../helpers/cv';

@Component({
  tag: 'w-delay',
  styleUrl: 'w-delay.css',
  shadow: true
})
export class WDelay {

  @Prop({ mutable:true }) speed: number = 1.0;

  @Prop({ mutable:true }) frames: number = 30*3;
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

  private analysis:WAnalysis;

  private inputWidth:number;
  private inputHeight:number;

  private tape = [];
  private readPos:number = 0;
  private actualWritePos:number = 0;
  private writePos:number = 0;

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
    this.writePos = this.actualWritePos = this.frames-3;

    if (this.analysis) {
      console.log("Analysis exists. clear first");
      this.analysis.unload();
    }
    this.analysis = new WAnalysis(640, 480,
      (width,height) => {
        this.inputWidth = width;
        this.inputHeight = height;
        for (let i=0; i<this.frames; i++) {
           this.tape[i] = new cv.Mat(width, height, cv.CV_8UC4);
        }
      },
      (src,_width,_height, t) => {

        let fps = 30;

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


        return ret;
      },
      (ctx,w,h) => {
        ctx.clearRect(0,0,w,h);
        ctx.save();

        ctx.font = "26px Barlow";
        ctx.fillStyle = "white";
        ctx.fillText(""+(this.frames/30)+"s", 30, 50);

        let l = 300;

        ctx.strokeWidth = 0.2;
        ctx.translate(30,70);
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(l,0);
//        ctx.closePath();
        ctx.strokeStyle = "white";
        ctx.stroke();

        ctx.strokeStyle = "none";

        ctx.save();
          ctx.fillStyle = "#8ae234";
          ctx.translate((this.readPos/this.frames)*l,0);
          this.fillTriangle(ctx);
        ctx.restore();

        ctx.save();
          ctx.fillStyle = "#ef2929";
          ctx.translate((this.actualWritePos/this.frames)*l,0);
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
     console.log("Initialized analysis:", this.analysis);
  }

  componentDidUnload() {
    console.log("DidUnload");
    this.analysis.unload();
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
      return (<div/>);
  }
}
