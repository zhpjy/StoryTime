# NPC：魏长庚

## 1. 基础信息

```yaml
id: npc_wei_changgeng
name: 魏长庚
age: 56
identity: 青岚镇镇长
tier: core
faction: faction_town_authority
initial_location: loc_ancestral_hall
```

## 2. 角色定位

魏长庚是旧案线核心 NPC，也是青岚镇表面秩序的维护者。他并非单纯恶人。他确实维持过青岚镇多年稳定，但也用隐瞒、压制和妥协埋下了今日的祸根。

## 3. 公开背景

魏长庚做镇长多年，讲规矩、重体面，镇中祭祀、赋税、巡守调度都由他主持。大部分镇民对他有敬畏，也有不满。

## 4. 私密背景

他深知青岚镇脆弱，害怕旧事翻出后镇中人心崩散。因此面对旧庙火案，他选择压下部分证词，用稳定换沉默。

## 5. 隐藏背景

多年前破驿旧庙火案中，魏长庚隐瞒了关键事实。当年火案与一批被藏在旧庙暗室中的人和物有关，也与后来韩烬走上盗匪之路存在联系。

## 6. 性格属性

```yaml
personality:
  kindness: 30
  courage: 45
  greed: 40
  loyalty: 60
  suspicion: 75
  responsibility: 65
```

## 7. 核心目标

1. 维持青岚镇表面稳定。
2. 防止旧庙火案真相被公开。
3. 避免黑岭盗直接入镇。
4. 保住自己的权威和镇长之位。

## 8. 重要关系

| 对象 | 初始关系 | 说明 |
|---|---:|---|
| 陆怀山 | 10 | 需要他维持秩序，但防备他追查旧案。 |
| 赵三娘 | -10 | 知道她掌握旧事。 |
| 韩烬 | -40 | 旧事牵连复杂，表面敌对。 |
| 许闻舟 | -20 | 认为他会破坏小镇稳定。 |
| 玩家 | 0 | 根据玩家是否听命或调查而变化。 |

## 9. 自主行为逻辑

```yaml
behavior_rules:
  - id: rule_wei_suppress_truth
    name: 压制旧案线索
    priority: 90
    conditions:
      all:
        - fact: variables.truth_progress
          greater_than_or_equal: 40
        - fact: facts.wei_suppressed_truth
          not_equals: true
    effects:
      - type: add_fact
        key: wei_suppressed_truth
        value: true
      - type: change_variable
        key: town_order
        delta: -5
      - type: trigger_event
        event_id: event_wei_blocks_records

  - id: rule_wei_control_refugees
    name: 要求驱逐流民
    priority: 60
    conditions:
      all:
        - fact: variables.refugee_pressure
          greater_than_or_equal: 50
    effects:
      - type: trigger_event
        event_id: event_wei_orders_refugee_control
```

## 10. 玩家可能选择

| 玩家选择 | 结果 |
|---|---|
| 配合镇长维稳 | town_order 短期上升，truth_progress 受限。 |
| 请求打开旧档 | 关系足够或有陆怀山支持才可能成功。 |
| 当众质问旧案 | truth_progress 可能上升，但 town_order 下降。 |
| 帮他压制流民 | 获得镇长支持，但声望和小宛线受损。 |
| 与他交易 | 解锁暗约成局。 |
| 揭露他 | 真相线推进，镇中秩序震荡。 |

## 11. 关键事件

| 事件 ID | 名称 | 说明 |
|---|---|---|
| event_wei_blocks_records | 镇长封锁旧档 | 阻碍旧案线。 |
| event_wei_orders_refugee_control | 镇长要求处理流民 | 粮价线与秩序线冲突。 |
| event_lu_questions_mayor | 陆怀山质疑镇长 | 旧案线升级。 |
| event_wei_final_confrontation | 与魏长庚对质 | 真相结局前置。 |

## 12. 可能命运

| 命运 | 条件 | 结果 |
|---|---|---|
| 继续掌权 | truth_progress 低，玩家配合 | 暗约或普通稳定结局。 |
| 被迫退位 | truth_progress 高但 town_order 尚可 | 真相昭雪。 |
| 被镇民清算 | truth_progress 高且 town_fear 高 | 真相揭开但小镇动荡。 |
| 死亡 | 暴力路线或匪患失控 | 真相可能残缺。 |

## 13. 结局影响

| 状态 | 影响 |
|---|---|
| 真相被压下 | 暗约成局或孤身远行。 |
| 被揭露且存活 | 真相昭雪最完整。 |
| 死亡 | 旧案线可能残缺，镇中秩序下降。 |
| 与玩家结盟 | 可短期维稳，但牺牲真相。 |

## 14. 代表对白

```yaml
- id: dialogue_wei_first_meet
  text: 外来之人，行事须有分寸。青岚镇小，经不起太多风浪。

- id: dialogue_wei_suppress_truth
  text: 有些旧事翻出来，只会让活人再死一遍。你当真担得起？

- id: dialogue_wei_deal
  text: 你要药、要粮、要路，我都可以给。只要你别再碰旧庙的事。

- id: dialogue_wei_exposed
  text: 我不是为了自己才压下那些话。可到了今日，怕是没人会信了。
```
