import { Component } from '@stencil/core';
import '@stencil/router'

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.css',
  shadow: true
})
export class AppRoot {

  render() {
    return (
      <div>
        <main>
          <stencil-router>
            <stencil-route-switch scrollTopOffset={0}>
              <stencil-route url='/' component='app-home' exact={true} />
              <stencil-route url='/appear' component='w-appear' exact={true} />
              <stencil-route url='/delay' component='w-delay' exact={true} />
              <stencil-route url='/capture' component='w-capture' exact={true} />
              <stencil-route url='/matching' component='w-matching' exact={true} />
              <stencil-route url='/inertia' component='w-inertia' exact={true} />
            </stencil-route-switch>
          </stencil-router>
        </main>
      </div>
    );
  }
}
