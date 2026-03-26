import { spawn } from "node:child_process";
import minimist from "minimist";
import { assertDeckExists, parseDeckArg } from "./lib.mjs";

const argv = minimist(process.argv.slice(2));
const deck = parseDeckArg(argv);
const slidesPath = assertDeckExists(deck);

const args = ["slidev", slidesPath, "--open"];

const child = spawn("npx", args, { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 0));
