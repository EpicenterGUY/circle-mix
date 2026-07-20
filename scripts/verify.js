"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npmExecPath = process.env.npm_execpath;
const npmCommand = npmExecPath ? process.execPath : npm;
const npmArgs = args => npmExecPath ? [npmExecPath, ...args] : args;
const commands = [
  [npmCommand, npmArgs(["test"])],
  [npmCommand, npmArgs(["run", "test:browser"])],
  ["git", ["diff", "--check"]],
  [process.execPath, [path.join("scripts", "check-release-metadata.js")]]
];

for (const [command, args] of commands) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const useWindowsCommandShell = process.platform === "win32" && !npmExecPath && /\.cmd$/i.test(command);
  const result = spawnSync(command, args, { stdio: "inherit", shell: useWindowsCommandShell });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
