
export var CV:any  = null;
declare var cv;

var callbacks = undefined;

const OPENCV_URL = 'assets/opencv.js';
export function loadOpenCv(onloadCallback) {
    if (CV) {
        onloadCallback(CV);
        return;
    }

    if (callbacks) {
        callbacks.push(onloadCallback);
        return;
    }

    callbacks = [ onloadCallback ];

    let script = document.createElement('script');
    script.setAttribute('async', '');
    script.setAttribute('type', 'text/javascript');
    script.addEventListener('load', () => {
        CV = cv;
        callbacks.forEach(cb => cb(CV));
    });
    script.addEventListener('error', () => {
        console.log('Failed to load ' + OPENCV_URL);
    });
    script.src = OPENCV_URL;
    let node = document.getElementsByTagName('script')[0];
    node.parentNode.insertBefore(script, node);
};
