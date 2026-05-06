# NPC：小宛

## 1. 基础信息

```yaml
id: npc_xiao_wan
name: 小宛
age: 13
identity: 流民少女
tier: important
faction: faction_refugee
initial_location: loc_town_gate
```

## 2. 角色定位

小宛是流民线与人情线的代表 NPC。她的命运用于体现玩家对弱者、粮价和镇中秩序的处理方式。

## 3. 公开背景

小宛随流民来到青岚镇外，身边只剩一个旧布包。她不太主动说话，但常在镇门和民居区附近徘徊。

## 4. 私密背景

她原本随父兄逃荒，途中失散。她记得父亲曾说青岚镇有药铺和米铺，所以一路走到这里。

## 5. 隐藏背景

小宛曾在山路上见过黑岭盗搬运货物，也记得其中一人手上有旧庙纹样的铜牌。她不知道这条线索的重要性。

## 6. 性格属性

```yaml
personality:
  kindness: 55
  courage: 35
  greed: 15
  loyalty: 40
  suspicion: 70
  responsibility: 30
```

## 7. 核心目标

1. 活下去。
2. 找到失散亲人。
3. 获得食物和安全住处。
4. 避免被驱逐出镇。

## 8. 自主行为逻辑

```yaml
behavior_rules:
  - id: rule_xiao_wan_seek_food
    name: 寻找食物
    priority: 70
    conditions:
      all:
        - fact: variables.food_price
          greater_than_or_equal: 140
        - fact: facts.xiao_wan_helped
          not_equals: true
    effects:
      - type: trigger_event
        event_id: event_xiao_wan_steals_food

  - id: rule_xiao_wan_flee
    name: 恐慌时逃离
    priority: 80
    conditions:
      all:
        - fact: variables.town_fear
          greater_than_or_equal: 75
        - fact: facts.xiao_wan_protected
          not_equals: true
    effects:
      - type: move_npc
        npc_id: npc_xiao_wan
        location_id: loc_forest
      - type: add_fact
        key: xiao_wan_fled_to_forest
        value: true
```

## 9. 玩家可能选择

| 玩家选择 | 结果 |
|---|---|
| 给她食物 | reputation +，xiao_wan trust +。 |
| 帮她找住处 | refugee_pressure -，民居区线改善。 |
| 询问山路见闻 | trust 足够时获得盗匪线索。 |
| 把她交给巡守 | town_order 短期 +，她信任下降。 |
| 驱逐流民 | refugee_pressure 表面下降，town_fear 上升。 |
| 利用她传话 | 可能获得情报，但道德评价下降。 |

## 10. 关键事件

| 事件 ID | 名称 | 说明 |
|---|---|---|
| event_xiao_wan_begs_food | 小宛求食 | 早期人情事件。 |
| event_xiao_wan_steals_food | 偷粮事件 | 粮价线恶化后触发。 |
| event_xiao_wan_fled_to_forest | 小宛逃入山林 | 高恐慌后触发。 |
| event_xiao_wan_bandit_clue | 小宛的山路线索 | 连接匪患与旧庙。 |

## 11. 可能命运

| 命运 | 条件 | 结果 |
|---|---|---|
| 被安置 | 玩家持续救助 | 仁名远播、青岚得存变体。 |
| 偷粮被抓 | food_price 高且未救助 | 集市冲突增加。 |
| 被驱逐 | 玩家或魏长庚压制流民 | town_order 短期上升，town_fear 上升。 |
| 逃入山林 | 高恐慌且无保护 | 可能失踪或触发救援。 |

## 12. 结局影响

| 状态 | 影响 |
|---|---|
| 获救 | 仁名远播评价增强。 |
| 失踪 | 空镇余烬或匪患恶化氛围增强。 |
| 提供线索 | 推进盗匪和旧庙线。 |
| 被驱逐 | 暗约或冷酷路线评价增强。 |

## 13. 代表对白

```yaml
- id: dialogue_xiao_wan_first_meet
  text: 我不进镇。我就在门边站一会儿，等人。

- id: dialogue_xiao_wan_hungry
  text: 我可以替你跑腿。只要一点吃的，不用多。

- id: dialogue_xiao_wan_clue
  text: 我在山路上见过那些人。他们搬着箱子，往破庙那边去了。

- id: dialogue_xiao_wan_low_trust
  text: 大人说帮忙的时候，总像是在赶人走。
```
