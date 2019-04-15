import { Component, Prop } from '@stencil/core';
import { RouterHistory } from '@stencil/router';
import { Task } from '../../helpers/w-task';

class Inertia extends Task {
  posX: number = -1;
  posY: number;
  velX: number = 0;
  velY: number = 0;

  acc: number = 0.05;
  brake: number = 0.95;

  check(trackBox) :boolean {
    let x = trackBox.x;
    let y = trackBox.y;

    if (this.posX==-1) {
      this.posX = x;
      this.posY = y;
    }

    let dx = (x - this.posX) * this.acc;
    let dy = (y - this.posY) * this.acc;

    this.velX = (this.velX * this.brake) + dx;
    this.velY = (this.velY * this.brake) + dy;

    this.posX += this.velX;
    this.posY += this.velY;

//    console.log("pos", this.posX, this.posY);
//    console.log("velo", this.velX, this.velY);

    return false;
  }

  draw(ctx,w,h) {
      ctx.save();
        ctx.fillStyle = "red";
        ctx.translate(w*this.posX,h*this.posY);
        ctx.fillRect(-2, -100, 4, 200);
        ctx.fillRect(-100, -2, 200, 4);
      ctx.restore();

      ctx.translate(100,50);
      ctx.fillStyle = "white";
      ctx.textAlign = "left";

      ctx.font = "bold 26px Barlow";
      ctx.fillText("Observe Inertia", 0, 10);

      ctx.font = "26px Barlow";
      ctx.fillText(""+Math.round(this.acc*100), 0, 40);
  }

  commands() {
    return {
        "ArrowLeft":  { symbol:"↤", description:"Slower",  execute:()=>{ 
          this.acc = Math.max(0.01, this.acc - 0.01);
          this.brake = 1.0 - this.acc;
        } },
        "ArrowRight": { symbol:"↦", description:"Faster",  execute:()=>{ 
          this.acc = Math.min(0.1, this.acc + 0.01); 
          this.brake = 1.0 - this.acc;
        } },
    }
  }

  toString() {
    return "Observe Inertia";
  }
}


@Component({
  tag: 'w-inertia',
  styleUrl: 'w-inertia.css',
  shadow: true
})
export class WInertia {

  @Prop() history: RouterHistory;

  componentDidLoad() {
  }

  componentDidUnload() {
  }

  render() {
    return <w-tasks history={this.history} tasks={[
      new Inertia(),
    ]}/>
  }
}
