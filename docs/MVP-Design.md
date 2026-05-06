# 时空故事

> 一款以“时间推进”和“空间变化”为核心体验的动态叙事模拟游戏。  
> 玩家在一个会自我运转的故事世界中行动、观察、选择，并影响 NPC、地点、事件与最终结局。

---

## 一、游戏简介

《时空故事》是一款纯前端、单机、本地运行的动态叙事模拟游戏。

游戏不采用传统固定剧情树，而是通过“世界状态 + 地点空间 + NPC 行为逻辑 + 事件系统 + 玩家选择”共同推动故事发展。

玩家以不同身份进入一个设定好的故事区域。每个 NPC 都拥有自己的背景、目标、关系、日程与行为规则。即使玩家没有主动与某个 NPC 互动，该 NPC 也会根据自身逻辑与世界状态继续行动，从而推动故事变化。

MVP 版本暂定为：

```text
《时空故事：青岚镇》
```

玩家将在青岚镇经历疫病、盗匪、粮价、旧案与人心变化。每一回合，时间推进，地点状态变化，NPC 自主行动，玩家的选择会影响人物命运与小镇结局。

---

## 二、核心设计理念

《时空故事》的核心不是“让玩家选择一条剧情分支”，而是让玩家进入一个持续变化的故事系统。

游戏希望呈现以下体验：

```text
时间会推进。
地点会变化。
NPC 会行动。
关系会改变。
事件会连锁。
选择会留下后果。
结局由因果组成。
```

玩家不是在等待剧情触发，而是在一个会自然运转的小世界中生活、观察、参与和改变。

---

## 三、核心机制

### 1. 时间推进机制

游戏采用回合制时间结构。

MVP 版本规划：

```text
30 天 × 每天 3 个时间段：晨 / 午 / 夜
```

每个时间段拥有一定行动点。玩家可以在一个时间段内移动、交谈、调查、交易、帮助、战斗或休息。

当行动点耗尽后，时间推进到下一个阶段。时间推进后，NPC 会根据自己的日程和行为逻辑行动，事件系统会检查是否触发新的世界变化。

---

### 2. 空间地图机制

MVP 版本地图暂时完全由前端绘制，采用棋盘式网格地图。

地图支持：

- 鼠标悬浮地块高亮
- 显示地块名称、地形、危险程度
- 显示当前地块中的 NPC
- 显示当前地块中的建筑
- 显示当前地块中的事件
- 点击地块后打开地点详情面板
- 根据地点状态展示可操作事项

地图不是单纯导航界面，而是游戏“空间维度”的入口。

同一个地点在不同时间、不同状态下会呈现不同内容。例如：

```text
第 3 天白天的药铺：正常问诊、买药、交谈。
第 12 天夜晚的药铺：病患增多、药材短缺、紧急求医。
第 20 天的药铺：可能被封锁、失火，或关键 NPC 已经失踪。
```

---

### 3. 地点与建筑交互机制

地图地块会对应具体地点，地点内部再包含建筑、NPC、事件和可执行行为。

基本链路：

```text
地图地块 Tile
  ↓
地点 Location
  ↓
建筑 Building / NPC / Event
  ↓
行动 Action
  ↓
条件 Conditions
  ↓
效果 Effects
```

例如玩家点击“回春药铺”地块后，可能看到：

```text
回春药铺
├── 药柜
│   ├── 购买药材
│   ├── 打听药材来源
│   └── 偷取药材
├── 问诊间
│   ├── 求医治疗
│   ├── 帮忙诊治病人
│   └── 打听疫病
└── 后院
    └── 调查药材来源
```

每个交互都由规则系统判断是否可用。

---

### 4. NPC 自主行动机制

NPC 不是等待玩家触发剧情的静态角色，而是拥有自己的状态、目标、关系、日程和行为规则。

每个 NPC 可以包含：

- 基础身份
- 背景故事
- 当前目标
- 性格属性
- 所属势力
- 当前地点
- 与玩家及其他 NPC 的关系
- 行为规则
- 日程安排
- 记忆与事实标记
- 个人命运线

例如：

```text
沈青禾是药铺学徒。
当疫病加重且药材不足时，即使玩家不主动找她，她也可能独自前往山林采药。
如果玩家提前帮助药铺，她可能不会冒险上山。
如果玩家忽视药材问题，她可能失踪、受伤，甚至改变后续结局。
```

---

### 5. 状态属性系统

游戏不会依赖“白天开门、晚上关门”这类自然语言描述来判断玩法逻辑。

所有可交互内容都必须由结构化状态驱动。

核心状态包括：

```text
时间状态 TimeState
玩家状态 PlayerState
世界变量 WorldVariables
地点状态 LocationState
建筑状态 BuildingState
NPC 状态 NPCState
关系状态 RelationshipState
事实标记 Facts
```

示例世界变量：

```yaml
variables:
  town_order: 70
  town_fear: 20
  plague_level: 10
  herb_stock: 80
  bandit_power: 35
  guard_power: 50
  food_price: 100
  truth_progress: 0
```

---

### 6. 条件判断与效果执行机制

所有交互、事件、对白、NPC 行为都通过统一的条件系统判断是否触发。

条件示例：

```yaml
conditions:
  all:
    - fact: time.segment
      in:
        - morning
        - noon
    - fact: location.loc_herb_shop.state.status
      equals: normal
    - fact: variables.herb_stock
      greater_than: 0
```

效果示例：

```yaml
effects:
  - type: change_variable
    key: plague_level
    delta: -3

  - type: change_relationship
    source: player
    target: npc_shen_qinghe
    path: trust
    delta: 5

  - type: add_fact
    key: player_helped_herb_shop
    value: true
```

---

### 7. 事件系统

事件是推动故事变化的核心。

事件类型包括：

- 时间事件
- 地点事件
- NPC 行为事件
- 世界状态事件
- 玩家选择事件

示例：

```text
第 3 天：药铺出现第一批病人。
第 5 天：山路商队被劫。
当盗匪势力过高时：山林危险提升。
当药材库存过低时：沈青禾可能独自上山采药。
当粮价过高时：集市发生冲突。
```

---

### 8. 结局因果链机制

结局不由 AI 临时决定，而由结构化条件判断。

每个结局都有明确触发条件，并展示玩家行为造成的关键因果链。

MVP 至少包含三个结局：

#### 青岚得存

```text
疫病受控，盗匪削弱，小镇秩序尚存。
青岚镇虽然遭遇危机，但最终保存下来。
```

#### 空镇余烬

```text
疫病失控，药材耗尽，镇民逃离。
青岚镇没有在一夜之间毁灭，却在一天天的恐惧中空了。
```

#### 匪火入镇

```text
盗匪势力过强，巡守力量不足。
黑岭盗趁夜入镇，小镇失守。
```

可扩展结局：

- 真相昭雪
- 暗约成局
- 仁名远播
- 血债难消
- 孤身远行

---

## 四、游戏特点

### 1. 动态叙事，而不是固定剧情树

游戏的故事不是简单的 A/B/C 分支，而是由变量、关系、事件、NPC 行为共同推演。

玩家的选择会影响：

- NPC 是否信任玩家
- NPC 是否存活
- 地点是否开放
- 事件是否触发
- 世界变量如何变化
- 结局如何判定

---

### 2. 时间与空间共同塑造体验

“时间”决定事件推进、NPC 日程、危机升级。  
“空间”决定玩家能遇到谁、能发现什么、能采取什么行动。

玩家需要在有限时间内选择前往哪里、帮助谁、调查什么、放弃什么。

---

### 3. NPC 拥有自己的生活逻辑

NPC 不只是任务发布器。  
他们会根据自己的目标和世界状态采取行动。

例如：

```text
药铺缺药 → 沈青禾上山采药。
盗匪逼近 → 陆怀山加强巡逻。
粮价上涨 → 罗守仓囤粮。
镇民恐慌 → 酒肆传闻变多。
旧案线索推进 → 魏长庚试图压制真相。
```

---

### 4. AI 辅助内容生产

项目不会在游戏运行时让 AI 自由改写剧情。

AI 主要用于制作阶段，帮助批量生成：

- NPC 草稿
- NPC 背景故事
- NPC 行为逻辑
- 人物关系
- 事件链
- 对话
- 传闻
- 结局文本

所有 AI 生成内容必须经过结构化校验和人工验收，才能进入游戏内容包。

---

### 5. 内容包驱动

游戏本体不把剧情写死在组件里，而是读取内容包。

内容包包含：

```text
地图
地点
建筑
势力
NPC
关系
行动
事件
对白
结局
物品
世界变量
```

这样可以持续扩展新的故事区域，而不需要重写游戏逻辑。

---

## 五、AI 故事生成与验证器

### 1. 故事生成器定位

故事生成器是制作期工具，不是运行时系统。

它的作用是：

```text
根据世界观、地点、势力、变量、已有 NPC 和 Schema，
批量生成可被游戏读取、可被编辑器修改、可被验证器校验的结构化内容。
```

---

### 2. AI 生成流程

```text
选择生成任务
  ↓
读取世界观和已有内容
  ↓
读取 Schema
  ↓
组装 Prompt
  ↓
AI 输出 YAML / JSON
  ↓
解析结构化内容
  ↓
Schema 校验
  ↓
引用校验
  ↓
逻辑校验
  ↓
AI 修复
  ↓
人工验收
  ↓
进入内容包
```

---

### 3. 内容状态

AI 生成内容需要经过状态流转：

```text
draft      AI 草稿
reviewing  人工审查中
needs_fix  需要修复
accepted   已验收
locked     已锁定
rejected   已废弃
```

只有 `accepted` 和 `locked` 内容可以进入游戏测试包。

---

### 4. 验证器职责

验证器用于保证 AI 生成内容可运行、可维护、无明显冲突。

核心校验包括：

- Schema 校验
- ID 重复校验
- 引用存在性校验
- 条件路径校验
- 效果类型校验
- NPC 死后出场校验
- 事件是否有实际效果校验
- 结局是否可达校验
- 对话是否过长校验
- 背景文本是否与结构化数据冲突校验
- 内容密度缺口分析

---

## 六、技术方案

### 1. 当前规划

MVP 使用纯前端技术实现。

```text
Vite
React
TypeScript
Tailwind CSS
shadcn/ui
Zustand
CSS Grid
IndexedDB / localStorage
JSON / YAML Content Pack
```

### 2. 地图实现

首版地图使用 CSS Grid 实现。

不使用 Canvas、PixiJS 或复杂地图引擎。

原因：

```text
当前地图是棋盘网格。
核心需求是点击、悬浮、状态显示和交互面板。
React + CSS Grid 更适合快速实现和调试。
```

后续如果需要复杂动画、大地图缩放、战争迷雾、粒子特效，再考虑 Canvas 或 PixiJS。

### 3. 状态管理

使用 Zustand 管理：

- 当前时间
- 当前行动点
- 当前选中地块
- 当前悬浮地块
- 玩家状态
- 世界状态
- NPC 状态
- 关系状态
- 事件日志
- 存档状态

---

## 七、文件架构

推荐单仓库结构：

```text
time-space-story
├── apps
│   ├── game-client
│   │   ├── public
│   │   │   └── assets
│   │   │       ├── maps
│   │   │       ├── ui
│   │   │       └── icons
│   │   │
│   │   ├── src
│   │   │   ├── app
│   │   │   │   ├── App.tsx
│   │   │   │   └── routes
│   │   │   │       ├── HomePage.tsx
│   │   │   │       ├── GamePage.tsx
│   │   │   │       └── EndingPage.tsx
│   │   │   │
│   │   │   ├── features
│   │   │   │   └── game
│   │   │   │       ├── components
│   │   │   │       │   ├── GameLayout.tsx
│   │   │   │       │   ├── TopStatusBar.tsx
│   │   │   │       │   ├── WorldMapGrid.tsx
│   │   │   │       │   ├── MapTile.tsx
│   │   │   │       │   ├── TileInfoPanel.tsx
│   │   │   │       │   ├── BuildingPanel.tsx
│   │   │   │       │   ├── NpcPanel.tsx
│   │   │   │       │   ├── ActionPanel.tsx
│   │   │   │       │   └── EventLogPanel.tsx
│   │   │   │       │
│   │   │   │       ├── store
│   │   │   │       │   └── useGameStore.ts
│   │   │   │       │
│   │   │   │       ├── hooks
│   │   │   │       │   ├── useSelectedTile.ts
│   │   │   │       │   ├── useAvailableActions.ts
│   │   │   │       │   └── useTurnSummary.ts
│   │   │   │       │
│   │   │   │       └── styles
│   │   │   │           └── map.css
│   │   │   │
│   │   │   ├── shared
│   │   │   │   ├── components
│   │   │   │   ├── utils
│   │   │   │   └── types
│   │   │   │
│   │   │   └── main.tsx
│   │   │
│   │   └── package.json
│   │
│   └── story-lab
│       ├── public
│       ├── src
│       │   ├── app
│       │   │   ├── App.tsx
│       │   │   └── routes
│       │   │       ├── DashboardPage.tsx
│       │   │       ├── NpcEditorPage.tsx
│       │   │       ├── LocationEditorPage.tsx
│       │   │       ├── EventEditorPage.tsx
│       │   │       ├── DialogueEditorPage.tsx
│       │   │       ├── GeneratorPage.tsx
│       │   │       ├── ValidatorPage.tsx
│       │   │       └── SimulatorPage.tsx
│       │   │
│       │   ├── features
│       │   │   ├── content-editor
│       │   │   ├── story-generator
│       │   │   ├── validator
│       │   │   ├── simulator
│       │   │   └── content-pack-exporter
│       │   │
│       │   └── main.tsx
│       │
│       └── package.json
│
├── packages
│   ├── schema
│   │   ├── src
│   │   │   ├── content-pack.schema.ts
│   │   │   ├── map.schema.ts
│   │   │   ├── location.schema.ts
│   │   │   ├── building.schema.ts
│   │   │   ├── npc.schema.ts
│   │   │   ├── action.schema.ts
│   │   │   ├── event.schema.ts
│   │   │   ├── dialogue.schema.ts
│   │   │   ├── ending.schema.ts
│   │   │   └── world-state.schema.ts
│   │   └── package.json
│   │
│   ├── engine
│   │   ├── src
│   │   │   ├── condition-engine.ts
│   │   │   ├── effect-engine.ts
│   │   │   ├── interaction-engine.ts
│   │   │   ├── npc-behavior-engine.ts
│   │   │   ├── event-engine.ts
│   │   │   ├── turn-engine.ts
│   │   │   ├── ending-engine.ts
│   │   │   └── log-engine.ts
│   │   └── package.json
│   │
│   ├── validator
│   │   ├── src
│   │   │   ├── schema-validator.ts
│   │   │   ├── reference-validator.ts
│   │   │   ├── fact-path-validator.ts
│   │   │   ├── effect-validator.ts
│   │   │   ├── logic-validator.ts
│   │   │   ├── conflict-validator.ts
│   │   │   ├── ending-validator.ts
│   │   │   └── content-gap-analyzer.ts
│   │   └── package.json
│   │
│   ├── story-generator
│   │   ├── src
│   │   │   ├── generation-job.ts
│   │   │   ├── prompt-template-registry.ts
│   │   │   ├── prompt-builder.ts
│   │   │   ├── output-parser.ts
│   │   │   ├── ai-fix-runner.ts
│   │   │   └── generation-status.ts
│   │   └── package.json
│   │
├── content
│   └── qinglan-town
│       ├── world.yaml
│       ├── variables.yaml
│       ├── maps.yaml
│       ├── locations.yaml
│       ├── buildings.yaml
│       ├── factions.yaml
│       ├── npcs
│       │   ├── index.yaml
│       │   └── <slug>
│       │       ├── identity.yaml
│       │       ├── background.yaml
│       │       ├── attributes.yaml
│       │       ├── relationships.yaml
│       │       ├── behavior.yaml
│       │       └── dialogues.yaml
│       ├── actions.yaml
│       ├── events.yaml
│       ├── items.yaml
│       ├── endings.yaml
│       └── content-pack.json
│
├── docs
│   ├── MVP.md
│   ├── content-schema.md
│   ├── story-generator.md
│   ├── validator.md
│   ├── simulation.md
│   └── roadmap.md
│
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

---

## 八、核心模块说明

### apps/game-client

玩家实际游玩的游戏本体。

负责：

- 加载内容包
- 展示棋盘地图
- 展示地点、建筑、NPC、事件
- 执行玩家交互
- 推进时间
- 结算 NPC 行为
- 触发事件
- 判定结局
- 本地存档

---

### apps/story-lab

制作期工具，也可称为“命簿工坊”。

负责：

- 编辑 NPC
- 编辑地点
- 编辑建筑
- 编辑事件
- 编辑对白
- 编辑结局
- 执行 AI 生成任务
- 校验内容
- 模拟测试
- 导出内容包

---

### packages/schema

统一定义所有内容结构。

包括：

- 地图 Schema
- 地点 Schema
- 建筑 Schema
- NPC Schema
- 行动 Schema
- 事件 Schema
- 对话 Schema
- 结局 Schema
- 世界状态 Schema
- 内容包 Schema

---

### packages/engine

游戏规则引擎。

负责：

- 条件判断
- 效果执行
- 可用行动计算
- NPC 行为选择
- 事件触发
- 回合推进
- 结局判定
- 日志生成

---

### packages/validator

内容校验器。

负责：

- Schema 校验
- 引用校验
- 条件路径校验
- 效果校验
- 逻辑校验
- 冲突校验
- 结局可达性分析
- 内容缺口分析

---

### packages/story-generator

AI 故事生成器核心逻辑。

负责：

- 生成任务管理
- Prompt 模板管理
- Prompt 组装
- AI 输出解析
- AI 修复任务
- 内容状态流转

---

### 内容包发布产物

具体故事内容不在包代码中维护。`content/packs/` 是 Story Lab 与游戏本体共用的打包内容目录，`apps/*/public/content-packs` 通过软链接指向该目录。
- 游戏本体读取内容包
- 内容包版本管理
- 内容结构标准化

---

## 九、MVP 初始内容

### 核心地点

```text
镇门
集市
回春药铺
旧酒肆
祠堂
民居区
青岚山林
破驿旧庙
```

### 核心 NPC

```text
沈青禾：药铺学徒，瘟疫线核心。
陆怀山：镇中巡守，秩序与盗匪线核心。
赵三娘：旧酒肆老板，情报线核心。
魏长庚：青岚镇镇长，旧案线核心。
韩烬：黑岭盗首领，盗匪线核心。
罗守仓：米铺掌柜，粮价与集市线核心。
```

### 初始势力

```text
镇民
巡守
黑岭盗
外来商队
```

### 初始主角身份

```text
外乡行商
落魄武人
游方医者
```

---

## 十、开发目标

MVP 版本完成后，应该支持：

```text
1. 玩家选择身份进入青岚镇。
2. 玩家在棋盘地图上移动和点击地块。
3. 地块可显示 NPC、建筑、事件和可用交互。
4. 玩家行动会改变世界状态。
5. 时间推进后 NPC 会自主行动。
6. 事件系统会根据状态触发新事件。
7. 玩家可以玩完整 30 天流程。
8. 系统根据最终状态判定结局。
9. 制作工具可以生成、编辑、校验和导出内容包。
10. AI 生成内容必须经过验证器和人工验收。
```

---

## 十一、项目边界

MVP 暂不包含：

```text
后端服务
账号系统
云存档
多人联机
自由输入式 AI 对话
运行时 AI 改写剧情
复杂战斗系统
复杂装备养成
大地图开放世界
Canvas / PixiJS 地图引擎
```

MVP 当前重点是：

```text
结构化内容
棋盘地图交互
状态驱动规则
NPC 自主行动
事件连锁
AI 内容生成
内容校验器
模拟测试器
结局因果链
```

---

## 十二、最终目标

《时空故事》希望形成一种新的叙事体验：

> 玩家不是在选择剧情树上的分支，而是在一个由时间、空间、人物、关系、事件共同运转的故事世界中，亲手改变命运的走向。

MVP 的目标不是做大，而是做深。

只要青岚镇能让玩家感受到：

```text
昨天发生过的事，今天仍有后果。
我没去的地方，也在发生变化。
我没有帮助的人，也会自己做出选择。
我救过的人，可能在关键时刻反过来帮我。
最终结局不是系统硬判，而是我的选择一步步造成的。
```

那么《时空故事》的核心玩法就成立了。
