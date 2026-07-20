# FlowViz MCP Server

Query your FlowViz flow metrics directly from Claude (or any MCP-compatible client) by chatting in natural language. This MCP server connects to your published FlowViz Power BI dataset and returns the same numbers you see in your dashboards.

For the Azure DevOps version, see [FlowViz](https://github.com/nbrown02/FlowViz/tree/main/FlowViz-MCP).

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
- [Node.js](https://nodejs.org/) version 18 or later installed on your machine (choose the LTS version)

## Setup

### 1. Get the files onto your machine

**If you're comfortable with Git:**
```
git clone https://github.com/nbrown02/FlowViz-Jira.git
```

**If not**, download and unzip from this link:
https://github.com/nbrown02/FlowViz-Jira/archive/refs/heads/main.zip

### 2. Run the setup

Open the `FlowViz-MCP` folder and:

- **Windows:** Double-click `WindowsSetup.bat`
- **Mac:** Double-click `MacSetup.sh` (if it opens as a text file, right-click it, choose Open With, then Terminal)

The setup wizard will:

1. Ask whether you use Azure DevOps or Jira
2. Ask you to paste the URL of your FlowViz report from Power BI (just copy it from your browser)
3. Ask you to sign in with your Microsoft account (a browser window will open)
4. Automatically find your dataset and save the config
5. Give you the exact text to paste into Claude Desktop

## Privacy

This server runs entirely on your local machine. Your data never leaves your network. No data passes through any third-party server.

## License

MIT
