#!/usr/bin/env node

import { createInterface } from "node:readline";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir, platform } from "node:os";
import {
  PublicClientApplication,
  type DeviceCodeRequest,
} from "@azure/msal-node";

const CLIENT_ID = "eb55ace0-b1c9-4a23-a4ec-676a241c0a16";
const POWER_BI_SCOPE = "https://analysis.windows.net/powerbi/api/.default";

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
  console.log("-".repeat(60));
}

interface ParsedUrl {
  workspaceId: string;
  reportId: string;
}

function parseUrl(url: string): ParsedUrl | null {
  const groupsMatch = url.match(/groups\/([0-9a-f-]{36})/i);
  const reportsMatch = url.match(/reports\/([0-9a-f-]{36})/i);

  if (groupsMatch && reportsMatch) {
    return {
      workspaceId: groupsMatch[1],
      reportId: reportsMatch[1],
    };
  }
  return null;
}

async function authenticate(tenantId: string): Promise<{ accessToken: string; resolvedTenantId: string }> {
  const msalApp = new PublicClientApplication({
    auth: {
      clientId: CLIENT_ID,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
  });

  const request: DeviceCodeRequest = {
    scopes: [POWER_BI_SCOPE],
    deviceCodeCallback: (response) => {
      printBlank();
      print(`  ${response.message}`);
      printBlank();
    },
  };

  const result = await msalApp.acquireTokenByDeviceCode(request);
  if (!result) {
    throw new Error("Authentication failed");
  }

  return {
    accessToken: result.accessToken,
    resolvedTenantId: result.tenantId || tenantId,
  };
}

async function getDatasetId(
  accessToken: string,
  workspaceId: string,
  reportId: string
): Promise<string> {
  const url = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to look up dataset: ${response.status} ${body}`);
  }

  const data = await response.json();
  if (!data.datasetId) {
    throw new Error("Could not find a dataset linked to this report.");
  }

  return data.datasetId;
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
  printDivider();

  // Step 1: Source type
  const sourceChoice = await askChoice(
    "Which version of FlowViz are you using?",
    ["Azure DevOps", "Jira"]
  );
  const sourceType = sourceChoice === "Azure DevOps" ? "ado" : "jira";

  // Step 2: Power BI URL
  printBlank();
  print("  Open your FlowViz report in the Power BI Service (app.powerbi.com).");
  print("  Copy the full URL from your browser's address bar and paste it below.");
  printBlank();

  let parsed: ParsedUrl | null = null;
  while (!parsed) {
    const url = await ask("  Power BI URL: ");
    parsed = parseUrl(url);
    if (!parsed) {
      printBlank();
      print("  That doesn't look like a Power BI report URL.");
      print("  It should look something like:");
      print("  https://app.powerbi.com/groups/xxx/reports/xxx/...");
      print("  Try copying it again.");
      printBlank();
    }
  }

  print(`  Workspace ID: ${parsed.workspaceId}`);
  print(`  Report ID:    ${parsed.reportId}`);

  // Step 3: Authenticate
  printBlank();
  printDivider();
  print("  Now sign in with your Microsoft account.");
  print("  This is the same account you use to access Power BI.");
  printDivider();

  const { accessToken, resolvedTenantId } = await authenticate("common");

  print("  Signed in successfully.");

  // Step 4: Look up dataset ID from report ID
  printBlank();
  print("  Looking up your FlowViz dataset...");

  const datasetId = await getDatasetId(
    accessToken,
    parsed.workspaceId,
    parsed.reportId
  );

  print(`  Dataset ID:   ${datasetId}`);

  // Write config
  printBlank();
  printDivider();
  print("  Saving config...");
  printDivider();

  const configDir = join(homedir(), ".flowviz-mcp");
  const configPath = join(configDir, "config.json");

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  const config = {
    sourceType,
    workspaceId: parsed.workspaceId,
    datasetId,
    tenantId: resolvedTenantId,
    clientId: CLIENT_ID,
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  print(`  Saved to: ${configPath}`);

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
  print('  Then try asking: "What\'s our cycle time 85th percentile?"');
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
