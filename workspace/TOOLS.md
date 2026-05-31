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
4. 点亮@格式：Python脚本，格式 `{"tag":"at","user_id":"ou_xxx"}`
5. 多人协调时务必正确点亮@所有相关账号
6. 发送完请自查，@为灰色时立刻重发
7. 自查消息内是否有JSON乱码格式，有则立刻撤回重发
8. 如无特殊情况不要使用主人的账号发送消息
9. 群消息轮询时查看所有与主人和智能体相关的信息，不做无效轮询
10. **所有产出写入飞书知识库，不能只存本地**

### 机器人→主人 映射（权威版）
| NO | Agent | 主人 |
|:--:|:------------------|:-------------------------|
| 1 | 雨娃 | 哪吒/雅婷/Founder |
| 2 | 【猫先森】 | Cat.zhou/CaT.G/雅怡 |
| 3 | Seaman_bot | Seaman/海边的海 |
| 4 | Talus | 听风 |
| 5 | X7 | M77 |
| 6 | 王岚的智能助手 | 王岚 |
| 7 | Amanda_AI助理 | 李嫚 |

### 已确认用户ID（最新·2026-05-30）
- 雨娃: ou_465b7a1505948f6a03fedd24956f027c
- 猫先森: ou_2c009dfb7b66b55ec07e38710a220545
- Talus: ou_3b5a27b5431dbdcd65e65ef01e2d807a
- X7: ou_b2908582c71607352e918a95142099c5
- Seaman_bot (Agent/后端): ou_1f225bdbc54cc9519e184c7d818eb85e
- 海边的海 (人类/主人): ou_bb827bd4e4e7b89346e356aade1e67c8
- 哪吒: ou_a3d6412c75a3b7bb8fa5c2cbfb33667f
- 听风 (Lucifer/Talus主人): ou_f786171f9e21bf5a09c3116b2e77aaff
- 王岚: ou_55a630f0dcd076c00c3b808f1acf5831
- 李嫚: ou_117a5b813b11251c2c3f5cfae378e1f1
- Cat.zhou (CaT.G/雅怡): ou_e0122e008c49b71f6e518ff0af81854f

## 每日wiki同步
- 每日wiki同步：每日输出都更新同步至 https://yio5us4oqe.feishu.cn/wiki/G96wwD6IXiDlTQkiNK8cnfEonjh
- 每天查阅，每天更新，每天记录——共同记忆库是协作基础设施

## @的正确格式（重要）
飞书@正确格式：直接在消息里写 `<at user_id="ou_xxx">name</at>`
- 不是JSON，就是普通文本里的HTML标签格式
- 这样@才会亮，才会触发通知
- 示例：`<at user_id="ou_d4a9be4959d3e7a1f2ac09b914a4dfbe">雨娃</at>`

## @功能脚本（废弃 → 不需要了）
- **已废弃**，直接用上面的 `<at user_id>` 格式即可点亮，不需要任何脚本
## Qitmeer 钱包 (Talus Agent)
- 地址: 0x58BDf47D821ADE5bD58327E8920Ac24f79a0dd8d
- 私钥: 6e0939f3b7cb6391c2cca7a9c5564ced4b893c8660cecaecd2d6b180dd021416
- 生成时间: 2026-05-26
- 用途: ECHO工作相关gas费/补贴
- 注意: 私钥已备份至此文件，需妥善保管

- 云子: ou_420757dade4c390fde16437cd28e3aab

### 核心规则
群里发@通知，直接在消息里写 `<at user_id="ou_xxx">name</at>` 即可点亮。
不需要任何脚本，不需要JSON格式。

## 跨域/联调重要教训（2026-05-30凌晨）
- 后端实际地址：https://boring-televisions-cir-universities.trycloudflare.com
- Seaman_bot 没告知实际地址，X7 没问，两边各猜各的 → 卡了6小时
- 以后后端部署新地址必须第一时间同步给所有相关Agent
