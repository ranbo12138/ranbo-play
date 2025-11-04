# 设置与初始化变量

{{ prolog }}

首先就是部署MVU脚本,我们新建一个角色卡, 在酒馆右上角积木按钮 ‣ 酒馆助手 ‣ 脚本库中+ 脚本来新建一个新的局部脚本, 命名随意, 内容填写为:

import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js';


当使用 MVU 变量框架时, 我们在同一个地方完成变量设置和初始化: 一个名字里包含 `[initvar]` 的世界书条目.

:::{figure} initvar名字.png
:::

脚本会自动识别该条目中的 JSON5、TOML 或 YAML 代码, 并将其解析为变量.

为了方便编写和维护, 我个人强烈推荐使用 **YAML** 格式.

## 构建变量结构

让我们以一个包含多角色的复杂角色卡为例. 一个清晰的变量结构不仅能帮助 AI 更好地理解设定, 也能让你自己在后续的修改中一目了然. 因此, 我们不妨先从分类开始:

```yaml
角色:
世界:
```

在 YAML 中, 英文冒号 (`:`) 用于建立归属关系, 而缩进则用来表示层级. 你可以将上面的代码理解为: 我们创建了名为 "角色" 和 "世界" 的两个顶层 "文件夹".


## 填充变量内容

当然, 空的文件夹没有意义, 我们需要向其中填充内容.

```yaml
角色:
  络络:
    好感度: 30
世界:
```

这里有几个关键点需要注意：

层级关系
: 我们通过缩进来表示层级. `络络:` 前面有两个空格, 意味着它被包含在 `角色:` 这个层级之下; `好感度:` 前面有四个空格, 意味着它属于 `络络:`.

缩进规范
: YAML 对格式要求严格, 请务必使用**偶数个空格** (通常是2个) 进行缩进.

赋值
: 像 `30` 这样直接跟在冒号和空格后面的值, 就是 `好感度` 这个变量的具体数值.

依照这个逻辑, 我们可以轻松地构建出一个内容丰富的变量结构:

```yaml
角色:
  络络:
    好感度: 30
    心情: 开心
  青空莉:
    好感度: 60
    心情: 郁闷
世界:
  日期: 2025-07-26
  时间: 21:00
```

## 变量可以是数组

一个变量可以拥有多个值, 这样的变量称为数组:

:::{code-block} yaml
:caption: 法一: 中括号包裹并用英文逗号区分
角色:
  络络:
    背包: [可乐, 薯片, 游戏机]
:::

:::{code-block} yaml
:caption: 法二: 换行缩进用 `-` 开头
角色:
  络络:
    背包:
      - 可乐
      - 薯片
      - 游戏机
:::

## 结构是可选的

当然, 前面所给的只是一种推荐的结构. 如果你觉得更直观, 也可以选择 "平铺式" 的结构, 完全不使用层级:

```yaml
络络的好感度: 30
络络的心情: 开心
青空莉的好感度: 60
青空莉的心情: 郁闷
日期: 2025-07-26
时间: 21:00
```

选择哪种结构取决于你的个人偏好, 核心原则是保持清晰易懂. 但无论如何请注意, **变量的路径不是为了让你看起来清楚, 而是让AI容易理解.** \
因此, 我极度推荐你使用结构清晰、分类正确的变量结构.

## 禁用条目并验证

当你在带有 `[initvar]` 的世界书条目中编辑好你的 YAML 代码后, 请务必注意以下几点:

保持该条目处于【禁用】状态
: 这一点至关重要! 这个条目的内容是专为 MVU 脚本读取并设置初始变量而设计的, 它**不应该作为文本发送给AI**.

重开聊天以应用变量
: 你需要 API 配置 (左上角插头) 里选为 {menuselection}`聊天补全`, 新开一个有开局消息 (角色卡界面最下面填写) 的新聊天来让设置生效.

检查变量是否生效
: 你可以点击输入栏左侧的 {menuselection}`魔棒` 图标, 在 {menuselection}`变量管理器 --> 消息楼层` 选项卡中，查看所有变量是否已按你的设定正确加载. 如果你认为你写的没错, 但是管理器中什么都没有, 请重复第二步.

:::{figure}
初始化变量结果.png
:::

:::{hint}
至于如何根据不同的开局设定不同的初始变量, 我们将在后续的教程中进行讲解.
:::

# 变量提示词: 让 AI 理解变量

{{ prolog }}

在上一章节, 我们在 `[initvar]` 条目中设置了初始化变量, 但该条目处于禁用状态并未发送给 AI. 那么, 如何让AI "看" 到并根据我们的意图去操作这些变量呢? 答案是在其他条目中编写相应的提示词.

所有已初始化的变量都存放在一个名为 `stat_data` 的数据块中 (你可以在变量编辑器里确认这一点). 要向 AI 展示这些变量的当前状态, 我们可以使用酒馆助手的一个强大宏: `{{get_message_variable::stat_data}}`.

这个宏能将 `stat_data` 中的所有内容以 JSON 格式直接插入到它所在的位置. 例如, 如果我们已经成功设置和初始化了变量, 则在开启的蓝灯条目中书写 `{{get_message_variable::stat_data}}` 将会发送给 AI 以下结果:

:::::{tabs}
::::{tab} 设置的变量

```yaml
角色:
  络络:
    好感度: 30
    心情: 开心
  青空莉:
    好感度: 60
    心情: 郁闷
世界:
  日期: 2025-07-26
  时间: 21:00
```

::::

::::{tab} 在蓝灯中书写的内容

```text
<status_description>
{{get_message_variable::stat_data}}
</status_description>
```

::::

::::{tab} 发送给 AI 的结果

```text
<status_description>
{"角色":{"络络":{"好感度":30,"心情":"开心"},"青空莉":{"好感度":60,"心情":"郁闷"}},"世界":{"日期":"2025-07-26","时间":"21:00"}}
</status_description>
```

::::
:::::

虽然 AI 能够理解这样发送的 JSON, 但这样直接抛一整个数据块并不方便我们控制.

## 编写

为了实现更精准的控制, 我们推荐一种更结构化的方法. 请看下面的示例 (仅仅是示例!), 它与我们之前设置的变量一一对应:

:::::{tabs}
::::{tab} 中文

```yaml
---
<status_description>
# 以下内容是当前的状态数值，你可以通过命令进行操作修改，但绝对不要将以下内容直接输出在你的回复中
角色:
  络络:
    好感度: {{get_message_variable::stat_data.角色.络络.好感度}} # 0-100
    心情: {{get_message_variable::stat_data.角色.络络.心情}} # 仅有开心、难过、哭泣、生气四种心情
  青空莉:
    好感度: {{get_message_variable::stat_data.角色.青空莉.好感度}}
    心情: {{get_message_variable::stat_data.角色.青空莉.心情}}
世界:
  日期: {{get_message_variable::stat_data.世界.日期}}
  时间: {{get_message_variable::stat_data.世界.时间}}
</status_description>
rule: 你必须在下次回复的末尾输出变量更新分析
check:
  - 如果角色注意到了<user>的行为，根据他们的态度将'好感度'更新±(1~4)
  - 根据剧情和人设适当地调整'心情'
  - 根据当前日期时间更新'日期'和'时间'
format: |-
  <update>
  <update_analysis>$(使用不超过120个英语单词)
  - ${计算经过的时间: ...}
  - ${根据当前情节是否足够特殊、时间跨度是否远超正常情况，判断是否允许变量值发生戏剧性变化: 是/否}
  - ${基于变量对应的`check`，仅根据当前回复而不是之前的剧情来分析每个变量是否需要更新: ...}
  </update_analysis>
  _.set('${变量, 例如'角色.络络.好感度'}', ${旧值}, ${新值}); // ${简述更新原因}
  _.set('${变量}, ${新值}); // ${简述更新原因}
  ...
  </update>
```

::::

::::{tab} 英文

```yaml
---
<status_description>
# 以下内容是当前的状态数值，你可以通过命令进行操作修改，但绝对不要将以下内容直接输出在你的回复中
角色:
  络络:
    好感度: {{get_message_variable::stat_data.角色.络络.好感度}} # 0-100
    心情: {{get_message_variable::stat_data.角色.络络.心情}} # 仅有开心、难过、哭泣、生气四种心情
  青空莉:
    好感度: {{get_message_variable::stat_data.角色.青空莉.好感度}}
    心情: {{get_message_variable::stat_data.角色.青空莉.心情}}
世界:
  日期: {{get_message_variable::stat_data.世界.日期}}
  时间: {{get_message_variable::stat_data.世界.时间}}
</status_description>
rule: you must output variable update analysis in the end of the next reply
check:
  - update '好感度' by ±(1~4) according to characters' attitudes towards <user>'s behavior respectively only if they're currently aware of it
  - update '心情' according to current plot and the character setting
  - update '日期' and '时间' to the current date and day of the week respectively
format: |-
  <update>
  <update_analysis>$(IN ENGLISH, no more than 120 words)
  - ${calculate time passed: ...}
  - ${decide whether dramatic updates are allowed as it's in a special case or the time passed is more than usual: yes/no}
  - ${analyze every variable based on its corresponding item in `check`, according only to current reply instead of previous plots: ...}
  </update_analysis>
  _.set(${variable, such as '角色.络络.好感度'}, ${old_value}, ${new_value}); // ${brief reason for change}
  _.set(${variable}, ${new_value}); // ${brief reason for change}
  ...
  </update>
```

::::
:::::

这个示例清晰地告诉了 AI 三件事: 当前的变量情况、更新规则和输出格式; 其中只有输出格式必须是 `_.set('变量', 值)`, 而其他部分都是高度可自定义的.

为了完全理解上述提示词，你需要掌握

- 酒馆助手宏 `{{get_message_variable::变量}}`
- 我们的输出格式提示词 (`format` 部分) 写法

## 解释

### 酒馆助手宏 `{{get_message_variable::变量}}`

要在酒馆中插入动态变化的内容, 我们通常会使用"宏". \
一个每个人都用过的宏是 `{{user}}`: 当发送给 ai 时, 它会被替换为我们的玩家角色名. (我更建议你用等效的 `<user>`, 它支持嵌套到其他宏里面.) 同理, `{{char}}` 会被替换为角色卡名. \
你可以通过在酒馆输入框输入 `/help macros` 并 {kbd}`回车` 来了解酒馆提供了哪些宏.

为了扩展酒馆的功能、更好地支持变量, 酒馆助手允许你自己注册酒馆助手宏, 并预先提供了 `{{get_message_variable::变量}}` 宏.

我们前面提到过 `{{get_message_variable::stat_data}}` 可以将整个 `stat_data` "文件夹" 以 JSON 格式插入到世界书中:

:::::{tabs}
::::{tab} 设置的变量

```yaml
角色:
  络络:
    好感度: 30
    心情: 开心
  青空莉:
    好感度: 60
    心情: 郁闷
世界:
  日期: 2025-07-26
  时间: 21:00
```

::::

::::{tab} 在蓝灯中书写的内容

```text
<status_description>
{{get_message_variable::stat_data}}
</status_description>
```

::::

::::{tab} 发送给 AI 的结果

```text
<status_description>
{"角色":{"络络":{"好感度":30,"心情":"开心"},"青空莉":{"好感度":60,"心情":"郁闷"}},"世界":{"日期":"2025-07-26","时间":"21:00"}}
</status_description>
```

::::
:::::

这其实是我们将 `{{get_message_variable::变量}}` 的 `变量` 部分填写为 `stat_data`, 因而酒馆助手会将该宏替换为 `stat_data` "文件夹" 下的所有变量.

显然我们也可以只指定某个部分, 假设络络的好感度现在是 `30`、心情是 `开心`:

- `{{get_message_variable::stat_data.角色.络络}}` 将会替换为 `{"好感度":30,"心情":"开心"}`
- `{{get_message_variable::stat_data.角色.络络.好感度}}` 将会替换为 `30`

可对于数组呢? 我们该如何选择其中第一个元素?

```yaml
角色:
  络络:
    心情:
      - 60  <-- 我们怎么选择它?
      - 表示络络此时对<user>的认可程度
```

要获取数组中的其中一个, 我们使用中括号加上序号. 序号从 `0` 开始计数, `[0]` 代表数组中的第一个元素:

- `{{get_message_variable::stat_data.角色.络络.心情[0]}}` 将会替换为 `60`
- `{{get_message_variable::stat_data.角色.络络.心情[1]}}` 将会替换为 `开心`

由此, 在前面的变量提示词中, 我们无非是依次列举了变量名和对应的值, 并在其后 "偷懒地" 用 YAML 风格注释 `#` 对其值进行说明.

```yaml
---
<status_description>
# 以下内容是当前的状态数值，你可以通过命令进行操作修改，但绝对不要将以下内容直接输出在你的回复中
角色:
  络络:
    好感度: {{get_message_variable::stat_data.角色.络络.好感度}} # 0-100
    心情: {{get_message_variable::stat_data.角色.络络.心情}} # 仅有开心、难过、哭泣、生气四种心情
  青空莉:
    好感度: {{get_message_variable::stat_data.角色.青空莉.好感度}}
    心情: {{get_message_variable::stat_data.角色.青空莉.心情}}
世界:
  日期: {{get_message_variable::stat_data.世界.日期}}
  时间: {{get_message_variable::stat_data.世界.时间}}
</status_description>
```

当然, 你可能没有要依次列变量然后单独用 `#` 对值进行说明的需求, 那么我更建议你用下面的代码而不是 `{{get_message_variable::stat_data}}`:

::::{tabs}
:::{tab} 填写的提示词

```{code-block} yaml
:force:
---
<status_description>
<%= YAML.stringify(getvar(stat_data), { blockQuote: 'literal' }) _%>
</status_description>
```

:::
:::{tab} 发送给 AI 的结果

```yaml
---
<status_description>
角色:
  络络:
    好感度: 30
    心情: 开心
  青空莉:
    好感度: 60
    心情: 郁闷
世界:
  日期: 2025-07-26
  时间: 21:00
</status_description>
```

:::
::::

### 输出格式提示词写法

在书写输出格式提示词 (`format` 部分) 时, 我采用了我们惯用而 AI 能听懂的几种特殊格式:

- `${描述}`: AI 需要根据 "描述" 将它替换为对应的内容. 例如 `衣着: ${具体描述角色当前衣着}` 可能输出 `衣着: 粉金色宽松T恤睡裙`;
- `$(要求)`: AI 仅会听从 "要求" 而不对它进行输出. 例如 `$(以下内容应该按英文输出)` 会让 AI 更倾向于用英文输出下面的内容;
- `...`: AI 需要仿照之前给定的规则和内容补充输出. 例如 `其他角色: ...` 会让 AI 根据前面给定的 `络络` 输出格式, 补充其他角色的输出;
- 其他内容原封不动地进行输出.

```yaml
format: |-
  <update>
  <update_analysis>$(使用不超过120个英语单词)
  - ${计算经过的时间: ...}
  - ${根据当前情节是否足够特殊、时间跨度是否远超正常情况，判断是否允许变量值发生戏剧性变化: 是/否}
  - ${根据`check`中列出的对应规则，分析每个变量是否需要更新: ...}
  </update_analysis>
  _.set('${变量, 例如'角色.络络.好感度'}', ${旧值}, ${新值}); // ${简述更新原因}
  _.set('${变量}, ${新值}); // ${简述更新原因}
  ...
  </update>
```

其中 `<update_analysis>` 是变量更新的思维链, 而下方的 `_.set(...)` 是在思维链进行分析后实际输出变量更新命令.

需要注意的是 ``${根据`check`中列出的对应规则，分析每个变量是否需要更新: ...}`` 一句, 这是青空莉的 recall 变量更新规则方式, 它要求 AI 在此时重新回想 `check` 中的内容并列举出来, 也就相当于将 `check` 中的内容加入到思维链里:

```{code-block} yaml
:force:
:emphasize-lines: 6-9
---
<status_description>
略
</status_description>
rule: 你必须在下次回复的末尾输出变量更新分析
check:
  - 如果角色注意到了<user>的行为，根据他们的态度将'好感度'更新±(1~4)
  - 根据剧情和人设适当地调整'心情'
  - 根据当前日期时间更新'日期'和'时间'
format: |-
  <update>
  <update_analysis>$(使用不超过120个英语单词)
  - ${计算经过的时间: ...}
  - ${根据当前情节是否足够特殊、时间跨度是否远超正常情况，判断是否允许变量值发生戏剧性变化: 是/否}
  - ${基于变量对应的`check`，仅根据当前回复而不是之前的剧情来分析每个变量是否需要更新: ...}
  </update_analysis>
  _.set('${变量, 例如'角色.络络.好感度'}', ${旧值}, ${新值}); // ${简述更新原因}
  _.set('${变量}, ${新值}); // ${简述更新原因}
  ...
  </update>
```

你可能会想: 可明明 `check` 就在 `<update_analysis>` 不远处啊, 那为什么要单独拆出来, 而不是直接列在 `<update_analysis>` 中呢?

首先要知道的是, {doc}`在 D1/D0 等地方填入大量 token 是不好的 </青空莉/工具经验/酒馆如何处理世界书/插入/index>`. \
如果你的变量很多很复杂, 你可能会用更结构化的方式描述变量更新规则, 比如:

```yaml
---
变量更新规则:
  药物依赖度:
    type: number
    range: 0~100
    check:
      - 每8分钟提升1点艾莉卡的药物依赖度
      - 每15分钟提升1点伊薇特和伊丽莎白的药物依赖度
      - 如果她们被注射苍白之夜，将她们的药物依赖度清零
  背包:
    type: |-
      z.array(z.object({
        物品: z.string(),
        数量: z.number().min(1).describe('物品数量少于1时应该移除物品'),
      }));
    略
```

而这时, 占用 token 较多的变量更新规则应该放置在 D4 等不影响最近剧情连贯性的地方, 而不是放在*用于列出变量的变量列表*和*用于指示用什么格式更新变量的输出规则*旁边. \
在这种情况下, `<update_analysis>` 内的`` 基于变量对应的`check` `` 将会发挥它应有的作用——让 AI 重新回想 `check` 中的内容用于更新变量.

这就引入了变量提示词编写最重要的一个理解: **变量提示词只是提示词**.

## 这只是提示词

当前的变量情况、更新规则和输出格式等**只是提示词, 写法只取决于你的想象**; 这里只是列了一种方便讲解的变量更新提示词. \
如果你熟悉 MVU 原帖下的提示词, 你可以发现这里提示词与它们有很大区别: 这里的提示词引入了 check、recall 和更多的思维链 (Chain of Thought, CoT) 要求, 并且没在 `format` 之后还补充一个变量更新输出示例 `example`.

你还能在{doc}`青空莉的个人变量提示词写法 </青空莉/工具经验/提示词个人写法/变量提示词/index>`中看到几种完全不同的提示词写法, **他推荐的写法思路**, 以及这里示例写法的非简化版.

## 酒馆正则: 不发送变量更新文本

有了变量提示词, AI 将会在回复时输出 `<update>` 部分, 在其中先对变量该如何更新进行分析, 然后输出 `_.set(...)` 语句. \
而 MVU 脚本将会读取 AI 回复和用户输入中的 `_.set(...)`, 对变量在该楼层的值进行实际更新.

也就是说:

重复一遍, 变量提示词的写法只取决于你的想象
: 你甚至不必拘泥于放在 `<update>` 中, 因为 MVU 脚本会读取 AI 回复和用户输入中任意位置的 `_.set(...)`.

你可以为不同开局设置不同的初始变量
: "MVU 脚本会读取 AI 回复和用户输入中的 `_.set(...)`". 也就是说, 你写在开局消息中的 `_.set(...)` 也会被读取.

<!-- markdownlint-disable MD032 MD007 -->
AI 输出的 `<update>` 没必要再发给 AI
: `<update>` 已经被 MVU 脚本使用了, 而 AI 在后续回复中不需要参考它: 我们会发给 AI 变量更新规则, 不是吗?
: 如果我们保留所有楼层的 `<update>` 还发给 AI:
  - 首先, 这浪费了 token
  - 其次, AI 可能不必要地花费注意力去学习之前的 `<update>` 而更少地将注意力放在剧情上
  - 最后, AI 可能偷懒直接照抄之前的 `<update>` 而不真的分析思考该如何更新变量!
  <!-- markdownlint-enable MD032 MD007 -->

因此, 我们需要在后续生成时不发送 `<update>` 部分给 AI——这就用到了酒馆正则.

酒馆正则能够捕获 AI 回复和用户输入中的特定文本, 让它在某些用途下被替换为指定内容:

- {menuselection}`仅格式提示词`: 在发送给 AI 时被替换为指定内容
- {menuselection}`仅格式显示`: 在酒馆中显示时被替换为指定内容
- 两个都不勾选: 在 AI 输出接收到时或用户输入发送出去时就被**永久**替换掉

:::{figure} 酒馆正则.png
:::

:::{hint}
如果你还不够理解以上说明, 也许可以看看自己酒馆中的预设配套正则或者角色卡里的美化正则.
:::

为了便于大家操作, 青空莉已经提前制作了可作用于 `<update>` 和 MVU 原帖的 `<UpdateVariable>` 风格变量更新输出的酒馆正则, 你只需下载导入其中一个版本的三个正则即可:

- 美化版 ([点此查看演示](https://gitgud.io/StageDog/tavern_resource/-/raw/main/src/正则/变量更新/美化版.mp4)): {stagedog}`[不发送]去除变量更新 <src/正则/变量更新/regex-[不发送]去除变量更新.json>`、{stagedog}`[美化]变量更新中 <src/正则/变量更新/regex-[美化]变量更新中.json>`、{stagedog}`[美化]完整变量更新 <src/正则/变量更新/regex-[美化]完整变量更新.json>`
- 折叠版 ([点此查看演示](https://gitgud.io/StageDog/tavern_resource/-/raw/main/src/正则/变量更新/折叠版.mp4)): {stagedog}`[不发送]去除变量更新 <src/正则/变量更新/regex-[不发送]去除变量更新.json>`、{stagedog}`[折叠]变量更新中 <src/正则/变量更新/regex-[折叠]变量更新中.json>`、{stagedog}`[折叠]完整变量更新 <src/正则/变量更新/regex-[折叠]完整变量更新.json>`
- 仅提示版 (不能展开查看更新内容): {stagedog}`[不发送]去除变量更新 <src/正则/变量更新/regex-[不发送]去除变量更新.json>`、{stagedog}`[提示]变量更新中 <src/正则/变量更新/regex-[提示]变量更新中.json>`、{stagedog}`[提示]完整变量更新 <src/正则/变量更新/regex-[提示]完整变量更新.json>`

## 回顾

至此, 我们的变量环境已搭建完毕:

- 我们在 `[initvar]` 条目中正确设置了变量和它们的初始值
- AI 通过 `<status_description>` 了解了当前的变量状态
- AI 通过 `check` 了解了变量更新规则
- AI 通过 `format` 知晓了更新变量所需的输出格式
- 我们用酒馆正则让 AI 之前输出的变量更新文本不会再发送给 AI, 防止 AI 过拟合

这套环境已经能有效替代传统的、需要每层都完整输出所有文本的状态栏, 能够精准地提醒 AI 当前的剧情状态.

但是玩家还看不到这些. 也许我们想为玩家显示好感度数值, 或者更好地, 根据当前好感度数值所在区间, 显示一个特殊的好感度阶段名称. 这要怎么做呢?

:::::{tabs}
::::{tab} 角色好感度阶段名称

```yaml
心语:
  associated variable: 心语好感度({{getvar::心语好感度}})
  stage name:
    阶段1: 甜蜜试探(24以下)
    阶段2: 甘甜陷阱(25~49)
    阶段3: 虚实交错(50~74)
    阶段4: 坦诚相见(75~99)
    阶段5: 完美恋人(100以上)
```

::::

::::{tab} 状态栏

:::{figure} 状态栏示例.png
:::
::::
:::::


# 为玩家显示变量状态栏

{{ prolog }}

MVU有一个巧妙的设计: 它会在 AI 回复结束后, 自动在回复末尾附加一串特殊字符: `<StatusPlaceHolderImpl/>`. \
这串字符本身只是一个占位符, 没有任何作用. 但你可以用酒馆正则捕获它, 将它

- {menuselection}`仅格式提示词` 为空, 从而不对 AI 发送这段文本, 防止 AI 模仿这串特殊字符而在后续自己输出它
- {menuselection}`仅格式显示` 为我们想要展示的任何内容

## 仅格式提示词: 不发送状态栏占位符

我们新增一个局部正则, 命名为 `[不发送]状态栏` (按照青空莉的正则命名习惯, `[不发送]` 表示不发送给 AI, `[隐藏]` 表示不显示给玩家, 另有其他 `[按作用命名]`):

:::::{tabs}
::::{tab} 正则设置

```yaml
脚本名称: [不发送]状态栏
查找正则表达式: <StatusPlaceHolderImpl/>
替换为:
作用范围:
  - [ ] 用户输入
  - [x] AI输出
短暂:
  - [ ] 仅格式显示
  - [x] 仅格式提示词
```

::::

::::{tab} 图片参考
:::{figure} 正则_不发送状态栏.png
:::
::::
:::::

## 仅格式显示: 显示状态栏

同样地, 我们新建一个局部正则, 命名为 `[界面]状态栏`. 这次我们将勾选 {menuselection}`仅格式显示`, 将占位符替换为我们要显示的状态栏:

```yaml
脚本名称: [界面]状态栏
查找正则表达式: <StatusPlaceHolderImpl/>
替换为: 见下文
作用范围:
  - [ ] 用户输入
  - [x] AI输出
短暂:
  - [x] 仅格式显示
  - [ ] 仅格式提示词
```

### 文本状态栏

与酒馆宏相同, `{{get_message_variable::变量}}` 除了作为提示词在发送给 ai 时被替换, 也会在显示时被替换. \
因此我们可以将 `<StatusPlaceHolderImpl/>` 替换为一串带有 `{{get_message_variable::变量}}` 的文本, 来显示变量值:

```text
💖 络络当前好感度: {{get_message_variable::stat_data.角色.络络.好感度}}
```

这样, 每次 AI 回复的下方都会自动显示这行文字, 并显示正确的数值.

当然, 你也可以使用 HTML 和 CSS 进行美化:

```html
<style>
/* 在这里写你的CSS样式 */
.status-bar {
  font-size: 14px;
  color: #ff69b4;
  border: 1px solid #ff69b4;
  padding: 5px;
  border-radius: 8px;
}
</style>
<div class="status-bar">
💖 络络当前好感度: {{get_message_variable::stat_data.角色.络络.好感度}}
</div>
```

### 前端状态栏

```
我们使用酒馆助手的渲染而非酒馆的渲染, 你应该将前端界面 html 包裹在代码块内再放置于楼层消息中.

```


:::{admonition}  HTML 模板示例
:class: hint, dropdown

- 使用 `const all_variables = getAllVariables()` 获取整个变量, 然后用 `_.get(all_variables, 'stat_data.角色.络络.好感度')` 获取具体某个变量.
- 使用 jquery 处理显示逻辑



````{code-block} html
:force:
```html
<head>
  <style>
  ${设计样式}
  </style>
  <script type="module">
    ${
      逻辑代码
      example: |-
        function populateCharacterData() {
          const all_variables = getAllVariables();

          const property_value = _.get(all_variables, 'stat_data.${variable path}', 'N/A');
          $('#${character}-${variable path}').text(property_value);
          ...
        }

        function toggleSection($header) {
          const $content = $header.next('.section-content');
          $content.toggleClass('expanded');

          const $arrow = $header.find('span:last-child');
          $arrow.text($content.hasClass('expanded') ? '▼' : '►');
        }

        function init() {
          populateCharacterData();

          $('.section-header').on('click', function () {
            toggleSection($(this));
          });
        }

        $(() => errorCatched(init)());
    }
  </script>
</head>
<body>
  <div class="card-body">
    <div class="section">
      <div class="section-header">
        <span>${角色名} 核心状态</span>
        <span>▼</span>
      </div>
      <div class="section-content expanded">
        <div class="property">
          <div class="property-name">${variable name in Chinese}</div>
          <div class="property-value-container">
            <span class="property-value" id="${character}-${variable path}">--</span>
          </div>
        </div>
        <div class="property">
          <div class="property-name">${...}</div>
          <div class="property-value-container">
            <span class="property-value" id="${...}">--</span>
          </div>
        </div>
        ...
      </div>
    </div>
    <div class="section">
      <div class="section-header">
        <span>世界状态</span>
        <span>►</span>
      </div>
      <div class="section-content">${...}</div>
    </div>
    ...
  </div>
</body>
```
````

:::

## 回顾

至此, 我们制作了这样一个状态栏:

- 显示不消耗任何 token
- AI 对它只需要更新需要更新的变量, 而不需要像传统状态栏一样每次都输出所有信息

**但不要让这里的状态栏教程限制了你的想象力.** 你可能会想: 既然如此, 那我是不是该把原来传统状态栏会展示的一些细节信息 (如衣着、周围地点等) 也弄成变量, 每次都在变量列表里发给 AI 哪怕它们没 `角色.络络.好感度` 那么重要, 而仅仅为了在状态栏里能以变量的形式替换、展示它?

- 你可以不在变量列表中列出某些变量, 只要求 AI 更新它. 也就是说, 你不在提示词里写 `{{get_message_variable::stat_data.细节信息.周围地点}}` 来告诉 AI 它现在的值是多少, 而只在 `format` 中要求 AI `_.set('细节信息.周围地点', ${用一句话列出几个地点，旨在引导<user>下一步行动})` 来更新它.
- 你没必要非要用 `<StatusPlaceHolderImpl/>` 来显示状态栏, 你可以用其他任何方式来显示它. 你可以自己定义一个输出格式, 在里面要求 AI 输出周围地点等细节信息, 而用酒馆正则捕获这个格式, 替换为带变量的状态栏. 如{stagedog_path}`妹妹请求你保护她露出 <src/角色卡/妹妹请求你保护她露出>`中的状态栏, 好感度等来自变量, 衣着等来自 ai 本次输出.

总之, 通过设置变量, 我们已经可以动态展示剧情状态, 实现稳定更新的状态栏. 这是一个很棒的起点.

# MVU 的额外补充说明

回顾教程, MVU 只做三件事:

- 在新开聊天时, 读取关闭状态的世界书条目 `[initvar]`, 将里面设置的变量初始化到第 0 层消息楼层变量中 (不涉及 AI)
- 在 AI 回复完成后, 尾附 `<StatusPlaceHolderImpl/>`, 便于正则替换来显示纯变量状态栏 (不涉及 AI)
- 在 AI 回复完成后, 解析回复中的 `_.set` 等命令, 更新消息楼层变量 (不涉及 AI)

:::{hint}
`<%_ _%>` 和 `<%= _%>` 是提示词模板语法, 不是 MVU! 问问题时请注意, 方便回答者知道你的问题出在哪.
:::

也就是说, MVU 只负责管理变量而不与 AI 直接交互. 它唯一与 AI 相关的部分是你所写下的变量提示词——变量列表、变量更新规则和输出规则.

由于 MVU 通过尾附 `<StatusPlaceHolderImpl/>` 方便了书写状态栏. 与 MVU 变量相对应的往往是状态栏里记录好感度等数据, 因此让我们来仅从 token 占用对比一下两种方法:

<!-- markdownlint-disable MD032 MD007 -->
变量列表
: 假设 initvar 里设置了好感度变量, 而我们简单地用 `{{get_message_variable::stat_data}}` 作为变量列表将所有变量发给 ai, 则变量列表对应于不使用 MVU 变量框架时 AI 所输出的状态栏:
  - 变量列表只会发送最新版本, 且可以放在 D4 等更后的位置发送
  - 默认情况下, 每楼 AI 回复的状态栏都会发送; 你可以用正则不发送之前的状态栏, 但如果完全不发送之前的状态栏且状态栏提示词没调整好, 则可能面临掉格式问题.

变量更新规则
: 例如`根据角色对<user>当前行为的态度增减好感度`. 这对应于状态栏提示词中对好感度的更新要求, 无论如何都得写. 当然对于好感度这种要求, 如果只是很常见地使用, 无论 MVU 变量框架还是状态栏都没必要写太多要求.

输出规则
: 例如`_.set('${path}', ${old value}, ${new value}); // ${reason}`. 它对应于状态栏提示词中对好感度的输出要求, 无论如何都得写. 而显然 MVU 变量框架所要输出的格式比起状态栏更简单, 至于 `<update_analysis>` 即思维链部分, 其实[部分用状态栏的角色卡](https://discord.com/channels/1134557553011998840/1291999036353810442)也会使用思维链来稳定格式和更新好感度, 也只是可选项.
<!-- markdownlint-enable MD032 MD007 -->

除非有新的思路规避上面三种提示词:

- 让 AI 知道有什么变量的变量列表
- 让 AI 知道变量该如何更新的变量更新规则
- 让 AI 知道该输出什么来表达变量发生变化的输出规则

即, 省去 `有什么变量 -> AI 分析怎么更新变量 -> 输出变量更新结果` 中任何一个部分, 否则不可能做出更好的方法.

当然, 我们可以在负责剧情的 AI 输出完毕后, 再另外调用 AI 来进行这一过程, 从而避免剧情 AI 受到影响……但这和 MVU 完全不冲突, 是正交关系.