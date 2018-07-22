// these are for convenience and readability
const UNITS = {};
UNITS.SECONDS = 1000, // milliseconds
UNITS.MINUTES = 60 * UNITS.SECONDS;
UNITS.HOURS = 60 * UNITS.SECONDS;

const CONSTANTS = {
  DAY_LENGTH: 30 * UNITS.SECONDS,

  UNITS,
};


export default CONSTANTS;