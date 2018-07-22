const gameloop = new Worker("./worker.js");

const state = {
  timestamp: 0,
};

if(!window.SharedArrayBuffer) {
  let flagLoc = "";
  if(navigator.userAgent.match(/Chrome/)) {
    flagLoc = "<a href='chrome://flags/#shared-array-buffer' target=_blank>chrome://flags/#shared-array-buffer</a>";
  }
  if(navigator.userAgent.match(/Firefox/)) {
    flagLoc = "open about:config in a new tab and enable javascript.options.shared_memory";
  }
  document.querySelector("#debug").innerHTML = "No SharedArrayBuffer support. " + flagLoc;
}

const sharedBuffer = new SharedArrayBuffer(8);
const sharedBufferView = new Uint32Array(sharedBuffer);

import FarmRenderer from "./components/farm_render.mjs";
import Grid from "./components/model/grid.mjs";
import UI from "./components/ui.mjs";

const canvas = document.querySelector("canvas");
const grid = new Grid(25, 25);

const DISPLAY_SIZE = 640;

window.DEBUG = document.getElementById("debug");
window.DEBUG.style.pointerEvents = "none";

window.addEventListener("resize", fitCanvasToScreen);

const farmView = new FarmRenderer(canvas, grid);

farmView.updateScene();

function fitCanvasToScreen() {
  let aspectRatio = window.innerHeight / window.innerWidth;
  farmView.resize(DISPLAY_SIZE, DISPLAY_SIZE * aspectRatio);
}

fitCanvasToScreen();

let lastUpdateTimestamp = null;

function tick(timestamp) {
  if(!lastUpdateTimestamp) {
    lastUpdateTimestamp = timestamp;
  }
  requestAnimationFrame(tick);

  let deltaTime = timestamp - lastUpdateTimestamp;
  state.timestamp = Atomics.load(sharedBufferView, 0);
  farmView.update(deltaTime, state);
  UI.update(deltaTime, state);
}

requestAnimationFrame(tick);

gameloop.postMessage({type: "start", buffer: sharedBuffer});

window.test = farmView;