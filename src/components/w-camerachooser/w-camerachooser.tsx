import { Component, Prop, State, EventEmitter, Event } from '@stencil/core';

@Component({
  tag: 'w-camerachooser',
  styleUrl: 'w-camerachooser.css',
  shadow: true
})
export class WCameraChooser {

  @State() cameras: MediaDeviceInfo[] = [];
  @State() selected: string = undefined;

  @Event() switchCamera: EventEmitter;

  componentDidLoad() {
    this.selected = window.localStorage.getItem("cameraDevice");
    this.enumerate();
    navigator.mediaDevices.ondevicechange = _e => { this.enumerate(); };
  }

  enumerate() {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      this.cameras = devices.filter(d => d.kind == "videoinput");

      let selectedFound = false;
      this.cameras.forEach(cam => { if(cam.deviceId == this.selected) selectedFound = true; });
      if (!selectedFound && this.cameras.length>0) {
        this.choose(this.cameras[0].deviceId);
      }
    });
  }

  choose(deviceId) {
    this.selected = deviceId;
    window.localStorage.setItem("cameraDevice", deviceId);
    this.switchCamera.emit(deviceId);
  }

  change(e) {
    this.choose(e.target.value);
  }

  render() {
    if (this.cameras.length<2) return <div/>
    return <div id="cameraChooser"><select onChange={e => this.change(e)}>
        { this.cameras.map(camera =>
            <option selected={this.selected == camera.deviceId} value={camera.deviceId}>{camera.label || camera.deviceId}</option>
          )}
      </select></div>
  }
}
