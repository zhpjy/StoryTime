# NPC：沈青禾

## 1. 基础信息

```yaml
id: npc_shen_qinghe
name: 沈青禾
age: 22
identity: 回春药铺学徒
tier: core
faction: faction_town_people
initial_location: loc_herb_shop
```

## 2. 角色定位

沈青禾是疫病线的核心 NPC，也是玩家最容易在早期建立情感连接的人物。她代表青岚镇中“愿意救人但能力有限”的一面。

她不是等待玩家拯救的静态角色。若玩家不介入，她会根据药铺压力自行行动，例如彻夜熬药、请求帮助、独自上山采药，甚至因此失踪或死亡。

## 3. 公开背景

沈青禾是回春药铺的年轻学徒。镇中人大多知道她从小被老药师收留，跟着学医多年。她医术尚未完全成熟，但做事认真，常替贫苦病人少收药钱。

## 4. 私密背景

沈青禾对自己的能力一直没有信心。老药师年事已高，药铺越来越多事务实际由她支撑。她害怕自己判断失误，也害怕病人因她救治不及时而死。

## 5. 隐藏背景

沈青禾曾在老药师旧书中发现一张残页，记录着破驿旧庙附近生长过一种特殊草药。残页被老药师收起，似乎与多年前的旧庙火案有关。

## 6. 性格属性

```yaml
personality:
  kindness: 80
  courage: 55
  greed: 10
  loyalty: 70
  suspicion: 30
  responsibility: 90
```

## 7. 初始状态

```yaml
state:
  alive: true
  health: 85
  mood: anxious
  infected: false
  injured: false
  current_goal: cure_patients
  story_stage: 1
```

## 8. 核心目标

1. 控制镇中疫病。
2. 保护老药师和回春药铺。
3. 找到药材短缺与病源之间的关系。
4. 在能力不足时仍尽可能救人。

## 9. 重要关系

| 对象 | 初始关系 | 说明 |
|---|---:|---|
| 老药师 | 80 | 师徒与家人般的关系。 |
| 陆怀山 | 25 | 信任其为人，但不愿过多牵连巡守。 |
| 赵三娘 | 0 | 知道她消息灵通，但不完全信任。 |
| 韩烬 | -60 | 黑岭盗曾劫走药材。 |
| 玩家 | 0 | 根据玩家是否帮药铺快速变化。 |

## 10. 日程设计

```yaml
schedule:
  - segment: morning
    location: loc_herb_shop
    activity: prepare_medicine
  - segment: noon
    location: loc_herb_shop
    activity: treat_patients
  - segment: night
    location: loc_residential_area
    activity: rest
    conditions:
      all:
        - fact: variables.plague_level
          less_than: 40
  - segment: night
    location: loc_herb_shop
    activity: boil_medicine
    conditions:
      all:
        - fact: variables.plague_level
          greater_than_or_equal: 40
```

## 11. 自主行为逻辑

### 11.1 疫病加重时留守药铺

```yaml
id: rule_shen_stay_shop_when_plague
priority: 80
conditions:
  all:
    - fact: variables.plague_level
      greater_than_or_equal: 40
    - fact: npc.npc_shen_qinghe.state.alive
      equals: true
effects:
  - type: move_npc
    npc_id: npc_shen_qinghe
    location_id: loc_herb_shop
  - type: change_npc_state
    npc_id: npc_shen_qinghe
    path: mood
    value: anxious
```

### 11.2 药材短缺时上山采药

```yaml
id: rule_shen_collect_herbs
priority: 90
conditions:
  all:
    - fact: variables.plague_level
      greater_than_or_equal: 45
    - fact: variables.herb_stock
      less_than: 25
    - fact: facts.shen_collected_herbs
      not_equals: true
effects:
  - type: move_npc
    npc_id: npc_shen_qinghe
    location_id: loc_forest
  - type: add_fact
    key: shen_collected_herbs
    value: true
  - type: trigger_event
    event_id: event_shen_goes_to_forest
```

### 11.3 向玩家请求帮助

```yaml
id: rule_shen_ask_player_help
priority: 85
conditions:
  all:
    - fact: variables.plague_level
      greater_than_or_equal: 35
    - fact: relationship.player.npc_shen_qinghe.trust
      greater_than_or_equal: 20
    - fact: facts.shen_asked_player_for_help
      not_equals: true
effects:
  - type: start_dialogue
    dialogue_id: dialogue_shen_ask_help
  - type: add_fact
    key: shen_asked_player_for_help
    value: true
```

## 12. 玩家可能选择

| 玩家选择 | 条件 | 结果 |
|---|---|---|
| 帮忙诊治病人 | 医者身份或 medicine 高 | plague_level 下降，沈青禾 trust 上升。 |
| 出钱买药给病人 | money 足够 | gratitude 上升，疫病小幅下降。 |
| 陪她上山采药 | 她准备上山时 | 避免失踪，获得药材。 |
| 阻止她上山 | trust 足够 | 她暂时留下，但药材问题仍需解决。 |
| 偷取药材 | 夜晚药柜可接触 | 成功得药，失败则关系大幅下降。 |
| 逼问残页秘密 | trust 不足时 | suspicion 上升，隐藏线索延后。 |
| 帮她调查病源 | 获得后院或山林线索 | 解锁疫病真因线。 |

## 13. 关键事件

| 事件 ID | 名称 | 说明 |
|---|---|---|
| event_first_patient | 第一批病人 | 疫病线起点。 |
| event_herb_shortage_warning | 药材告急 | 药铺压力提升。 |
| event_shen_ask_help | 沈青禾求助 | 玩家与药铺线深入连接。 |
| event_shen_goes_to_forest | 独自上山 | 若不处理可能失踪。 |
| event_shen_missing | 沈青禾失踪 | 药铺线重大危机。 |
| event_plague_origin_found | 疫病真因 | 连接旧庙和山林线。 |

## 14. 可能命运

### 14.1 留守药铺

条件：玩家持续帮忙，药材没有严重短缺。

结果：沈青禾存活，药铺稳定，疫病可控。

### 14.2 上山归来

条件：药材短缺触发上山，但玩家及时同行或寻找。

结果：获得药材，沈青禾 trust 大幅提升，解锁残页秘密。

### 14.3 失踪

条件：沈青禾独自上山后，玩家在数个时间段内没有寻找。

结果：药铺治疗能力下降，plague_level 上升，可能在旧庙或盗匪线中再出现。

### 14.4 死亡

条件：山林危险过高，bandit_power 高，玩家未救援。

结果：药铺线悲剧，空镇余烬概率大幅上升。

## 15. 结局影响

| 状态 | 影响 |
|---|---|
| 存活且 trust 高 | 青岚得存、仁名远播增强。 |
| 失踪 | 空镇余烬倾向增强。 |
| 死亡 | 疫病线救治能力显著下降。 |
| 解开残页秘密 | 可推进旧庙与疫病真因。 |

## 16. 代表对白

```yaml
- id: dialogue_shen_first_meet
  text: 若是买药，请稍候。今日问诊的人多，我怕是顾不过来。

- id: dialogue_shen_ask_help
  text: 药不够了，病人却越来越多。若你愿意帮忙，我想请你去山林寻几味药。

- id: dialogue_shen_secret_note
  text: 这张残页我本不该给你看。师父说过，旧庙那边的草药，最好别再碰。

- id: dialogue_shen_low_trust
  text: 药柜里的药是给病人的，不是给人拿来换筹码的。
```
