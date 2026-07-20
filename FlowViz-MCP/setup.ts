#!/usr/bin/env node

import { createInterface } from "node:readline";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir, platform } from "node:os";
import { execSync } from "node:child_process";

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string): Promise<string> {
  return new Promise((res) => rl.question(question, (answer) => res(answer.trim())));
}

function print(msg: string) {
  console.log(msg);
}

function printBlank() {
  console.log("");
}

function printDivider() {
  console.log("─".repeat(60));
}

function isValidGuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

async function askGuid(label: string, helpText: string): Promise<string> {
  printBlank();
  print(helpText);
  printBlank();

  while (true) {
    const val = await ask(`  ${label}: `);
    if (isValidGuid(val)) return val;
    print(`  That doesn't look right. It should be a format like: 12345678-abcd-1234-abcd-1234567890ab`);
    print(`  Try copying it again.`);
    printBlank();
  }
}

async function askChoice(question: string, options: string[]): Promise<string> {
  printBlank();
  print(question);
  options.forEach((opt, i) => print(`  ${i + 1}. ${opt}`));
  printBlank();

  while (true) {
    const val = await ask(`  Enter 1-${options.length}: `);
    const num = parseInt(val, 10);
    if (num >= 1 && num <= options.length) return options[num - 1];
    print(`  Please enter a number between 1 and ${options.length}.`);
  }
}

async function main() {
  printBlank();
  printDivider();
  print("  FlowViz MCP Setup");
  printDivider();
  print("  This will set up the FlowViz MCP server so you can query");
  print("  your flow metrics from Claude Desktop.");
  print("  It takes about 2 minutes. You can quit any time with Ctrl+C.");
  printDivider();

  // Step 1: Source type
  const sourceChoice = await askChoice(
    "Which version of FlowViz are you using?",
    ["Azure DevOps", "Jira"]
  );
  const sourceType = sourceChoice === "Azure DevOps" ? "ado" : "jira";

  // Step 2: Workspace ID
  const workspaceId = await askGuid(
    "Workspace ID",
    `Open your FlowViz report in the Power BI Service (app.powerbi.com).\n` +
    `  Look at the URL in your browser. It will look like:\n\n` +
    `  https://app.powerbi.com/groups/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX/reports/...\n\n` +
    `  Copy the value after /groups/ (the long ID with dashes).`
  );

  // Step 3: Dataset ID
  const datasetId = await askGuid(
    "Dataset ID",
    `Still in the Power BI Service, click on the dataset for your FlowViz report.\n` +
    `  (You can find it under your workspace's dataset list.)\n` +
    `  The URL will look like:\n\n` +
    `  https://app.powerbi.com/groups/.../datasets/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX/...\n\n` +
    `  Copy the value after /datasets/.`
  );

  // Step 4: Tenant ID
  const tenantId = await askGuid(
    "Tenant ID",
    `Go to portal.azure.com and search for "Microsoft Entra ID" in the search bar.\n` +
    `  Click on it, and you'll see a "Tenant ID" on the Overview page.\n` +
    `  Copy that value.`
  );

  // Write config
  printBlank();
  printDivider();
  print("  Writing config file...");
  printDivider();

  const configDir = join(homedir(), ".flowviz-mcp");
  const configPath = join(configDir, "config.json");

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  const config = {
    sourceType,
    workspaceId,
    datasetId,
    tenantId,
    clientId: "eb55ace0-b1c9-4a23-a4ec-676a241c0a16",
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  print(`  Saved to: ${configPath}`);

  // Build
  printBlank();
  printDivider();
  print("  Building the MCP server...");
  printDivider();
  printBlank();

  try {
    execSync("npm run build", { stdio: "inherit" });
    print("  Build complete.");
  } catch {
    print("  Build failed. Make sure you ran 'npm install' first.");
    print("  Run: npm install && npm run build");
    rl.close();
    process.exit(1);
  }

  // Generate Claude Desktop config snippet
  printBlank();
  printDivider();
  print("  Almost done! One last step.");
  printDivider();
  printBlank();

  const distPath = resolve("dist", "index.js");
  const isWindows = platform() === "win32";

  const configSnippet = JSON.stringify(
    {
      mcpServers: {
        flowviz: {
          command: "node",
          args: [distPath],
        },
      },
    },
    null,
    2
  );

  print("  Add this to your Claude Desktop config file.");
  printBlank();

  if (isWindows) {
    print("  The config file is usually at:");
    print(`  %APPDATA%\\Claude\\claude_desktop_config.json`);
  } else {
    print("  The config file is usually at:");
    print(`  ~/Library/Application Support/Claude/claude_desktop_config.json`);
  }

  printBlank();
  print("  If the file already exists with other MCP servers, just add the");
  print('  "flowviz" section inside the existing "mcpServers" block.');
  printBlank();
  printDivider();
  print(configSnippet);
  printDivider();
  printBlank();
  print("  After adding that, restart Claude Desktop.");
  print("  The first time it runs, you'll be asked to sign in with your");
  print("  Microsoft account in a browser. That only happens once.");
  printBlank();
  print("  Then try asking: \"What's our cycle time 85th percentile?\"");
  printBlank();
  printDivider();
  print("  Setup complete!");
  printDivider();
  printBlank();

  rl.close();
}

main().catch((err) => {
  console.error("Setup failed:", err);
  rl.close();
  process.exit(1);
});
