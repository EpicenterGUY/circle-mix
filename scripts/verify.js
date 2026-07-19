"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const commands = [
  [npm, ["test"]],
  [npm, ["run", "test:browser"]],
  ["git", ["diff", "--check"]],
  [process.execPath, [path.join("scripts", "check-release-metadata.js")]]
];

for (const [command, args] of commands) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
