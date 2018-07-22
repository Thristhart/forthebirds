import {pad} from "./string.mjs";

import CONSTANTS from "../constants.mjs";

const MILLIS_PER_HOUR = CONSTANTS.DAY_LENGTH / 24;
const MILLIS_PER_MINUTE = MILLIS_PER_HOUR / 60;

//TODO: allow for 24hr / 12hr toggle
export function formatTimestamp(time_of_day) {
  let am = true;
  let hours = Math.floor(time_of_day / MILLIS_PER_HOUR);
  let minutes = Math.floor((time_of_day - hours * MILLIS_PER_HOUR) / MILLIS_PER_MINUTE);
  if(hours >= 12) {
    am = false;
    hours -= 12;
  }
  if(hours === 0) {
    hours = 12;
  }
  return {time: `${pad(hours, 2, "0")}:${pad(minutes, 2, "0")}`, am};
}