export function isColorEnabled(): boolean {
  return !process.env.NO_COLOR && Boolean(process.stdout.isTTY);
}

function wrap(code: string) {
  return (text: string) => (isColorEnabled() ? `\x1b[${code}m${text}\x1b[0m` : text);
}

export const color = {
  red: wrap("31"),
  green: wrap("32"),
  yellow: wrap("33"),
  cyan: wrap("36"),
  dim: wrap("2"),
  bold: wrap("1"),
};
