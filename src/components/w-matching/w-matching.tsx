import { Component, Prop } from '@stencil/core';
import { RouterHistory } from '@stencil/router';
import { StandAtAngle, MoveTo } from '../../helpers/w-task';

@Component({
  tag: 'w-matching',
  styleUrl: 'w-matching.css',
  shadow: true
})
export class WMatching {

  @Prop() history: RouterHistory;

  componentDidLoad() {
  }

  componentDidUnload() {
  }

  render() {
    return <w-tasks history={this.history} tasks={[
      new StandAtAngle(45),
      new StandAtAngle(0),
      new StandAtAngle(180),
      new StandAtAngle(316),
      new MoveTo(0.8, 0.7),
      new StandAtAngle(95),
      new MoveTo(0.1, 0.75),
      new StandAtAngle(212),
      new StandAtAngle(114),
      new MoveTo(0.9, 0.23),
      new MoveTo(0.48, 0.78),
    ]}/>
  }
}
