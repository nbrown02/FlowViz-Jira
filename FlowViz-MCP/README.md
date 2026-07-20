# FlowViz MCP Server

Query your FlowViz flow metrics directly from Claude (or any MCP-compatible client) by chatting in natural language. This MCP server connects to your published FlowViz Power BI dataset and returns the same numbers you see in your dashboards.

For the Azure DevOps version, see [FlowViz](https://github.com/nbrown02/FlowViz).

## What can you ask?

- "What's our cycle time 85th percentile for the last 90 days?"
- "Show me weekly throughput for the last quarter"
- "Which items in progress are at risk of exceeding our cycle time?"
- "What's our flow efficiency?"
- "Are any items currently blocked?"
- "If we have 30 items left, when will we finish?"

## Available tools

| Tool | Description |
|------|-------------|
| `get_cycle_time` | Cycle time percentiles (50th, 85th, or any), average, and max |
| `get_throughput` | Completed item counts, bug rate, weekly breakdowns |
| `get_wip` | Average daily WIP, net flow (started vs completed) |
| `get_aging` | Work item age, probability of exceeding 85th percentile cycle time |
| `get_flow_efficiency` | Ratio of active time to total time, time in column breakdown |
| `get_blocked` | Blocked item counts, days lost, currently blocked items |
| `run_forecast` | Monte Carlo simulation for delivery date forecasting |

## Prerequisites

- Your FlowViz report is **published to the Power BI Service** (not just open locally in Power BI Desktop)
- [Node.js](https://nodejs.org/) version 18 or later installed on your machine

## Setup

Open a terminal, navigate to this folder, and run:

```bash
npm install
npm run setup
```

The setup wizard will walk you through everything step by step. It will:

1. Ask which version of FlowViz you use (Azure DevOps or Jira)
2. Ask for your Power BI workspace ID (with instructions on where to find it)
3. Ask for your Power BI dataset ID (same)
4. Ask for your Azure tenant ID (same)
5. Save your config file automatically
6. Build the server
7. Give you the exact JSON to paste into your Claude Desktop config

That's it. After adding the config to Claude Desktop and restarting, the first time it runs you'll be asked to sign in with your Microsoft account in a browser. That only happens once.

## Privacy

This server runs entirely on your local machine. Your data never leaves your network. No data passes through any third-party server.

## License

MIT
