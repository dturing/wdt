import { Component } from '@stencil/core';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.css',
  shadow: true
})
export class AppHome {

  render() {
    return (
      <w-setup>
        <div class='app-home'>
          <p>
            Welcome to the 2019 version of <b>Whatever Dance Tool</b>.
          </p>

          <p>
            This is very much in development. Lots of things will not work as expected.
          </p>

          <stencil-route-link url='/matching'>
            <button>
              <img src="/assets/img/matching.png" /><br/>
              Matching Positions
            </button>
          </stencil-route-link>
          <stencil-route-link url='/inertia'>
            <button>
              <img src="/assets/img/inertia.png" /><br/>
              Inertia
            </button>
          </stencil-route-link>
          <stencil-route-link url='/cage'>
            <button>
              <img src="/assets/img/cage.png" /><br/>
              Cage
            </button>
          </stencil-route-link>

          <br/>

          <stencil-route-link url='/capture'>
            <button>
              <img src="/assets/img/capture.png" /><br/>
              Capture and Replay
            </button>
          </stencil-route-link>
          <stencil-route-link url='/delay'>
            <button>
              <img src="/assets/img/delay.png" /><br/>
              Reverse and Delay
            </button>
          </stencil-route-link>
          <stencil-route-link url='/appear'>
            <button>
              <img src="/assets/img/appear.png" /><br/>
              Appear/Disappear
            </button>
          </stencil-route-link>
        </div>
      </w-setup>
    );
  }
}
