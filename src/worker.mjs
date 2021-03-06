const TICK_RATE = 120; //hz
const TIME_PER_TICK = 1 / TICK_RATE * 1000; // milliseconds

import CONSTANTS from "./constants.mjs";

let timestamp = CONSTANTS.DAY_LENGTH / 24 * 6; // start at 6am
let sharedBuffer = null;
let sharedBufferView = null;

async function tick(dt) {
  timestamp += dt;
  Atomics.store(sharedBufferView, 0, timestamp);
}

async function sleep(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

let PAUSE = false;

async function loop() {
  let lastFrameTime = performance.now();
  while(true) {
    if(PAUSE) {
      return;
    }
    const frameStartTime = performance.now();
    await tick(frameStartTime - lastFrameTime);
    lastFrameTime = performance.now();
    const frameDuration = lastFrameTime - frameStartTime;
    await sleep(TIME_PER_TICK - frameDuration);
  }
}

function initSharedBuffer(buffer) {
  sharedBuffer = buffer;
  sharedBufferView = new Uint32Array(sharedBuffer);
}

self.addEventListener("message", async function(event) {
  let data = event.data;
  if(data.type === "start") {
    initSharedBuffer(data.buffer);
    setTimeout(loop);
  }
  if(data.type === "simulate") {
    PAUSE = true;
    const numberOfTicks = data.duration / TIME_PER_TICK;
    const tickCount = Math.floor(numberOfTicks);
    const tickRemainder = (numberOfTicks - tickCount) * TIME_PER_TICK;

    for(let i = 0; i < tickCount; i++) {
      await tick(TIME_PER_TICK);
    }
    if(tickRemainder) {
      await tick(tickRemainder);
    }

    postMessage({
      type: "simulateEnd",
    });
    PAUSE = false;
    setTimeout(loop);
  }
});