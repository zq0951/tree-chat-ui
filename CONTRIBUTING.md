# Contributing to TreeChat

Thank you for your interest in contributing to TreeChat! This guide will help you get started.

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### Setup

```bash
# Clone the repo
git clone https://github.com/zq0951/tree-chat-ui.git
cd tree-chat-ui

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
tree_chat/
├── app/                        # Next.js App Router (pages & API routes)
│   ├── api/chat/route.ts       # Multi-provider streaming AI endpoint
│   ├── page.tsx                # Home page
│   ├── layout.tsx              # Root layout (fonts, global components)
│   └── globals.css             # Global styles + React Flow theme overrides
├── components/                 # React components
│   ├── node/                   # MessageNode sub-components
│   │   ├── NodeHeader.tsx      # Node top bar (role, model info, tools)
│   │   ├── NodeContent.tsx     # Content area (Markdown/text, errors)
│   │   ├── NodeFooter.tsx      # Footer (generate/branch/retry buttons)
│   │   ├── ImageGallery.tsx    # Image thumbnail grid
│   │   └── ImagePreviewOverlay.tsx  # Fullscreen image preview
│   ├── MessageNode.tsx         # Container component for node cards
│   ├── TreeChat.tsx            # Main ReactFlow canvas
│   ├── Header.tsx              # Top bar with tabs & import/export
│   └── ...
├── store/                      # Zustand modular Slice architecture
│   ├── useStore.ts             # Combined store entry point
│   ├── tabSlice.ts             # Tab management
│   ├── nodeSlice.ts            # Node/edge CRUD
│   ├── aiSlice.ts              # AI generation & merge
│   ├── configSlice.ts          # API configuration
│   ├── persistence.ts          # IndexedDB persistence engine
│   └── types.ts                # TypeScript type definitions
├── __tests__/                  # Unit tests (Vitest)
└── hooks/                      # Custom React hooks
```

## 🛠️ Development Workflow

### Commands

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start development server with hot reload |
| `npm run build`      | Production build                         |
| `npm test`           | Run all tests once                       |
| `npm run test:watch` | Run tests in watch mode                  |
| `npm run lint`       | Run ESLint                               |

### Code Organization Principles

- **State Management**: All business state is managed through Zustand **modular Slice architecture** — `tabSlice`, `nodeSlice`, `aiSlice`, `configSlice` — combined in `useStore.ts`.
- **Shared Logic**: Cross-component reusable logic goes in `hooks/`.
- **Component Responsibility**: Each component focuses on rendering; business operations are delegated to Store Actions.
- **Style Management**: Global styles are maintained in `globals.css`. No inline `<style>` tags in components.

### Key Technical Notes

- The API route (`app/api/chat/route.ts`) supports dual-provider mode (Google / OpenAI Compatible) via `X-Provider` and `X-Api-Key` headers.
- IndexedDB persistence uses **300ms debounce + `beforeunload` flush** — be careful when modifying persistence logic.
- `MessageNode` uses `React.memo` for render optimization — maintain reference stability when modifying.

## 📝 Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Follow the existing code style and patterns
- Add tests for new business logic (especially Store Slice logic)
- Keep components focused — extract sub-components when a file exceeds ~200 lines

### 3. Test Your Changes

```bash
# Run tests
npm test

# Run lint
npm run lint

# Verify build passes
npm run build
```

### 4. Submit a Pull Request

- Fill in the PR template
- Reference any related issues
- Keep PRs focused — one feature or fix per PR

## 🐛 Reporting Bugs

Use the [Bug Report template](https://github.com/zq0951/tree-chat-ui/issues/new?template=bug_report.md) when filing issues.

## 💡 Requesting Features

Use the [Feature Request template](https://github.com/zq0951/tree-chat-ui/issues/new?template=feature_request.md).

## 📜 License

By contributing to TreeChat, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
