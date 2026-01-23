export function raw(str: string) {
  console.info(str);
}

export function info(str: string) {
  console.info(`%c[INFO]%c ${str}`, "background-color: green; font-weight: bold;", "color: green;");
}

export function log(str: string) {
  console.log(`%c[LOG]%c ${str}`, "background-color: blue; font-weight: bold;", "color: blue;");
}
