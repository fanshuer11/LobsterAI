# AGENTS.md

This file provides guidance to AI coding agents (GitHub Copilot, OpenAI Codex, Cursor, etc.) when working with code in this repository. See also `CLAUDE.md` for Claude-specific guidance.

## Build and Development Commands

```bash
# Development - starts Vite dev server (port 5175) + Electron app with hot reload
npm run electron:dev

# Build production bundle (TypeScript + Vite)
npm run build

# Lint with ESLint
npm run lint

# Run memory extractor tests (Node.js built-in test runner)
npm run test:memory

# Compile Electron main process only
npm run compile:electron

# Package for distribution (platform-specific)
npm run dist:mac        # macOS (.dmg)
npm run dist:win        # Windows (.exe)
npm run dist:linux      # Linux (.AppImage)
```

**Requirements**: Node.js >=24 <25. Windows builds require PortableGit (see README.md for setup).

## Architecture Overview

LobsterAI is an Electron + React desktop application with the following primary features:
1. **Cowork Mode** - AI-assisted coding sessions using Claude Agent SDK with tool execution
2. **Artifacts System** - Rich preview of code outputs (HTML, SVG, React, Mermaid)
3. **IM Integration** - Receive and respond to messages from DingTalk, Feishu, Telegram, Discord, NIM, Xiaomifeng
4. **MCP Support** - Model Context Protocol server management
5. **Scheduled Tasks** - Cron/interval/one-time AI task scheduling with IM notifications
6. **Skills System** - Custom prompt-based skill definitions
7. **Quick Actions** - Prompt panel for rapid AI interactions

Uses strict process isolation with IPC communication.

### Process Model

**Main Process** (`src/main/main.ts`):
- Window lifecycle management
- SQLite storage via `sql.js` (`src/main/sqliteStore.ts`)
- Cowork session runner (`src/main/libs/coworkRunner.ts`) - executes Claude Agent SDK
- IPC handlers for store, cowork, IM, MCP, scheduled tasks, and API operations
- Tray icon and auto-launch management
- Security: context isolation enabled, node integration disabled, sandbox enabled

**Preload Script** (`src/main/preload.ts`):
- Exposes `window.electron` API via `contextBridge`
- Includes namespaces: `cowork`, `im`, `mcp`, `scheduledTask`, `skill`, `quickAction`

**Renderer Process** (React in `src/renderer/`):
- All UI and business logic
- Communicates with main process exclusively through IPC
- Path alias: `@` maps to `src/renderer/`

### Key Directories

```
src/main/
├── main.ts                    # Entry point, IPC handlers
├── sqliteStore.ts             # SQLite database (kv + all feature tables)
├── coworkStore.ts             # Cowork session/message CRUD operations
├── mcpStore.ts                # MCP server config CRUD
├── scheduledTaskStore.ts      # Scheduled task CRUD
├── skillManager.ts            # Skill file discovery and management
├── skillServices.ts           # Skill service runner
├── trayManager.ts             # System tray icon management
├── autoLaunchManager.ts       # Auto-launch on system startup
├── logger.ts                  # App-level logging
├── fsCompat.ts                # Cross-platform filesystem helpers
├── appConstants.ts            # Shared application constants
├── im/                        # IM gateway integrations
│   ├── imGatewayManager.ts    # Manages all IM platform gateways
│   ├── imChatHandler.ts       # Routes inbound IM messages to AI
│   ├── imCoworkHandler.ts     # Handles cowork-style IM sessions
│   ├── dingtalkGateway.ts     # DingTalk bot integration
│   ├── feishuGateway.ts       # Feishu/Lark bot integration
│   ├── telegramGateway.ts     # Telegram bot integration
│   ├── discordGateway.ts      # Discord bot integration
│   ├── nimGateway.ts          # NetEase NIM integration
│   ├── xiaomifengGateway.ts   # Xiaomifeng integration
│   └── types.ts               # IM type definitions
└── libs/
    ├── coworkRunner.ts          # Claude Agent SDK execution engine
    ├── coworkVmRunner.ts        # Sandbox VM execution mode
    ├── claudeSdk.ts             # SDK loader utilities
    ├── claudeSettings.ts        # API config resolution
    ├── coworkConfigStore.ts     # Cowork config persistence
    ├── coworkFormatTransform.ts # Message format transformations
    ├── coworkLogger.ts          # Cowork-specific logging
    ├── coworkMemoryExtractor.ts # Extracts memory changes from conversations
    ├── coworkMemoryJudge.ts     # Validates memory candidates with scoring/LLM
    ├── coworkOpenAICompatProxy.ts # OpenAI-compatible API proxy for cowork
    ├── coworkSandboxRuntime.ts  # Sandbox VM runtime management
    ├── coworkUtil.ts            # Shared cowork utilities
    ├── appUpdateInstaller.ts    # App update download/install
    ├── logExport.ts             # Log export to zip
    ├── pythonRuntime.ts         # Bundled Python runtime management
    ├── scheduler.ts             # Scheduled task execution engine
    └── systemProxy.ts           # System proxy detection and application

src/renderer/
├── App.tsx                    # Root component, initialization
├── types/
│   ├── cowork.ts              # Cowork type definitions
│   ├── im.ts                  # IM platform type definitions
│   ├── mcp.ts                 # MCP server type definitions
│   ├── scheduledTask.ts       # Scheduled task type definitions
│   ├── skill.ts               # Skill type definitions
│   └── quickAction.ts         # Quick action type definitions
├── store/slices/
│   ├── coworkSlice.ts         # Cowork sessions and streaming state
│   └── artifactSlice.ts       # Artifacts state
├── services/
│   ├── cowork.ts              # Cowork service (IPC wrapper, Redux integration)
│   ├── api.ts                 # LLM API with SSE streaming
│   ├── artifactParser.ts      # Artifact detection and parsing
│   ├── i18n.ts                # Internationalization (zh/en)
│   ├── config.ts              # App config service
│   ├── theme.ts               # Theme management
│   ├── shortcuts.ts           # Keyboard shortcut registration
│   ├── im.ts                  # IM service (IPC wrapper)
│   ├── mcp.ts                 # MCP service (IPC wrapper)
│   ├── skill.ts               # Skill service (IPC wrapper)
│   ├── quickAction.ts         # Quick action service
│   ├── scheduledTask.ts       # Scheduled task service
│   ├── appUpdate.ts           # App update service
│   ├── store.ts               # SQLite store service (IPC wrapper)
│   └── encryption.ts          # Encryption utilities
└── components/
    ├── cowork/                # Cowork UI components
    │   ├── CoworkView.tsx              # Main cowork interface
    │   ├── CoworkSessionList.tsx       # Session sidebar
    │   ├── CoworkSessionDetail.tsx     # Message display
    │   ├── CoworkPermissionModal.tsx   # Tool permission UI
    │   ├── CoworkPromptInput.tsx       # Prompt input with attachments
    │   ├── CoworkQuestionWizard.tsx    # Guided question flow
    │   └── CoworkSearchModal.tsx       # Session search
    ├── artifacts/             # Artifact renderers
    ├── im/                    # IM settings UI
    ├── mcp/                   # MCP manager UI
    ├── skills/                # Skills manager UI
    ├── scheduledTasks/        # Scheduled task UI
    ├── quick-actions/         # Quick action UI
    ├── Settings.tsx           # App settings modal
    ├── Sidebar.tsx            # Navigation sidebar
    └── MarkdownContent.tsx    # Shared markdown renderer

SKILLs/                        # Custom skill definitions for cowork sessions
├── skills.config.json         # Skill enable/order configuration
├── docx/                      # Word document generation skill
├── xlsx/                      # Excel skill
├── pptx/                      # PowerPoint skill
└── ...

tests/                         # Node.js built-in test files
├── coworkMemoryExtractor.test.mjs
├── coworkOpenAICompatProxy.responses.test.mjs
├── coworkOpenAICompatProxy.sseBoundary.test.mjs
└── skillFrontmatter.test.mjs
```

### Data Flow

1. **Initialization**: `src/renderer/App.tsx` → `coworkService.init()` → loads config/sessions via IPC → sets up stream listeners
2. **Cowork Session**: User sends prompt → `coworkService.startSession()` → IPC to main → `CoworkRunner.startSession()` → Claude Agent SDK execution → streaming events back to renderer via IPC → Redux updates
3. **Tool Permissions**: Claude requests tool use → `CoworkRunner` emits `permissionRequest` → UI shows `CoworkPermissionModal` → user approves/denies → result sent back to SDK
4. **Persistence**: All data stored in SQLite (`lobsterai.sqlite` in user data directory)
5. **IM Messages**: Platform gateway receives message → `imChatHandler` processes it → runs Cowork session → sends reply back via gateway

### Cowork System

The Cowork feature provides AI-assisted coding sessions:

**Execution Modes** (`CoworkExecutionMode`):
- `auto` - Automatically choose based on context
- `local` - Run tools directly on the local machine
- `sandbox` - Run tools in isolated VM environment

**Memory System**: Automatically extracts and manages user memories from conversations:
- `coworkMemoryExtractor.ts` - Detects explicit remember/forget commands (Chinese/English) and implicitly extracts personal facts using signal patterns (profile, preferences, ownership). Uses guard levels (`strict`/`standard`/`relaxed`) with confidence thresholds.
- `coworkMemoryJudge.ts` - Validates memory candidates with rule-based scoring and optional LLM secondary judgment for borderline cases. Includes TTL-based caching for LLM results.

**Stream Events** (IPC from main to renderer):
- `message` - New message added to session
- `messageUpdate` - Streaming content update for existing message
- `permissionRequest` - Tool needs user approval
- `complete` - Session execution finished
- `error` - Session encountered an error

**Key IPC Channels**:
- `cowork:startSession`, `cowork:continueSession`, `cowork:stopSession`
- `cowork:getSession`, `cowork:listSessions`, `cowork:deleteSession`
- `cowork:respondToPermission`, `cowork:getConfig`, `cowork:setConfig`
- `cowork:getUserMemories`, `cowork:deleteUserMemory`, `cowork:getMemoryStats`

### IM Integration System

Supports receiving and responding to messages from multiple IM platforms:

**Platforms**: DingTalk, Feishu/Lark, Telegram, Discord, NIM (NetEase IM), Xiaomifeng

**Architecture**:
- `IMGatewayManager` (`src/main/im/imGatewayManager.ts`) - lifecycle management for all gateways
- Each platform has a dedicated gateway class implementing a common interface
- `imChatHandler.ts` - routes inbound messages to AI responses
- `imCoworkHandler.ts` - handles cowork-style multi-turn sessions over IM

**Key IPC Channels**:
- `im:getConfig`, `im:setConfig` - IM platform configuration
- `im:getStatus` - Gateway connection status
- `im:startGateway`, `im:stopGateway`, `im:restartGateway` - Gateway lifecycle
- `im:testConnectivity` - Platform connectivity diagnostics

### MCP (Model Context Protocol) Support

Manages MCP servers that extend AI capabilities with external tools:

**Transport Types**: `stdio`, `sse`, `http`

**Built-in Registry**: Pre-configured entries for common MCP servers (filesystem, browser, search, etc.)

**Key IPC Channels**:
- `mcp:list`, `mcp:add`, `mcp:update`, `mcp:delete` - Server CRUD
- `mcp:enable`, `mcp:disable` - Toggle server availability

### Scheduled Tasks

Automates AI tasks on a schedule:

**Schedule Types**: one-time (`at`), interval (`interval`), cron expression (`cron`)

**Features**:
- Working directory and system prompt per task
- Execution mode (auto/local/sandbox)
- Expiration date
- IM platform notifications on completion

**Key IPC Channels**:
- `scheduledTask:list`, `scheduledTask:create`, `scheduledTask:update`, `scheduledTask:delete`
- `scheduledTask:runNow`, `scheduledTask:enable`, `scheduledTask:disable`
- `scheduledTask:listRuns`, `scheduledTask:listAllRuns`

### Skills System

Custom prompt-based extensions loaded from `SKILLs/` directory:

- Each skill is a directory with a `SKILL.md` file (YAML frontmatter + markdown body)
- Frontmatter fields: `name`, `description`, `version`, `enabled`, `isOfficial`
- Skills are activated per-session; their prompts are prepended to the system prompt
- `skillManager.ts` discovers and reloads skills from the filesystem

### Key Patterns

- **Streaming responses**: `apiService.chat()` uses SSE with `onProgress` callback for real-time message updates
- **Cowork streaming**: Uses IPC event listeners (`onStreamMessage`, `onStreamMessageUpdate`, etc.) for bidirectional communication
- **Markdown rendering**: `react-markdown` with `remark-gfm`, `remark-math`, `rehype-katex` for GitHub markdown and LaTeX
- **Theme system**: Class-based Tailwind dark mode, applies `dark` class to `<html>` element
- **i18n**: Simple key-value translation in `services/i18n.ts`, supports Chinese (default) and English. Language auto-detected from system locale on first run.
- **Skills**: Custom skill definitions in `SKILLs/` directory, configured via `skills.config.json`

### Artifacts System

The Artifacts feature provides rich preview of code outputs similar to Claude's artifacts:

**Supported Types**:
- `html` - Full HTML pages rendered in sandboxed iframe
- `svg` - SVG graphics with DOMPurify sanitization and zoom controls
- `mermaid` - Flowcharts, sequence diagrams, class diagrams via Mermaid.js
- `react` - React/JSX components compiled with Babel in isolated iframe
- `code` - Syntax highlighted code with line numbers

**Detection Methods**:
1. Explicit markers: ` ```artifact:html title="My Page" `
2. Heuristic detection: Analyzes code block language and content patterns

**UI Components**:
- Right-side panel (300-800px resizable width)
- Header with type icon, title, copy/download/close buttons
- Artifact badges in messages to switch between artifacts

**Security**:
- HTML: `sandbox="allow-scripts"` with no `allow-same-origin`
- SVG: DOMPurify removes all script content
- React: Completely isolated iframe with no network access
- Mermaid: `securityLevel: 'strict'` configuration

### Configuration & Persistence

- All data stored in SQLite (`lobsterai.sqlite` in user data directory via `app.getPath('userData')`)
- App config in `kv` table (key-value pairs)
- Cowork config in `cowork_config` table (workingDirectory, systemPrompt, executionMode, memory settings)
- Cowork sessions and messages in `cowork_sessions` and `cowork_messages` tables
- User memories in `cowork_user_memories` table
- MCP servers in `mcp_servers` table
- Scheduled tasks and runs in `scheduled_tasks` and `scheduled_task_runs` tables
- IM config stored in `kv` table under `im_gateway_config` key

### TypeScript Configuration

- `tsconfig.json`: React/renderer code (ES2020, ESNext modules)
- `electron-tsconfig.json`: Electron main process (CommonJS output to `dist-electron/`)

### Key Dependencies

- `@anthropic-ai/claude-agent-sdk` - Claude Agent SDK for cowork sessions
- `sql.js` - SQLite database for persistence
- `react-markdown`, `remark-gfm`, `rehype-katex` - Markdown rendering with math support
- `mermaid` - Diagram rendering
- `dompurify` - SVG/HTML sanitization
- `grammy` - Telegram bot framework
- `discord.js` - Discord bot framework
- `@larksuiteoapi/node-sdk` - Feishu/Lark SDK
- `dingtalk-stream` - DingTalk streaming SDK
- `zod` - Runtime schema validation

## Coding Style & Naming Conventions

- Use TypeScript, functional React components, and Hooks; keep logic in `src/renderer/services/` when it is not UI-specific.
- Match existing formatting: 2-space indentation, single quotes, and semicolons.
- Naming: `PascalCase` for components (e.g., `Chat.tsx`), `camelCase` for functions/vars, and `*Slice.ts` for Redux slices.
- Tailwind CSS is the primary styling approach; prefer utility classes over bespoke CSS.
- IPC channel names use `feature:action` pattern (e.g., `cowork:startSession`, `im:getConfig`).
- New IPC handlers go in `src/main/main.ts`; new IPC types go in `src/renderer/types/`.

## Testing Guidelines

- Tests use Node.js built-in `node:test` module (no Jest/Mocha/Vitest).
- Run tests: `npm run test:memory` (compiles Electron main process first, then runs `tests/coworkMemoryExtractor.test.mjs`).
- Test files live in `tests/` directory and import compiled output from `dist-electron/`.
- Validate UI changes manually by running `npm run electron:dev` and exercising key flows:
  - Cowork: start session, send prompts, approve/deny tool permissions, stop session
  - Artifacts: preview HTML, SVG, Mermaid diagrams, React components
  - Settings: theme switching, language switching
  - IM: configure a platform, start gateway, send test message
- Keep console warnings/errors clean; lint via `npm run lint` before submitting.

## Commit & Pull Request Guidelines

- Recent history uses conventional prefixes like `feat:`, `refactor:`, and `chore:`; older commits include `feature:` and `Initial commit`.
- Prefer `type: short imperative summary` (e.g., `feat: add artifact toolbar actions`).
- PRs should include a concise description, linked issue if applicable, and screenshots for UI changes.
- Call out any Electron-specific behavior changes (IPC, storage, windowing) in the PR description.
