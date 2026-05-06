# NPC：老祠祝

## 1. 基础信息

```yaml
id: npc_old_ritualist
name: 周敬
age: 73
identity: 祠堂老祠祝
tier: important
faction: faction_town_people
initial_location: loc_ancestral_hall
```

## 2. 角色定位

老祠祝周敬是旧案线的守门人。他掌管祠堂钥匙和旧档房，但他不愿轻易打开记录，因为他知道真相会伤及许多仍活着的人。

## 3. 公开背景

周敬在祠堂守了几十年，负责祭祀、香火和旧档看管。镇中年轻人多觉得他古板，老人则知道他记得许多往事。

## 4. 私密背景

他知道旧庙火案的记录缺页，也知道魏长庚曾亲自取走部分证词。他不是不知道真相，而是不敢确定真相公开后，青岚镇是否还能维持。

## 5. 隐藏背景

周敬保留了一份未烧尽的旧案名册，藏在祠堂正堂牌位后。只有在玩家获得足够信任或旧案已经无法压下时，他才会交出。

## 6. 性格属性

```yaml
personality:
  kindness: 50
  courage: 35
  greed: 0
  loyalty: 80
  suspicion: 65
  responsibility: 75
```

## 7. 核心目标

1. 守住祠堂。
2. 避免镇中旧怨激化。
3. 判断玩家是否值得托付旧档线索。
4. 在最后时刻为真相作证。

## 8. 自主行为逻辑

```yaml
behavior_rules:
  - id: rule_ritualist_lock_records
    name: 锁住旧档房
    priority: 70
    conditions:
      all:
        - fact: variables.truth_progress
          less_than: 30
    effects:
      - type: change_location_state
        location_id: loc_ancestral_hall
        path: record_locked
        value: true

  - id: rule_ritualist_reveal_registry
    name: 交出旧案名册
    priority: 85
    conditions:
      all:
        - fact: variables.truth_progress
          greater_than_or_equal: 60
        - fact: relationship.player.npc_old_ritualist.trust
          greater_than_or_equal: 30
        - fact: facts.old_registry_revealed
          not_equals: true
    effects:
      - type: add_fact
        key: old_registry_revealed
        value: true
      - type: change_variable
        key: truth_progress
        delta: 15
```

## 9. 玩家可能选择

| 玩家选择 | 结果 |
|---|---|
| 正常询问镇史 | 获得少量旧案背景。 |
| 多次祭拜或帮忙整理祠堂 | trust 上升。 |
| 请求查阅旧档 | 需要 trust 或陆怀山协助。 |
| 夜探旧档房 | 快速推进，但被发现会敌对。 |
| 逼迫交出名册 | 可能获得线索，但 town_order 下降。 |
| 保护他免受魏长庚施压 | 解锁名册。 |

## 10. 关键事件

| 事件 ID | 名称 | 说明 |
|---|---|---|
| event_ask_old_ritualist | 询问旧案 | 初期旧案线入口。 |
| event_record_room_unlocked | 旧档房开启 | truth_progress 大幅推进。 |
| event_old_registry_revealed | 旧案名册 | 旧庙线关键证据。 |
| event_ritualist_pressured | 祠祝受压 | 魏长庚压制真相后触发。 |

## 11. 可能命运

| 命运 | 条件 | 结果 |
|---|---|---|
| 交出名册 | 玩家获得信任 | 真相昭雪增强。 |
| 继续沉默 | 玩家未推进旧案 | 真相线受限。 |
| 被魏长庚压制 | truth_progress 高但玩家未保护 | 旧档线部分断裂。 |
| 被暴力逼迫 | 玩家强硬路线 | 线索可得，但声望和秩序下降。 |

## 12. 结局影响

| 状态 | 影响 |
|---|---|
| 交出名册 | 真相昭雪关键加成。 |
| 沉默 | 旧案难以完整。 |
| 被逼迫 | 血债难消或动荡评价增强。 |

## 13. 代表对白

```yaml
- id: dialogue_ritualist_first
  text: 祠堂里供的是死人，最怕活人拿死人做刀。

- id: dialogue_ritualist_records
  text: 旧档不是不能看，是看了以后，你得知道怎么收场。

- id: dialogue_ritualist_registry
  text: 这册子我藏了多年。不是不想交，是一直没等到能接住它的人。

- id: dialogue_ritualist_low_trust
  text: 你问得太急。急着翻旧事的人，未必是为了公道。
```
