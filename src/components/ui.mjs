const INTERFACE = {};
INTERFACE.clock = document.querySelector("#clock");

import CONSTANTS from "../constants.mjs";

import {formatTimestamp} from "../util/time.mjs";

/*
* Given a string, wraps each character in a <mono> tag
* (which will be styled to ensure a fixed width)
* primarily used to make clocks look good 
*/
function splitIntoMonospace(string) {
  return string.split("").map(char => `<mono>${char}</mono>`).join("");
}

class UI {
  static update(dt, state) {
    let time_of_day = state.timestamp % CONSTANTS.DAY_LENGTH;
    let formattedTime = formatTimestamp(time_of_day);
    INTERFACE.clock.innerHTML = splitIntoMonospace(formattedTime.time);
    INTERFACE.clock.classList.toggle("am", formattedTime.am);
  }
}

export default UI;