const gameloop = new Worker("./worker.js");

const state = {
  timestamp: 0,
};

gameloop.addEventListener("message", (event) => {
  let data = event.data;
  let type = data.type;
  if(type === "stateUpdate") {
    Object.assign(state, data.state);
  }
});

import FarmRenderer from "./components/farm_render.mjs";
import Grid from "./components/model/grid.mjs";

const canvas = document.querySelector("canvas");
const grid = new Grid(25, 25);

const DISPLAY_SIZE = 640;


window.addEventListener("resize", fitCanvasToScreen);

const farmView = new FarmRenderer(canvas, grid);

farmView.updateScene();

function fitCanvasToScreen() {
  farmView.resize(DISPLAY_SIZE, DISPLAY_SIZE);
}

fitCanvasToScreen();


async function main() {

}


let lastUpdateTimestamp = null;

function tick(timestamp) {
  if(!lastUpdateTimestamp) {
    lastUpdateTimestamp = timestamp;
  }
  requestAnimationFrame(tick);

  let deltaTime = timestamp - lastUpdateTimestamp;
  farmView.update(deltaTime, state);
}

requestAnimationFrame(tick);

main();

gameloop.postMessage({type: "start"});

window.test = farmView;