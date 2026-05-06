# 时空故事

《时空故事》是一款基于 AI 大语言模型的动态叙事模拟游戏，旨在生成庞大而复杂的网状故事线。
玩家将进入一个由 AI 构建的游戏世界，在其中遇见大量 NPC、分支选择与多重结局，并通过自由探索和决策，体验一段独属于自己的故事旅程。

## 项目核心

本项目旨在验证：在合理的框架编排下，能否通过 Skill 渐进式披露、SubAgent 分工协作与脚本化验收等机制，使 AI 智能体自主循环生成大规模游戏内容，并进一步探索 AI 内容生成的能力边界。

## 玩法体验

- **时间推进**：游戏按回合推进，世界会随着天数和时段变化。
- **空间探索**：玩家在地图地块中移动，不同地点拥有不同 NPC、建筑和事件。
- **NPC 自主行动**：NPC 不只是等待玩家触发剧情，而是会根据自身目标和世界状态行动。
- **状态驱动叙事**：地点、人物、关系、事件、世界变量都会持续变化。
- **多结局演化**：结局由玩家行为和世界状态共同决定，而不是固定剧情分支。

## 技术简述

- 纯前端单机运行，无需后端服务。
- 使用结构化内容包驱动剧情和交互。
- 地图采用 SVG 网格绘制，辅以贴图增强展示效果。
- 游戏逻辑由条件系统、效果系统、事件系统和 NPC 行为系统共同驱动。
- 配套制作工具用于生成、编辑、校验和测试游戏内容。

## 技术方向

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- IndexedDB / LocalStorage

## 推荐文件架构

```text
project-root
├── apps
│   ├── game-client      # 游戏本体
│   └── story-lab        # 剧情内容制作工具
│
├── packages
│   ├── schema           # 内容数据结构定义
│   ├── engine           # 条件、效果、回合、NPC 行为等核心逻辑
│   ├── validator        # 内容校验器
│   └── content-pack     # 内容包导入导出
│
├── content
│   └── qinglan-town     # MVP 内容包
│
└── docs                 # 项目文档
```

## 环境要求

- Node.js `20.19+` 或 `22.12+`
- pnpm `10+`

## 安装依赖

```bash
pnpm install
```

## 启动游戏本体

```bash
pnpm dev:game
```

默认访问：

```text
http://localhost:5173
```

## 启动 Story Lab

```bash
pnpm dev:lab
```

默认访问：

```text
http://localhost:5174
```

## 构建全部项目

```bash
pnpm build
```

## 生成内容包

`content/qinglan-town` 是制作期唯一源头。修改其中的内容后，先生成发布期产物：

```bash
pnpm build:content-pack
```

该命令会更新：

- `content/packs/manifest.json`
- `content/packs/<packId>.json`

`apps/game-client/public/content-packs` 与 `apps/story-lab/public/content-packs` 是指向 `content/packs` 的软链接，两个应用共用同一份打包产物。

## 校验内容包

```bash
pnpm validate:content
```

## 运行 30 天模拟

```bash
pnpm simulate
```
