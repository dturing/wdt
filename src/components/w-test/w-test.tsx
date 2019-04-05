import { Component, Prop } from '@stencil/core';
import { RouterHistory } from '@stencil/router';

@Component({
  tag: 'w-test',
  styleUrl: 'w-test.css',
  shadow: true
})
export class WTest {
  @Prop() history: RouterHistory;

  componentDidLoad() {
  }

  componentDidUnload() {
  }

  render() {
    return <div>
        <w-commandpalette commands={{
          "t": { symbol:"t", description:"Test Command", execute:()=>{ console.log("exec TEST"); } },
          "x": { symbol:"x", description:"X Command", execute:()=>{ console.log("exec X"); } },
          "q": { symbol:"q", description:"Quit", execute:()=>{ this.history.replace("/", {}); } },
        }}>
        </w-commandpalette>
      </div>
  }
}
