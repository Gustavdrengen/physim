let rawMode = false;

export function enableRawMode() {
  rawMode = true;
}

export function isRawModeEnabled(): boolean {
  return rawMode;
}

export function raw(str: string) {
  console.info(str);
}

export function info(str: string) {
  if (rawMode) return;
  console.info(`%c[INFO]%c ${str}`, "background-color: green; font-weight: bold;", "color: green;");
}

export function log(str: string) {
  if (rawMode) return;
  console.log(`%c[LOG]%c ${str}`, "background-color: blue; font-weight: bold;", "color: blue;");
}
