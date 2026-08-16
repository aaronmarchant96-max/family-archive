<!--
CARDO REI methodology applied to this document.
Reference: [CARDO REI Methodology](PROMPTHOUND-DOCS/CARDO-REI.md)
-->

# Copilot & Codex Agent Tooling Guide

This document lists the recommended CLI utilities, IDE plugins, and Model Context Protocol (MCP) integrations required to optimize downstream execution for agentic models (Codex, Copilot Pro) working on the Marchant Family Archive and "Children of the Frontier."

---

## 1. System CLI Tools (Install to `~/.local/bin` without `sudo`)
These tools must be on the execution PATH so that Codex/Copilot can run discovery passes efficiently:

*   **`rg` (ripgrep):** For ultra-fast recursive code and timeline indexing.
    *   *Command:* `npx -y ripgrep-bin` or compile/install directly to `~/.local/bin/rg`.
*   **`fd` (fd-find):** For fast file searching across directories.
    *   *Command:* Add symbolic link `ln -s $(which fdfind) ~/.local/bin/fd` (or build without sudo).
*   **`bat`:** A cat clone with syntax highlighting for reviewing JSON schema outputs.
*   **`eza`:** A modern replacement for `ls` to let agents visual directory structures cleanly.

---

## 2. Recommended IDE Extensions (VS Code / Cursor)
When developing or testing locally:

*   **Jest (Or Jest Runner):** Adds inline `Run | Debug` buttons above test blocks. Crucial for verifying `/home/potatoking/family-archive/__tests__/children-of-frontier.test.ts` and `archive-integrity.test.ts` with a single click.
*   **Live Server / Five Server:** For hosting local browser prototypes (like Breakout or Oregon Trail Climb) without needing to configure Next.js router rules.
*   **GitLens:** Provides inline git history, enabling models to audit exactly when timeline contradictions were committed.
*   **Prettier & ESLint:** Enforces styling guidelines to prevent models from committing invalid bracket syntaxes.

---

## 3. Model Context Protocol (MCP) Connectors
Configure these in the agent configuration (`~/.copilot/config.json` or `config.json` for Codex) to bridge the model's reasoning capabilities directly to local databases:

### A. SQLite MCP Server
- **Role:** Allows models to run SQL statements directly on your local database files.
- **Config:**
  ```json
  "mcpServers": {
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "--db", "/home/potatoking/family-archive/data/game_runs.db"]
    }
  }
  ```

### B. Filesystem MCP Server
- **Role:** Grants agents permission-safe read/write operations within the project bounds.
- **Config:**
  ```json
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/potatoking/family-archive"]
    }
  }
  ```

### C. Memory MCP Server
- **Role:** A persistent key-value store. Allows Copilot to remember custom lineage guidelines, Same-Name disambiguation policies, and project rules across separate conversation instances.
