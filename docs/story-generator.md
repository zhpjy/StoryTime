# AI 故事生成器 / Story Lab

AI 故事生成器是制作期工具，不在游戏运行时即时改写剧情。

## 工作流

```text
选择生成目标 → 读取世界观与已有内容 → 读取 Schema → 组装 Prompt → 获得 YAML/JSON → 解析 → 校验 → 修复 → 人工验收 → 导出内容包
```

当前实现中，`content/<pack>` 是制作期源头；修改源文件后执行 `pnpm build:content-pack`，生成 Story Lab 与游戏本体共用的 `content/packs/manifest.json` 和 `content/packs/<packId>.json`。两个应用的 `public/content-packs` 通过软链接指向该生成目录。

## 内容状态

- `draft`：AI 草稿。
- `reviewing`：人工审查中。
- `needs_fix`：需要修复。
- `accepted`：已验收，可进入测试包。
- `locked`：已锁定，不允许 AI 修改。
- `rejected`：废弃。

## 本项目实现

`apps/story-lab` 中包含：

- 内容概览。
- Prompt 模板库。
- 草稿编辑区。
- 校验报告。
- 模拟测试器。
- 内容缺口分析。
- 内容包导出。

为了保持 MVP 纯前端，本项目不内置真实 AI API Key，也不在运行时发起 AI 请求。用户可以复制 Prompt 到外部 AI 工具，将生成结果粘贴回 Story Lab 校验。
