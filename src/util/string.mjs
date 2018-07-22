export function pad(input, targetLength, padChar) {
  input = input.toString();
  while(input.length < targetLength) {
    input = padChar + input;
  }
  return input;
}