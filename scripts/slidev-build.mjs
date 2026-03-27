import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import minimist from "minimist";
import { ROOT, assertDeckExists, parseDeckArg } from "./lib.mjs";

const argv = minimist(process.argv.slice(2));
const deck = parseDeckArg(argv);
const slidesPath = assertDeckExists(deck);
const basePrefix = resolveBasePrefix(argv);

const segments = deck.split("/").filter(Boolean);
const outputDir = path.join(ROOT, "dist", ...segments);
fs.mkdirSync(outputDir, { recursive: true });

const args = ["slidev", "build", slidesPath, "--out", outputDir, "--base", `${basePrefix}/${deck}/`];
const child = spawn("npx", args, { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 0));

function resolveBasePrefix(parsedArgv) {
  const raw =
    parsedArgv["base-prefix"] ||
    parsedArgv.basePrefix ||
    process.env.BASE_PREFIX ||
    "";

  if (raw) {
    const cleaned = String(raw).replace(/^\/+|\/+$/g, "");
    return cleaned ? `/${cleaned}` : "";
  }

  // On GitHub Actions, infer /<repo> from owner/repo
  const repoEnv = process.env.GITHUB_REPOSITORY || "";
  const repoName = repoEnv.includes("/") ? repoEnv.split("/")[1] : "";
  return repoName ? `/${repoName}` : "";
}
