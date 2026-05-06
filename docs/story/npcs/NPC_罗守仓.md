# NPC：罗守仓

## 1. 基础信息

```yaml
id: npc_luo_shoucang
name: 罗守仓
age: 47
identity: 米铺掌柜
tier: important
faction: faction_town_people
initial_location: loc_market
```

## 2. 角色定位

罗守仓是粮价线核心 NPC。他不是纯粹奸商，而是一个被饥荒记忆和利益欲望共同驱动的人。玩家如何处理他，会直接影响粮价、流民、集市秩序和镇民对玩家的评价。

## 3. 公开背景

罗守仓经营米铺多年，精于算计，镇中人常说他“斗米也要称三遍”。平时他不愿赊账，但也很少掺假。

## 4. 私密背景

他年轻时经历过一次饥荒，亲眼见过无粮时人心如何变坏。因此他对米粮有近乎偏执的控制欲。

## 5. 隐藏背景

他暗中囤了一批米粮。表面是想趁粮价上涨牟利，实际也想在最坏情况时保住自家族人和米铺伙计。

## 6. 性格属性

```yaml
personality:
  kindness: 35
  courage: 30
  greed: 70
  loyalty: 45
  suspicion: 60
  responsibility: 50
```

## 7. 核心目标

1. 保住米铺。
2. 在粮价上涨中获利。
3. 避免流民冲击米铺。
4. 在必要时用粮食换取保护。

## 8. 重要关系

| 对象 | 初始关系 | 说明 |
|---|---:|---|
| 小宛 | -10 | 认为流民会拖垮小镇。 |
| 赵三娘 | 10 | 常从酒肆听消息。 |
| 陆怀山 | 0 | 需要巡守保护米铺。 |
| 玩家 | 0 | 行商身份更容易接触他。 |

## 9. 自主行为逻辑

```yaml
behavior_rules:
  - id: rule_luo_hide_grain
    name: 暗中囤粮
    priority: 70
    conditions:
      all:
        - fact: variables.food_price
          greater_than_or_equal: 130
        - fact: variables.town_fear
          greater_than_or_equal: 40
        - fact: facts.luo_hidden_grain_exposed
          not_equals: true
    effects:
      - type: add_fact
        key: luo_is_hiding_grain
        value: true
      - type: change_variable
        key: food_price
        delta: 10
      - type: trigger_event
        event_id: event_grain_shortage_rumor

  - id: rule_luo_ask_protection
    name: 请求保护米铺
    priority: 80
    conditions:
      all:
        - fact: variables.bandit_power
          greater_than_or_equal: 60
        - fact: relationship.player.npc_luo_shoucang.trust
          greater_than_or_equal: 20
    effects:
      - type: start_dialogue
        dialogue_id: dialogue_luo_ask_protection
```

## 10. 玩家可能选择

| 玩家选择 | 结果 |
|---|---|
| 正常买粮 | 获得粮食，food_price 影响价格。 |
| 说服平价放粮 | 需要高谈判或高关系，稳定效果最好。 |
| 揭露囤粮 | food_price 下降，集市冲突上升。 |
| 威胁开仓 | 快速救助流民，但罗守仓敌对。 |
| 保护米铺 | 罗守仓 trust 上升，可能提供粮食支持。 |
| 默许囤粮 | 与罗守仓利益绑定，流民压力上升。 |

## 11. 关键事件

| 事件 ID | 名称 | 说明 |
|---|---|---|
| event_grain_shortage_rumor | 米粮短缺传闻 | 粮价线起点之一。 |
| event_market_conflict | 集市冲突 | 罗守仓与流民冲突。 |
| event_luo_hidden_grain_found | 发现囤粮 | 玩家可选择揭露或交易。 |
| event_luo_asks_protection | 请求保护米铺 | 连接匪患线。 |

## 12. 可能命运

| 命运 | 条件 | 结果 |
|---|---|---|
| 被说服开仓 | 高关系或谈判成功 | food_price 降低，town_order 稳定。 |
| 被揭露 | 玩家找到证据并公开 | 粮价下降，但集市短期混乱。 |
| 米铺被抢 | 流民压力高且秩序低 | town_order 大幅下降。 |
| 与玩家结盟 | 默许囤粮或保护米铺 | 暗约或利益路线增强。 |

## 13. 结局影响

| 状态 | 影响 |
|---|---|
| 平价放粮 | 青岚得存、仁名远播增强。 |
| 囤粮未揭露 | food_price 可能过高，流民线恶化。 |
| 米铺被抢 | town_order 大幅下降。 |
| 与玩家利益结盟 | 暗约成局倾向增强。 |

## 14. 代表对白

```yaml
- id: dialogue_luo_first_meet
  text: 客人要买米？如今山路不稳，粮价一日一个样，早买总比晚买强。

- id: dialogue_luo_deny_grain
  text: 别看我，我这铺子也快见底了。你若不信，大可自己去山路上看看。

- id: dialogue_luo_confess
  text: 我是藏了米。可你见过饿疯的人吗？我见过，所以我不敢空着仓。

- id: dialogue_luo_low_trust
  text: 你要做义士，就别拿我的米铺做你的名声。
```
