import { WCommandDefinition } from './w-commanddefinition';


export class Task {

  check(_trackBox) :boolean {
    return true;
  }

  draw(_ctx,_w,_h) {
  }

  commands() :{ [key: string]: WCommandDefinition } {
    return {};
  }

  toString() {
    return "<base task>";
  }

  toShortString() {
    return "<base>";
  }
}

export class Settle extends Task {
  framesToGo: number = 30;

  check(_trackBox) :boolean {
    return (this.framesToGo-- <= 0);
  }
}

export class StandAtAngle extends Task {
  targetAngle: number;
  lastAngle: number;
  required: number = 5;

  constructor(targetAngle) {
    super();
    this.targetAngle = targetAngle;
  }

  check(trackBox) :boolean {
    this.lastAngle = trackBox.angle;
    if (trackBox.size.width > 50 && trackBox.size.height > 50) {
      if (Math.abs( this.targetAngle - this.lastAngle ) < 2) {
        this.required--;
      } else {
        this.required = 5;
      }
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

  toShortString() {
    return "StandAtAngle "+this.targetAngle;
  }
}

export class MoveTo extends Task {
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

  toShortString() {
    return "MoveTo "+(Math.round(this.targetX*100)/100)+" "+(Math.round(this.targetY*100)/100);
  }
}
