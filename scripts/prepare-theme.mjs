import { readFile, writeFile } from "node:fs/promises";
const colors = JSON.parse(await readFile("src/styles/palette.json", "utf8"));
// HTML metadata and web CSS derive their colors from the same palette.
const css =
  "/* Generated from palette.json by scripts/prepare-theme.mjs. */\n:root {\n" +
  Object.entries(colors)
    .map(([name, value]) => `  --${name}: ${value};`)
    .join("\n") +
  "\n}\n";
await writeFile("src/styles/palette.css", css);
