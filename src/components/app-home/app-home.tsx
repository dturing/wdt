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

          <stencil-route-link url='/appear'>
            <button>
              Appear/Disappear
            </button>
          </stencil-route-link>
          <stencil-route-link url='/delay'>
            <button>
              Delay and Reverse
            </button>
          </stencil-route-link>
        </div>
      </w-setup>
    );
  }
}
