# NPC：许闻舟

## 1. 基础信息

```yaml
id: npc_xu_wenzhou
name: 许闻舟
age: 27
identity: 外来书生
tier: important
faction: faction_outsider
initial_location: loc_tavern
```

## 2. 角色定位

许闻舟是旧案线的重要推进者。他从外地来到青岚镇，不是为了科考或游历，而是为了查清父辈与旧庙火案的关系。

## 3. 公开背景

许闻舟自称路过青岚镇，暂住旧酒肆。他常带着手稿，在祠堂、酒肆和旧道附近打听旧事。

## 4. 私密背景

他的父亲曾与破驿旧庙火案有关。许闻舟手中有一封残信，只知道父亲生前最后一次出现就在青岚镇附近。

## 5. 隐藏背景

许闻舟并不完全知道真相。他以为魏长庚是唯一关键人物，却不知道韩烬与旧庙暗室同样有关。如果玩家引导不当，他可能过早暴露调查意图而被威胁或失踪。

## 6. 性格属性

```yaml
personality:
  kindness: 60
  courage: 45
  greed: 5
  loyalty: 50
  suspicion: 50
  responsibility: 70
```

## 7. 核心目标

1. 查明父亲与旧庙火案的关系。
2. 找到祠堂缺失记录。
3. 接近破驿旧庙。
4. 保全手稿与证据。

## 8. 自主行为逻辑

```yaml
behavior_rules:
  - id: rule_xu_investigate_hall
    name: 调查祠堂
    priority: 65
    conditions:
      all:
        - fact: variables.truth_progress
          greater_than_or_equal: 20
        - fact: facts.xu_warned
          not_equals: true
    effects:
      - type: move_npc
        npc_id: npc_xu_wenzhou
        location_id: loc_ancestral_hall

  - id: rule_xu_takes_risk
    name: 冒险夜探旧档
    priority: 80
    conditions:
      all:
        - fact: variables.truth_progress
          greater_than_or_equal: 45
        - fact: facts.wei_suppressed_truth
          equals: true
        - fact: facts.xu_protected
          not_equals: true
    effects:
      - type: trigger_event
        event_id: event_xu_night_investigation
```

## 9. 玩家可能选择

| 玩家选择 | 结果 |
|---|---|
| 与他交换线索 | truth_progress +，许闻舟 trust +。 |
| 劝他谨慎 | 降低他失踪风险。 |
| 利用他试探魏长庚 | 快速推进真相，但许闻舟风险上升。 |
| 把他交给镇长 | 魏长庚关系上升，真相线受阻。 |
| 帮他夜探祠堂 | 可能获得旧档证据。 |
| 带他去旧庙 | 推进真相终局，也可能触发危险。 |

## 10. 关键事件

| 事件 ID | 名称 | 说明 |
|---|---|---|
| event_xu_asks_old_case | 书生问旧案 | 旧案线早期提示。 |
| event_xu_shows_letter | 残信 | 证明旧庙火案与外来者有关。 |
| event_xu_night_investigation | 夜探旧档 | 高风险推进。 |
| event_xu_threatened | 许闻舟被威胁 | 魏长庚压制真相后的后果。 |

## 11. 可能命运

| 命运 | 条件 | 结果 |
|---|---|---|
| 完成手稿 | truth_progress 高且存活 | 真相昭雪文本更完整。 |
| 被威胁离镇 | 玩家未保护且魏长庚压制真相 | 旧案线减少线索。 |
| 失踪 | 夜探失败或旧庙危险 | 真相线变难。 |
| 与玩家反目 | 玩家出卖他 | 暗约成局或旧案失败。 |

## 12. 结局影响

| 状态 | 影响 |
|---|---|
| 存活且完成调查 | 真相昭雪增强。 |
| 失踪 | 旧案线悲剧，truth_progress 受限。 |
| 被玩家出卖 | 暗约成局增强。 |

## 13. 代表对白

```yaml
- id: dialogue_xu_first_meet
  text: 我只是路过此地，顺手查些旧年风物。你不必把我当成麻烦。

- id: dialogue_xu_letter
  text: 这封信只剩半页，可上面的地名，确是青岚旧驿。

- id: dialogue_xu_warned
  text: 你说得对。我若太急，只会让他们先动手。

- id: dialogue_xu_betrayed
  text: 原来你也觉得，有些真相不配见光。
```
