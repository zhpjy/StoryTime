# NPC：陆怀山

## 1. 基础信息

```yaml
id: npc_lu_huaishan
name: 陆怀山
age: 34
identity: 镇中巡守
tier: core
faction: faction_guard
initial_location: loc_town_gate
```

## 2. 角色定位

陆怀山是匪患线和秩序线的核心 NPC。他代表青岚镇中仍试图维持规则的人。玩家若与他合作，可以压制盗匪、稳定镇门、追查内应，并逐步触及旧案真相。

## 3. 公开背景

陆怀山是青岚镇巡守头目，平日驻守镇门，负责巡逻山路、检查流民和处理集市纠纷。镇民大多认为他不苟言笑，但还算公正。

## 4. 私密背景

陆怀山多年前并非青岚镇人。他来到这里后，发现镇中旧案记录多处缺失，镇长魏长庚又总是阻止他深入调查。他表面服从镇规，暗中一直在收集线索。

## 5. 隐藏背景

陆怀山怀疑黑岭盗重新出现并非偶然。盗匪能避开巡守路线，说明镇中有人通风报信，而这条线可能与旧庙火案有关。

## 6. 性格属性

```yaml
personality:
  kindness: 45
  courage: 75
  greed: 10
  loyalty: 80
  suspicion: 65
  responsibility: 85
```

## 7. 初始状态

```yaml
state:
  alive: true
  health: 100
  mood: alert
  current_goal: maintain_order
  story_stage: 1
```

## 8. 核心目标

1. 维持青岚镇秩序。
2. 压制黑岭盗。
3. 查清镇中内应。
4. 在不引发镇中动荡的前提下接近旧案真相。

## 9. 重要关系

| 对象 | 初始关系 | 说明 |
|---|---:|---|
| 魏长庚 | 10 | 表面上下级，实际互相防备。 |
| 沈青禾 | 25 | 认可她救人之心。 |
| 赵三娘 | -5 | 知道她消息灵通，但不信她。 |
| 韩烬 | -80 | 盗匪首领，主要敌人。 |
| 玩家 | 0 | 根据是否协助巡守变化。 |

## 10. 日程设计

```yaml
schedule:
  - segment: morning
    location: loc_town_gate
    activity: inspect_gate
  - segment: noon
    location: loc_market
    activity: patrol_market
    conditions:
      all:
        - fact: location.loc_market.state.conflict_level
          greater_than_or_equal: 20
  - segment: night
    location: loc_town_gate
    activity: night_watch
```

## 11. 自主行为逻辑

### 11.1 集市冲突升高时巡逻

```yaml
id: rule_lu_patrol_market
priority: 70
conditions:
  all:
    - fact: location.loc_market.state.conflict_level
      greater_than_or_equal: 30
effects:
  - type: move_npc
    npc_id: npc_lu_huaishan
    location_id: loc_market
  - type: change_variable
    key: town_order
    delta: 3
```

### 11.2 调查盗匪内应

```yaml
id: rule_lu_investigate_bandit
priority: 85
conditions:
  all:
    - fact: variables.bandit_power
      greater_than_or_equal: 60
    - fact: facts.lu_started_investigation
      not_equals: true
effects:
  - type: add_fact
    key: lu_started_investigation
    value: true
  - type: trigger_event
    event_id: event_lu_investigates_traitor
```

### 11.3 真相推进后质疑镇长

```yaml
id: rule_lu_question_wei
priority: 75
conditions:
  all:
    - fact: variables.truth_progress
      greater_than_or_equal: 50
    - fact: facts.lu_questioned_wei
      not_equals: true
effects:
  - type: add_fact
    key: lu_questioned_wei
    value: true
  - type: trigger_event
    event_id: event_lu_questions_mayor
```

## 12. 玩家可能选择

| 玩家选择 | 条件 | 结果 |
|---|---|---|
| 协助巡逻 | 白天，陆怀山在场 | guard_power +3，trust +5。 |
| 报告盗匪线索 | 获得山林或酒肆线索 | 推进匪患线，trust +10。 |
| 隐瞒赵三娘情报 | 获得情报但不报告 | 陆怀山后续可能降低信任。 |
| 与陆怀山查旧案 | truth_progress >= 30 | 解锁祠堂与旧庙线索。 |
| 当众质疑他 | 关系低时 | suspicion 上升，巡守合作受阻。 |
| 帮他埋伏盗匪 | 武人身份或 combat 高 | bandit_power 下降，guard_power 可能消耗。 |

## 13. 关键事件

| 事件 ID | 名称 | 说明 |
|---|---|---|
| event_merchant_route_attacked | 商路遇袭 | 陆怀山开始重视盗匪。 |
| event_lu_investigates_traitor | 调查内应 | 匪患线进入第二阶段。 |
| event_lu_questions_mayor | 质疑镇长 | 旧案线与巡守线连接。 |
| event_gate_defense | 镇门防守 | 后期抵御盗匪。 |
| event_lu_final_stand | 陆怀山最后抵抗 | 匪火结局或守镇结局变体。 |

## 14. 可能命运

### 14.1 成功守镇

玩家持续协助巡守，bandit_power 被压制，陆怀山存活。

结果：镇门稳定，青岚得存概率提高。

### 14.2 调查受阻

魏长庚压制旧案，赵三娘不提供情报，玩家不协助。

结果：陆怀山无法找到内应，匪患线恶化。

### 14.3 战死镇门

bandit_power 高、guard_power 低时触发夜袭。若玩家未协助防守，陆怀山可能战死。

### 14.4 反目

玩家与韩烬或魏长庚暗中合作时，陆怀山可能成为阻碍，进入敌对状态。

## 15. 结局影响

| 状态 | 影响 |
|---|---|
| 存活且 trust 高 | 青岚得存、真相昭雪增强。 |
| 死亡 | 匪火入镇概率提升，真相昭雪条件可能失败。 |
| 与玩家敌对 | 暗约成局或血债难消倾向增强。 |
| 完成内应调查 | 降低 bandit_power，提升 guard_power。 |

## 16. 代表对白

```yaml
- id: dialogue_lu_first_meet
  text: 外乡人？这几日山路不太平，进了镇，就少往黑处走。

- id: dialogue_lu_bandit_warning
  text: 黑岭盗不是寻常流寇。他们知道哪条路没人守，这才麻烦。

- id: dialogue_lu_truth_line
  text: 祠堂旧档少了几页。一个镇若连自己的旧事都不敢记，迟早要出事。

- id: dialogue_lu_low_trust
  text: 你知道得不少，却总挑着不说。这样的人，我很难放心。
```
