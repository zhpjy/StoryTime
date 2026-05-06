# NPC：韩烬

## 1. 基础信息

```yaml
id: npc_han_jin
name: 韩烬
age: 41
identity: 黑岭盗首领
tier: core
faction: faction_bandit
initial_location: loc_forest
```

## 2. 角色定位

韩烬是匪患线主要对手，也是旧庙火案的隐性关联者。他不常直接出现在镇内，但他的行动会持续改变商路、药材、粮食和镇门安全。

## 3. 公开背景

黑岭盗近年重新活跃，韩烬是其首领。传闻他曾是山路猎户，也有人说他本就是旧驿一带的亡命人。

## 4. 私密背景

韩烬并非只为劫掠。他对青岚镇和破驿旧庙有旧怨。他知道某些人用“秩序”掩盖了当年的火。

## 5. 隐藏背景

韩烬与旧庙火案幸存者有关。他寻找旧庙暗室，既是为了威胁魏长庚，也是为了拿回当年被埋下的证据或遗物。

## 6. 性格属性

```yaml
personality:
  kindness: 10
  courage: 85
  greed: 60
  loyalty: 40
  suspicion: 70
  responsibility: 20
```

## 7. 核心目标

1. 控制青岚山路。
2. 掠夺药材与粮食，增强黑岭盗势力。
3. 找到旧庙暗室。
4. 报复魏长庚或青岚镇旧势力。

## 8. 重要关系

| 对象 | 初始关系 | 说明 |
|---|---:|---|
| 陆怀山 | -80 | 正面对手。 |
| 魏长庚 | -40 | 旧事纠缠。 |
| 赵三娘 | -20 | 知道她掌握消息。 |
| 沈青禾 | -60 | 曾劫药材，间接伤害药铺。 |
| 玩家 | -20 | 可敌对，也可交易。 |

## 9. 自主行为逻辑

```yaml
behavior_rules:
  - id: rule_han_attack_route
    name: 袭击商路
    priority: 70
    conditions:
      all:
        - fact: variables.bandit_power
          greater_than_or_equal: 50
        - fact: facts.bandit_attacked_route
          not_equals: true
    effects:
      - type: add_fact
        key: bandit_attacked_route
        value: true
      - type: change_variable
        key: merchant_route_safety
        delta: -20
      - type: change_variable
        key: herb_stock
        delta: -10
      - type: trigger_event
        event_id: event_merchant_route_attacked

  - id: rule_han_night_raid
    name: 夜袭青岚镇
    priority: 95
    conditions:
      all:
        - fact: variables.bandit_power
          greater_than_or_equal: 80
        - fact: variables.guard_power
          less_than_or_equal: 40
        - fact: facts.bandit_night_raid_happened
          not_equals: true
    effects:
      - type: trigger_event
        event_id: event_bandit_night_raid
```

## 10. 玩家可能选择

| 玩家选择 | 结果 |
|---|---|
| 追踪盗匪 | 推进匪患线，可能发现旧庙。 |
| 正面战斗 | 降低 bandit_power，但有受伤或死亡风险。 |
| 埋伏山路 | 需要陆怀山或武人能力，效果较好。 |
| 与韩烬谈判 | 可能获得旧案线索，也可能进入暗约。 |
| 出卖镇中信息 | 韩烬关系上升，镇中秩序下降。 |
| 救出被劫 NPC | 降低韩烬势力，提升相关 NPC 信任。 |

## 11. 关键事件

| 事件 ID | 名称 | 说明 |
|---|---|---|
| event_merchant_route_attacked | 商路遇袭 | 匪患线起点。 |
| event_bandit_trace_found | 发现盗匪踪迹 | 山林追踪。 |
| event_han_demands_supplies | 韩烬索要物资 | 中期压力事件。 |
| event_bandit_night_raid | 黑岭盗夜袭 | 灾难结局核心。 |
| event_han_old_temple_confrontation | 旧庙对峙 | 旧案线与匪患线汇合。 |

## 12. 可能命运

| 命运 | 条件 | 结果 |
|---|---|---|
| 被击退 | bandit_power 降低，玩家或陆怀山行动成功 | 商路恢复。 |
| 被杀 | 战斗路线成功 | 匪患大幅下降，但旧案部分线索可能断裂。 |
| 达成暗约 | 玩家与其交易 | 暗约成局。 |
| 攻入青岚镇 | bandit_power 高且 guard_power 低 | 匪火入镇。 |

## 13. 结局影响

| 状态 | 影响 |
|---|---|
| bandit_power 高 | 匪火入镇。 |
| 韩烬死亡 | 青岚得存更容易，但旧案可能残缺。 |
| 韩烬提供旧庙线索 | 真相昭雪推进。 |
| 与玩家结盟 | 暗约成局。 |

## 14. 代表对白

```yaml
- id: dialogue_han_first_meet
  text: 青岚镇的人总以为关上门，就能把山里的债也关在外头。

- id: dialogue_han_deal
  text: 你要镇子活，我要旧庙里的东西。我们未必非得做敌人。

- id: dialogue_han_enemy
  text: 陆怀山守的是门，魏长庚守的是谎。你又想守什么？

- id: dialogue_han_defeated
  text: 火早就烧过一次了。你们只是拖到今日，才肯看见灰。
```
