# NPC：老药师

## 1. 基础信息

```yaml
id: npc_old_doctor
name: 顾半山
age: 68
identity: 回春药铺老药师
tier: important
faction: faction_town_people
initial_location: loc_herb_shop
```

## 2. 角色定位

老药师顾半山是疫病线的知识源，也是沈青禾的师父。他掌握一部分旧庙草药和旧案相关信息，但因年老体弱和旧日愧疚，不愿主动提起。

## 3. 公开背景

顾半山在青岚镇行医多年，镇中多数人都受过他的照看。他年事已高，近年逐渐把药铺事务交给沈青禾。

## 4. 私密背景

他年轻时曾去过破驿旧庙附近采药，也知道那里有几味特殊草药。旧庙火案后，他不再让药铺的人靠近那片地方。

## 5. 隐藏背景

顾半山当年曾救过旧庙火案中的一个人，但他没有把此事告诉巡守。他害怕牵连药铺，也害怕魏长庚追究。

## 6. 性格属性

```yaml
personality:
  kindness: 75
  courage: 25
  greed: 5
  loyalty: 65
  suspicion: 50
  responsibility: 80
```

## 7. 核心目标

1. 保住药铺。
2. 保护沈青禾。
3. 控制疫病。
4. 避免旧庙旧事再次伤人。

## 8. 自主行为逻辑

```yaml
behavior_rules:
  - id: rule_old_doctor_exhausted
    name: 疲惫倒下
    priority: 70
    conditions:
      all:
        - fact: variables.plague_level
          greater_than_or_equal: 60
        - fact: facts.old_doctor_collapsed
          not_equals: true
    effects:
      - type: add_fact
        key: old_doctor_collapsed
        value: true
      - type: change_npc_state
        npc_id: npc_old_doctor
        path: health
        value: 40
      - type: trigger_event
        event_id: event_old_doctor_collapses

  - id: rule_old_doctor_reveal_note
    name: 透露旧药草残页
    priority: 80
    conditions:
      all:
        - fact: relationship.player.npc_shen_qinghe.trust
          greater_than_or_equal: 40
        - fact: variables.plague_level
          greater_than_or_equal: 45
        - fact: facts.old_doctor_revealed_note
          not_equals: true
    effects:
      - type: add_fact
        key: old_doctor_revealed_note
        value: true
      - type: add_fact
        key: shen_hidden_herb_note_found
        value: true
```

## 9. 玩家可能选择

| 玩家选择 | 结果 |
|---|---|
| 请教病情 | 获得疫病线索。 |
| 帮他分担问诊 | 减少老药师倒下概率。 |
| 追问旧庙草药 | trust 足够时解锁残页。 |
| 逼他说出旧事 | suspicion 上升，可能拒绝。 |
| 救治老药师 | 医者身份有优势。 |
| 忽视药铺压力 | 老药师可能倒下。 |

## 10. 关键事件

| 事件 ID | 名称 | 说明 |
|---|---|---|
| event_old_doctor_collapses | 老药师倒下 | 药铺压力失控表现。 |
| event_old_doctor_reveals_note | 旧药草残页 | 连接旧庙和疫病真因。 |
| event_old_doctor_old_case_memory | 老药师回忆旧案 | 旧案线辅助线索。 |

## 11. 可能命运

| 命运 | 条件 | 结果 |
|---|---|---|
| 平安撑过三十天 | 疫病控制较好 | 药铺稳定。 |
| 疲惫倒下 | plague_level 高且无人帮忙 | 沈青禾压力上升。 |
| 说出旧事 | 玩家与药铺关系高 | 解锁旧庙线索。 |
| 病逝 | 疫病失控 | 空镇余烬增强。 |

## 12. 结局影响

| 状态 | 影响 |
|---|---|
| 存活 | 疫病线更容易稳定。 |
| 倒下或死亡 | plague_level 更难压制。 |
| 透露残页 | 真相线和疫病真因推进。 |

## 13. 代表对白

```yaml
- id: dialogue_old_doctor_first
  text: 病来如山倒，人心乱起来，比病还快。

- id: dialogue_old_doctor_note
  text: 那地方的草药，我年轻时采过。后来旧庙出了事，我便再不许人去。

- id: dialogue_old_doctor_warning
  text: 青禾心软，担得太多。若她要上山，你最好拦一拦。

- id: dialogue_old_doctor_old_case
  text: 有些人不是死在火里，是死在后来那场沉默里。
```
