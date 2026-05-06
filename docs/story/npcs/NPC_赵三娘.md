# NPC：赵三娘

## 1. 基础信息

```yaml
id: npc_zhao_sanniang
name: 赵三娘
age: 39
identity: 旧酒肆老板
tier: core
faction: faction_town_people
initial_location: loc_tavern
```

## 2. 角色定位

赵三娘是情报线核心 NPC。她不直接站在善恶两边，而是站在“知道太多、必须自保”的位置。她能帮助玩家快速接触盗匪线、旧案线和镇中隐秘，也可能用假消息误导玩家。

## 3. 公开背景

赵三娘经营旧酒肆多年，来往商旅、猎户、巡守、流民都会在她这里停脚。镇中人都知道她耳目灵，但没人知道她到底听到了多少。

## 4. 私密背景

她年轻时曾因多嘴害死过一名熟人，自此明白消息本身就是刀。她不轻易站队，也不轻易免费开口。

## 5. 隐藏背景

多年前旧庙火案后，有人曾在酒肆后堂躲过一夜。赵三娘知道那人与魏长庚、韩烬旧事有关，但她一直没有说破。

## 6. 性格属性

```yaml
personality:
  kindness: 50
  courage: 55
  greed: 45
  loyalty: 35
  suspicion: 80
  responsibility: 50
```

## 7. 核心目标

1. 保住旧酒肆。
2. 掌握镇中消息。
3. 在各方之间自保。
4. 在必要时用情报换取利益或安全。

## 8. 重要关系

| 对象 | 初始关系 | 说明 |
|---|---:|---|
| 陆怀山 | -5 | 互相需要但互不信任。 |
| 魏长庚 | -10 | 知道镇长压过旧事。 |
| 韩烬 | -20 | 与黑岭盗有间接消息往来。 |
| 许闻舟 | 15 | 认为他太年轻，不知轻重。 |
| 玩家 | 0 | 视玩家是否守信而变化。 |

## 9. 日程设计

```yaml
schedule:
  - segment: morning
    location: loc_tavern
    activity: prepare_tavern
  - segment: noon
    location: loc_tavern
    activity: listen_to_guests
  - segment: night
    location: loc_tavern
    activity: backroom_meeting
```

## 10. 自主行为逻辑

```yaml
behavior_rules:
  - id: rule_zhao_spread_rumor
    name: 酒肆传闻扩散
    priority: 60
    conditions:
      all:
        - fact: variables.town_fear
          greater_than_or_equal: 40
    effects:
      - type: trigger_event
        event_id: event_tavern_rumor_spreads

  - id: rule_zhao_sell_bandit_info
    name: 出售盗匪情报
    priority: 80
    conditions:
      all:
        - fact: relationship.player.npc_zhao_sanniang.trust
          greater_than_or_equal: 30
        - fact: facts.zhao_sold_bandit_info
          not_equals: true
    effects:
      - type: start_dialogue
        dialogue_id: dialogue_zhao_sell_bandit_info
```

## 11. 玩家可能选择

| 玩家选择 | 结果 |
|---|---|
| 请酒套话 | 花钱获得普通传闻。 |
| 买情报 | 获得盗匪、旧案或粮价线索。 |
| 帮她处理闹事客 | trust 上升，解锁后堂。 |
| 威胁她交代秘密 | 可能获得短期线索，但她会敌对或给假消息。 |
| 替她隐瞒消息来源 | 关系上升，但陆怀山可能降低信任。 |
| 把她卖给巡守 | 陆怀山可能上升，赵三娘永久敌对。 |

## 12. 关键事件

| 事件 ID | 名称 | 说明 |
|---|---|---|
| event_tavern_rumor_spreads | 酒肆流言扩散 | 世界状态提示。 |
| event_zhao_sells_bandit_info | 出售盗匪情报 | 连接匪患线。 |
| event_zhao_old_case_hint | 旧案提示 | 连接旧庙火案。 |
| event_tavern_backroom_meeting | 后堂密谈 | 可能接触内应或黑岭盗消息。 |

## 13. 可能命运

| 命运 | 条件 | 结果 |
|---|---|---|
| 成为情报盟友 | 玩家守信且付出代价 | 持续提供高价值线索。 |
| 保持中立 | 玩家关系一般 | 提供普通传闻，不介入关键事件。 |
| 倒向黑岭盗 | 玩家威胁她且 bandit_power 高 | 误导玩家或泄露玩家行动。 |
| 被巡守带走 | 玩家告发或陆怀山调查推进 | 情报线减少，但秩序可能上升。 |

## 14. 结局影响

| 状态 | 影响 |
|---|---|
| trust 高 | 更容易达成真相昭雪。 |
| 被威胁敌对 | 可能导致暗约或匪患恶化。 |
| 提供旧庙线索 | 解锁破驿旧庙。 |
| 提供假情报 | 玩家可能错过救援时机。 |

## 15. 代表对白

```yaml
- id: dialogue_zhao_first_meet
  text: 进门是客，开口就是价。你想喝酒，还是想听话？

- id: dialogue_zhao_bandit_info
  text: 黑岭盗在镇里有耳朵。你若真想知道是谁，别在前堂问。

- id: dialogue_zhao_old_case
  text: 旧庙那场火？镇里老人都记得，只是没人愿意记得太清楚。

- id: dialogue_zhao_low_trust
  text: 我这人记性好，尤其记得谁拿话逼过我。
```
