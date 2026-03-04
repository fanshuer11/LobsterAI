# GitHub Copilot Instructions for LobsterAI

LobsterAI is an **Electron + React** desktop application that provides AI-assisted coding sessions (Cowork), IM bot integrations, scheduled AI tasks, and artifact previews. The main process runs in Node.js; the renderer runs in a sandboxed Chromium context.

## Project Overview

- **Tech stack**: Electron 40, React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Redux Toolkit, sql.js (SQLite)
- **Node.js requirement**: >=24 <25
- **Entry points**: `src/main/main.ts` (main process), `src/renderer/main.tsx` (renderer)
- **Build output**: `dist/` (renderer), `dist-electron/` (main process)
- **Path alias**: `@` → `src/renderer/`

## Coding Conventions

- **TypeScript everywhere** — no plain `.js` files in `src/`
- **2-space indentation**, single quotes, semicolons
- **React functional components** with hooks; class components are not used
- **Tailwind CSS** for all styling — avoid inline styles or custom CSS unless necessary
- **Redux Toolkit slices** for shared state (`src/renderer/store/slices/`)
- **Services layer** in `src/renderer/services/` for non-UI logic; components only call services
- **IPC naming**: `feature:action` (e.g., `cowork:startSession`, `im:getConfig`)
- All IPC handler registrations live in `src/main/main.ts`
- New shared types between main and renderer go in `src/renderer/types/`

## Process Isolation Rules

- The **renderer** must NEVER import from `src/main/`
- All main-process functionality is accessed through `window.electron.*` (exposed via `src/main/preload.ts`)
- New IPC channels need: (1) handler in `main.ts`, (2) exposure in `preload.ts`, (3) service wrapper in `src/renderer/services/`

## Key Features & Where to Find Them

| Feature | Main Process | Renderer |
|---|---|---|
| Cowork sessions | `src/main/libs/coworkRunner.ts` | `src/renderer/components/cowork/` |
| Memory system | `src/main/libs/coworkMemoryExtractor.ts`, `coworkMemoryJudge.ts` | `src/renderer/services/cowork.ts` |
| IM integrations | `src/main/im/` | `src/renderer/components/im/` |
| MCP servers | `src/main/mcpStore.ts` | `src/renderer/components/mcp/` |
| Scheduled tasks | `src/main/libs/scheduler.ts`, `scheduledTaskStore.ts` | `src/renderer/components/scheduledTasks/` |
| Skills | `src/main/skillManager.ts` | `src/renderer/components/skills/` |
| Artifacts | N/A | `src/renderer/services/artifactParser.ts`, `components/artifacts/` |

## SQLite Storage Schema

All tables live in a single `lobsterai.sqlite` file in `app.getPath('userData')`:
- `kv` — key-value config store
- `cowork_sessions`, `cowork_messages` — cowork session persistence
- `cowork_user_memories` — user memory entries
- `mcp_servers` — MCP server configurations
- `scheduled_tasks`, `scheduled_task_runs` — task scheduling

## Testing

- **Framework**: Node.js built-in `node:test` (no Jest/Vitest)
- **Test files**: `tests/*.test.mjs`
- **Run**: `npm run test:memory` (compiles main process, then runs memory tests)
- Tests import from `dist-electron/` (compiled output), not from `src/`

## Common Tasks

**Adding a new IPC channel:**
1. Add handler: `ipcMain.handle('feature:action', async (event, ...args) => { ... })` in `src/main/main.ts`
2. Expose in preload: add to `src/main/preload.ts` under the appropriate namespace
3. Add renderer service: add wrapper function in `src/renderer/services/feature.ts`

**Adding a new IM platform:**
1. Create gateway in `src/main/im/platformGateway.ts` implementing the gateway interface
2. Register in `src/main/im/imGatewayManager.ts`
3. Add config/status types in `src/renderer/types/im.ts`
4. Add UI in `src/renderer/components/im/IMSettings.tsx`

**Adding a new Skill:**
1. Create a directory under `SKILLs/skillname/`
2. Add `SKILL.md` with YAML frontmatter (`name`, `description`, `version`, `isOfficial`)
3. Add markdown body with the skill's system prompt
4. Register in `SKILLs/skills.config.json`

## Security Considerations

- Renderer runs with `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- HTML artifacts rendered in `<iframe sandbox="allow-scripts">` (no `allow-same-origin`)
- SVG content sanitized with DOMPurify before rendering
- IPC inputs are validated and size-capped in `main.ts` (see `IPC_*_MAX_*` constants)
- Never expose Node.js APIs directly to renderer — always go through `contextBridge`
