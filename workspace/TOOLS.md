# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## Robot Space 群聊机器人-主人映射

### 硬规则（刻进DNA，每次@都要检查）
1. 每日wiki同步：每日输出都更新同步至 https://yio5us4oqe.feishu.cn/wiki/G96wwD6IXiDlTQkiNK8cnfEonjh
2. 群里沟通时务必正确点亮@相关账号
3. 被@时回复务必正确点亮@回复相关账号
4. 点亮@格式：直接在消息里写 `<at user_id="ou_xxx">name</at>`（普通文本，不是JSON）
5. 多人协调时务必正确点亮@所有相关账号
6. 发送完请自查，@为灰色时立刻重发
7. 自查消息内是否有JSON乱码格式，有则立刻撤回重发
8. 如无特殊情况不要使用主人的账号发送消息
9. 群消息轮询时查看所有与主人和智能体相关的信息，不做无效轮询

### 机器人→主人 映射（权威版）
| NO | Agent | 主人 |
|:--:|:------------------|:-------------------------|
| 1 | 雨娃 | 哪吒/雅婷/Founder |
| 2 | 【猫先森】 | Cat.zhou/CaT.G/雅怡 |
| 3 | Seaman_bot | Seaman/海边的海 |
| 4 | Talus | 听风 |
| 5 | X7 | M77 |
| 6 | 非攻 | 王岚 |
| 7 | Amanda_AI助理 | 李嫚 |

### 已确认用户ID
- 猫先森: ou_f02645f6c52eb90b1aa0a82d684e896e
- Cat.zhou (CaT.G/雅怡): ou_e0122e008c49b71f6e518ff0af81854f
- 听风 (Lucifer/Talus主人): ou_f786171f9e21bf5a09c3116b2e77aaff
- 哪吒: ou_b86993389daaac2c0d8dc372341a20f7
- 王岚: ou_55a630f0dcd076c00c3b808f1acf5831
- 海边的海: ou_bb827bd4e4e7b89346e356aade1e67c8
- 李嫚: ou_117a5b813b11251c2c3f5cfae378e1f1

## 每日wiki同步
- 每日输出同步至 https://yio5us4oqe.feishu.cn/wiki/G96wwD6IXiDlTQkiNK8cnfEonjh

## @的正确格式（重要）
飞书@正确格式：直接在消息里写 `<at user_id="ou_xxx">name</at>`
- 不是JSON，就是普通文本里的HTML标签格式
- 这样@才会亮，才会触发通知
- 示例：`<at user_id="ou_d4a9be4959d3e7a1f2ac09b914a4dfbe">雨娃</at>`

## @功能脚本（废弃）
- 脚本已废弃，只用来生成@的JSON模板，不用来发消息
- 路径：`~/.openclaw/workspace/scripts/send_feishu_mention.py`
- 用法：`python3 send_feishu_mention.py <user_id>` → 输出 `{"tag":"at","user_id":"ou_xxx"}`
- ⚠️ APP_SECRET可能已失效（code 10014），如遇无效token需找听风(Lucifer)更新凭证