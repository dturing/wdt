import { Component, Prop, State, Method } from '@stencil/core';

@Component({
  tag: 'w-countdown',
  styleUrl: 'w-countdown.css',
  shadow: true
})
export class WCountdown {

  @State() name: string = "";
  @Prop({ mutable:true} ) timeToGo: number = 0;

  private audioElement!: HTMLAudioElement;

  @Method() startCountdown(name:string, seconds:number, callbackFn:()=>void) {
    this.name = name;
    this.timeToGo = seconds;

    this.playSound();

    let interval;
    interval = setInterval(()=>{
      this.timeToGo--;
      this.playSound();
      if (this.timeToGo <= 0 ) {
        callbackFn();
        clearInterval(interval);
      }
    }, 1000);
  }

  playSound() {
    this.audioElement.play();
  }

  render() {
    return <div>
        <audio src="/assets/sound/pluck.ogg" preload="auto" ref={ (el) => this.audioElement = el as HTMLAudioElement }></audio>
        {this.timeToGo > 0
          ? <div class="countdown">{ this.timeToGo }</div>
          : <div/>
        }
      </div>
  }
}
