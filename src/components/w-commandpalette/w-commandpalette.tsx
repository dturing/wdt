import { Component, Prop, State, Listen } from '@stencil/core';
import { WCommandDefinition } from '../../helpers/w-commanddefinition';

@Component({
  tag: 'w-commandpalette',
  styleUrl: 'w-commandpalette.css',
  shadow: true
})
export class WCommandPalette {

  @Prop() commands: { [key: string]: WCommandDefinition };

  @State() helpVisible = false;
  private timeout;

  @Listen('window:keydown')
  handleKeyDown(ev: KeyboardEvent) {
    var cmd = this.commands[ev.key];
    if (cmd) {
      cmd.execute();
    } else {
      this.showHelp();
    }
  }

  showHelp() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
        this.helpVisible = false;
      }, 3000);
    this.helpVisible = true;
  }

  render() {
    if (this.helpVisible) {
      return <ul class="help">
        { Object.keys(this.commands).map((key) =>
            <li><span class="key">{ this.commands[key].symbol }</span> - { this.commands[key].description }</li>
          )}
      </ul>
    } else {
      return <div/>
    }
  }
}
