# 校验器说明

校验器用于保证 AI 或人工新增内容不会破坏游戏运行。

## 已实现校验项

- SchemaValidator：检查顶层字段、必填字段、基础类型与枚举。
- ReferenceValidator：检查地点、建筑、NPC、势力、事件、会话、交互、任务和奖励引用。
- FactPathValidator：检查条件中的事实路径是否可解析。
- EffectValidator：检查效果类型与目标引用。
- StoryLogicValidator：检查地点无交互、事件无效果、任务无奖励、NPC 无行为、结局可能冲突等问题。
- ContentGapAnalyzer：输出会话、事件、地点、结局可达性等内容缺口。

## 会话校验

会话图会检查：

- `Conversation.npcId` 是否引用存在的 NPC。
- `entryNodeId` 是否指向同一会话内的节点。
- `nodes[].speaker` 是否为 `player` 或存在的 NPC。
- 回复是否包含 `nextNodeId` 或 `endConversation: true`。
- `nextNodeId` 是否指向同一会话内的节点。
- `impact` 是否已从会话和回复中移除。
- `start_conversation` effect 是否引用存在的会话。

## 交互、任务和奖励校验

- `interactions[].targetType / targetId` 必须引用存在的 NPC、地点、建筑或地块。
- `give` 交互必须引用存在的物品，并声明大于 0 的 `itemCount`。
- `combat` 交互必须声明非负 `enemyCombat`。
- `quests[].sourceNpcId` 必须引用存在的 NPC。
- `quests[].completion` 必须定义对话、给予、战斗或环境互动完成方式。
- `quests[].rewardIds` 必须引用存在的奖励。
- `rewards[].effects` 必须至少包含一个合法效果。
- `start_quest` 和 `fail_quest` effect 必须引用存在的任务。

## 校验结果等级

- `error`：会导致内容不可运行，需要修复。
- `warning`：不会阻断运行，但会削弱体验。
- `info`：制作期提示。
