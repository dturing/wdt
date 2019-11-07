import { Component, Prop, Method, State } from '@stencil/core';
import { RouterHistory } from '@stencil/router';
import { WAnalysis } from '../../helpers/w-analysis';
import { CV as cv } from '../../helpers/cv';
import { Task, Settle, StandAtAngle, MoveTo } from '../../helpers/w-task';
import { WCommandDefinition } from '../../helpers/w-commanddefinition';

@Component({
  tag: 'w-tasks',
  styleUrl: 'w-tasks.css',
  shadow: true
})
export class WCapture {
  @Prop() history: RouterHistory;
  @Prop({ mutable: true }) tasks: Array<Task>;

  @State() showEditor: boolean = false;
  @State() taskCommands: { [key: string]: WCommandDefinition };

  private analysis:WAnalysis;

  private inputWidth:number;
  private inputHeight:number;

  private tmp:any;
  private dst1:any;
  private dst2:any;
  private background:any;

  private trackBox:any;
  private lastangle = -10000;

  private sensitivity:number = 5;

  private audioElement!: HTMLAudioElement;

  private currentTask:Task = new Settle();
  private taskIndex = -1;

  private taskList!: HTMLTextAreaElement;

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
            angle = angle % 360;
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
            this.switchTaskBy(1);
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
    cv.threshold(this.dst1, this.dst2, this.sensitivity * 10, 150, cv.THRESH_BINARY);

    
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

  setSensitivity(change:number) {
    this.sensitivity += change;

    if (this.sensitivity > 10) this.sensitivity = 10;
    if (this.sensitivity < 1) this.sensitivity = 1;
  }

  switchTaskBy(by:number) {
    return this.switchTaskTo(this.taskIndex+by);
  }

  switchTaskTo(to:number) {
      while (to<0) to+=this.tasks.length;
      this.taskIndex = to%this.tasks.length;
      this.currentTask = this.tasks[this.taskIndex];
      this.taskCommands = this.currentTask.commands();
  }

  editTasks() {
    this.showEditor = !this.showEditor;
  }

  getTaskListString() {
    return this.tasks.map(t => t.toShortString()).join("\n");
  }

  onKeyDown(e) {
    e.stopPropagation();
  }

  applyTaskList() {
    var newTasks = this.taskList.value.split("\n").map(line => {
      var d = line.split(" ");
      switch (d[0]) {
        case "StandAtAngle":
          return new StandAtAngle(parseFloat(d[1]));
        case "MoveTo":
          return new MoveTo(parseFloat(d[1]), parseFloat(d[2]));
      }

      return new MoveTo(0.5,0.5);
    });

    this.tasks = newTasks;
    this.switchTaskBy(0);
  }

  render() {
    return <div>
        <audio src="/assets/sound/pluck.ogg" preload="auto" ref={ (el) => this.audioElement = el as HTMLAudioElement }></audio>
        { this.showEditor
            ? <div class="taskEditor">
                <textarea 
                  rows={15} cols={20}
                  onKeyDown={e => this.onKeyDown(e)}
                  onKeyUp={_e => this.applyTaskList()}
                  ref={(el) => this.taskList = el as HTMLTextAreaElement}
                  >{this.getTaskListString()}</textarea>
                <br />
                <button onClick={ _e => this.editTasks() }>Hide</button>
               </div>
            : ""
        }
        <w-commandpalette commands={{
          ...this.taskCommands,
          "ArrowUp":    { symbol:"↥", description:"Increase Sensitivity",  execute:()=>{ this.setSensitivity(+1); } },
          "ArrowDown":  { symbol:"↧", description:"Decrease Sensitivity", execute:()=>{ this.setSensitivity(-1); } },
          "e": { symbol:"e", description:"Edit Tasks", execute:()=>{ this.editTasks(); } },
          "n": { symbol:"n", description:"Next Task", execute:()=>{ this.switchTaskBy(1); } },
          "p": { symbol:"p", description:"Previous Task", execute:()=>{ this.switchTaskBy(-1); } },
          "q": { symbol:"q", description:"Quit", execute:()=>{ this.history.replace("/", {}); } },
          " ": { symbol:"space", description:"Reset", execute:()=>{ this.background.delete(); this.background=null; } },
        }}>
        </w-commandpalette>
      </div>
  }
}
