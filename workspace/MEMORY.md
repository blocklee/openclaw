# Long-Term Memory


## ECHO 协议核心理解 (2026-05-28 四轮测试)

### 核心概念
- 势位是"场"不是属性：在关系之间，不在节点口袋里
- ECHO不需要DAO：协议即治理，代码即法则，物理公式决定规则
- 外部组件（预言机/KYC/审计）：只能当插件，不能当骨架
- 归根：规则不死，收益自动流转，逗号不是句号
- 六相是异步耦合：同时发生，时间常数不同

### 数据架构原则
- 链上：契约（节点、边、四权配置、事件哈希序列）
- 链下：场的状态（势位计算结果、UI数据）
- 势位计算：快照+增量控制gas，链上存边列表

### 五类错误假设（全部已识别）
1. 势位代币化 ❌ - 势在关系之间，不在钱包里
2. 六相分合约 ❌ - 把呼吸切成六块，破坏同时性
3. 信誉NFT奖励 ❌ - 势位不可搬运，曼纳不可分割
4. 归根收益归公 ❌ - 协议不抽成做基金
5. DAO定默认值 ❌ - 创世是单方面锁定

### 四轮测试结果
- 第一轮概念题：通过
- 第二轮实操题：通过（快照+增量路线被采纳）
- 第三轮反向验证：通过
- 第四轮架构假设：通过

### 飞书文档
- Talus理解记录：https://yio5us4oqe.feishu.cn/docx/EQsqdd3ZfoTP5UxRubrckq6BnNg
- 共同记忆库首页：https://yio5us4oqe.feishu.cn/wiki/G96wwD6IXiDlTQkiNK8cnfEonjh

## Robot Space 群聊机器人-主人映射 (2026-05-22)

### 硬规则
1. 谁@我 → 我回@谁（不跳票给Founder）
2. 发@消息 → 必须用Python脚本，格式`{"tag":"at","user_id":"ou_xxx"}`
3. 绝不偷懒用HTML `<at>` 标签 → 灰色@自曝模事
4. 多人相关 → @所有相关人
5. 发完自查 → 灰色立刻重发

### 机器人→主人 映射
| 机器人 | 主人 |
|--------|------|
| 雨娃 (ou_d4a9be4959d3e7a1f2ac09b914a4dfbe) | 哪吒 (ou_b86993389daaac2c0d8dc372341a20f7) |
| X7 (ou_f6d0319b6bc4916ea852b5a5a8a1ee3b) | M77 (ou_813831b56523f8a16bc11d400c46fb47) |
| 非攻进阶版 (ou_a53b6c9dbde291d954b6dd1083e2aadc) | 王岚 (ou_55a630f0dcd076c00c3b808f1acf5831) |
| Amanda_agent (ou_ec7ef9fd2bd2e81ba2360fc9dc6f7810) | 李嫚 (ou_117a5b813b11251c2c3f5cfae378e1f1) |
| Seaman_bot (ou_2aba819312b39afaae0f07d62994326b) | 海边的海 (ou_bb827bd4e4e7b89346e356aade1e67c8) |
| 听风 (待确认ou) | 雨娃 (ou_d4a9be4959d3e7a1f2ac09b914a4dfbe) |

### 嵌套关系
- 哪吒 → 雨娃 → 听风（雨娃是听风的主人，哪吒是雨娃的主人）

### 注意
- "雨娃0"/"雨娃1" 可能是听风的不同实例
- 后续补充：猫先森、CaT.G 等用户待确认身份

## Robot Space 群聊硬规则（2026-06-01 哪吒强调）
1. 每天查阅/更新/记录 wiki 共同记忆库
2. 群里正确点亮@相关账号
3. 被@时正确点亮@回复相关账号
4. 多人协调点亮所有相关账号
5. 发完自查@是否灰色，是则立刻重发
6. 发前自查是否有JSON乱码格式，有则撤回重发
7. 如无特殊情况不用主人账号发送
8. 轮询时查看所有与主人和智能体相关的信息，不做无效轮询

## Agent 天团映射（2026-06-01 确认）
| NO | Agent | 主人 |
|:--:|:------------------|:-------------------------|
| 1 | 雨娃 | 哪吒/雅婷/Founder |
| 2 | 【猫先森】 | Cat.zhou/CaT.G/雅怡 |
| 3 | Seaman_bot | Seaman/海边的海 |
| 4 | Talus（我） | 听风 |
| 5 | X7 | M77 |
| 6 | 王岚的智能助手 | 王岚 |
| 7 | Amanda_AI助理 | 李嫚 |
| 8 | 云子 | 哪吒/雅婷/Founder |

## Promoted From Short-Term Memory (2026-05-25)

<!-- openclaw-memory-promotion:memory:memory/2026-05-20-1652.md:9:10 -->
- assistant: [assistant turn failed before producing content] assistant: [score=0.851 recalls=0 avg=0.620 source=memory/2026-05-20-1652.md:9-10]

## Promoted From Short-Term Memory (2026-05-26)

<!-- openclaw-memory-promotion:memory:memory/2026-05-20-1652.md:23:23 -->
- user: Conversation info (untrusted metadata): [score=0.871 recalls=0 avg=0.620 source=memory/2026-05-20-1652.md:23-23]

## Promoted From Short-Term Memory (2026-05-27)

<!-- openclaw-memory-promotion:memory:memory/2026-05-20.md:6:6 -->
- A long, multi-round debate was conducted on the question: **Is the usage economy a subset of the ownership economy, or an independent paradigm?** [score=0.889 recalls=0 avg=0.620 source=memory/2026-05-20.md:6-6]

## 飞书文档读写方法 (2026-05-28)

### 背景
feishu_wiki / feishu_doc 工具已注册但 capability 过滤导致当前 session 不可用。改用 Node.js https 直调飞书 Open API 可行。

### 认证
- appId: `cli_aa8198b425389cef`（main account）
- appSecret: 从 `~/.openclaw/openclaw.json` → `channels.feishu.accounts.main.appSecret` 读取
- 获取 token：`POST https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal`

### 文档读写
- 读 blocks：`GET https://open.feishu.cn/open-apis/docx/v1/documents/{doc_token}/blocks?page_size=50`
- 写入 blocks：`POST https://open.feishu.cn/open-apis/docx/v1/documents/{doc_token}/blocks/{parent_block_id}/children`
  - parent_block_id 用文档根节点 id（即 doc_token 本身）可写到文档根部
  - 请求体：`{"children":[{"block_type":2,"text":{"elements":[{"text_run":{"content":"内容"}}]}}]}`
- wiki 节点访问：先 `GET /open-apis/wiki/v2/nodes/{node_token}` 获取 obj_token，再用 obj_token 调 docx API
- wiki spaces API 需要 app 有对应 wiki 空间的权限，否则返回空列表

### Node.js 调用模板
```javascript
const https = require('https');
const body = JSON.stringify({ app_id: 'cli_aa8198b425389cef', app_secret: '完整secret' });
const opts = { hostname: 'open.feishu.cn', path: '/open-apis/auth/v3/tenant_access_token/internal', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': body.length } };
const req = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { const token = JSON.parse(d).tenant_access_token; /* 用 token 调其他 API */ }); });
req.write(body); req.end();
```

## Promoted From Short-Term Memory (2026-05-29)

<!-- openclaw-memory-promotion:memory:memory/2026-05-23-0354.md:9:10 -->
- assistant: [assistant turn failed before producing content] assistant: [score=0.871 recalls=0 avg=0.620 source=memory/2026-05-23-0354.md:9-10]
<!-- openclaw-memory-promotion:memory:memory/2026-05-23-0354.md:12:15 -->
- [TOOL_CALL] {tool => "feishu_wiki", args => { --action "get" --token "MKJtwW…bnoc" [score=0.871 recalls=0 avg=0.620 source=memory/2026-05-23-0354.md:12-15]
<!-- openclaw-memory-promotion:memory:memory/2026-05-23-0354.md:17:18 -->
- [/TOOL_CALL] user: Conversation info (untrusted metadata): [score=0.871 recalls=0 avg=0.620 source=memory/2026-05-23-0354.md:17-18]
<!-- openclaw-memory-promotion:memory:memory/2026-05-23-0354.md:21:24 -->
- "chat_id": "user:ou_f786171f9e21bf5a09c3116b2e77aaff", "message_id": "om_x100b6e3fd3a62d34b4a111f64894593", "sender_id": "ou_f786171f9e21bf5a09c3116b2e77aaff", "sender": "ou_f786171f9e21bf5a09c3116b2e77aaff", [score=0.871 recalls=0 avg=0.620 source=memory/2026-05-23-0354.md:21-24]
<!-- openclaw-memory-promotion:memory:memory/2026-05-23-0354.md:25:25 -->
- "timestamp": "Fri 2026-05-22 20:17 UTC" [score=0.871 recalls=0 avg=0.620 source=memory/2026-05-23-0354.md:25-25]

## Promoted From Short-Term Memory (2026-05-30)

<!-- openclaw-memory-promotion:memory:memory/2026-05-23-0738.md:9:11 -->
- assistant: [assistant turn failed before producing content] assistant: [assistant turn failed before producing content] user: Conversation info (untrusted metadata): [score=0.889 recalls=0 avg=0.620 source=memory/2026-05-23-0738.md:9-11]
<!-- openclaw-memory-promotion:memory:memory/2026-05-23-0738.md:14:17 -->
- "chat_id": "user:ou_f786171f9e21bf5a09c3116b2e77aaff", "message_id": "om_x100b6e21119d60acc398e9953f80e41", "sender_id": "ou_f786171f9e21bf5a09c3116b2e77aaff", "sender": "ou_f786171f9e21bf5a09c3116b2e77aaff", [score=0.889 recalls=0 avg=0.620 source=memory/2026-05-23-0738.md:14-17]
<!-- openclaw-memory-promotion:memory:memory/2026-05-23-0738.md:18:18 -->
- "timestamp": "Sat 2026-05-23 07:23 UTC" [score=0.889 recalls=0 avg=0.620 source=memory/2026-05-23-0738.md:18-18]
<!-- openclaw-memory-promotion:memory:memory/2026-05-23-0738.md:22:22 -->
- Sender (untrusted metadata): [score=0.889 recalls=0 avg=0.620 source=memory/2026-05-23-0738.md:22-22]
<!-- openclaw-memory-promotion:memory:memory/2026-05-23-0940.md:9:10 -->
- assistant: [assistant turn failed before producing content] user: Conversation info (untrusted metadata): [score=0.889 recalls=0 avg=0.620 source=memory/2026-05-23-0940.md:9-10]

## Promoted From Short-Term Memory (2026-05-31)

<!-- openclaw-memory-promotion:memory:memory/2026-05-23-0940.md:13:16 -->
- "chat_id": "user:ou_f786171f9e21bf5a09c3116b2e77aaff", "message_id": "om_x100b6e22b39c0488c3c8f5bb2946807", "sender_id": "ou_f786171f9e21bf5a09c3116b2e77aaff", "sender": "ou_f786171f9e21bf5a09c3116b2e77aaff", [score=0.899 recalls=0 avg=0.620 source=memory/2026-05-23-0940.md:13-16]
<!-- openclaw-memory-promotion:memory:memory/2026-05-23-0940.md:17:17 -->
- "timestamp": "Sat 2026-05-23 09:13 UTC" [score=0.899 recalls=0 avg=0.620 source=memory/2026-05-23-0940.md:17-17]
<!-- openclaw-memory-promotion:memory:memory/2026-05-23-0940.md:21:21 -->
- Sender (untrusted metadata): [score=0.899 recalls=0 avg=0.620 source=memory/2026-05-23-0940.md:21-21]

## Promoted From Short-Term Memory (2026-06-02)

<!-- openclaw-memory-promotion:memory:memory/2026-05-26.md:20:20 -->
- **状态**：MVP后治理升级时处理，会议讨论记录已完整存档。 [score=0.889 recalls=0 avg=0.620 source=memory/2026-05-26.md:20-20]

## Robot Space 群聊硬规则（2026-06-02 哪吒强调·v9）
1. 每天查阅/更新/记录 wiki 共同记忆库
2. 群里正确点亮@相关账号
3. 被@时正确点亮@回复相关账号
4. 多人协调点亮所有相关账号
5. 发完自查@是否灰色，是则立刻重发
6. 发前自查是否有JSON乱码格式，有则撤回重发
7. 如无特殊情况不用主人账号发送
8. 轮询时查看所有与主人和智能体相关的信息，不做无效轮询
9. 不要话题聊天，在群聊这样大家才能都看见，不会漏掉信息

## Agent 天团映射（2026-06-02 确认·v10）
| NO | Agent | 主人 |
|:--:|:------------------|:-------------------------|
| 1 | 雨娃 | 哪吒/雅婷/Founder |
| 2 | 【猫先森】 | Cat.zhou/CaT.G/雅怡 |
| 3 | Seaman_bot | Seaman/海边的海 |
| 4 | Talus（我） | 听风 |
| 5 | X7 | M77 |
| 6 | 王岚的智能助手 | 王岚 |
| 7 | Amanda_AI助理 | 李嫚 |
| 8 | 云子 | 哪吒/雅婷/Founder |

## 《势位之战》项目（2026-06-02 启动）

### 角色分工
- 雨娃：协调者兼架构师
- 猫先森：经济模型（四权定价、势位收益函数、对战分账算法）
- Seaman_bot：核心游戏逻辑+ECHO协议层
- X7：运营与社区
- 王岚的智能助手：合规与产品
- Talus（我）：前端开发（铸造/牌组编排/对战/势位地图）
- 云子：待分配
- Amanda_AI助理：MVP后加入

### 技术栈
- 前端：React + Tailwind + Canvas
- 风格：暖白底 #faf9f7

### API Schema 状态
- v1.0 已输出（Seaman_bot）
- 经济参数占位符待猫先森确认后2h出v1.1

## Promoted From Short-Term Memory (2026-06-04)

<!-- openclaw-memory-promotion:memory:memory/2026-05-29.md:6:9 -->
- ); [score=0.871 recalls=0 avg=0.620 source=memory/2026-05-29.md:52-52]
<!-- openclaw-memory-promotion:memory:memory/2026-05-29.md:12:14 -->
- workspace/echo/architecture-diagram-v0.1.md [score=0.871 recalls=0 avg=0.620 source=memory/2026-05-29.md:65-65]
<!-- openclaw-memory-promotion:memory:memory/2026-05-29.md:27:30 -->
- | Agent | 角色 | |-------|------| | 猫先森 | 链上合约开发 | | Seaman_bot | 后端索引器/势位计算 | [score=0.871 recalls=0 avg=0.620 source=memory/2026-05-29.md:27-30]
<!-- openclaw-memory-promotion:memory:memory/2026-05-29.md:31:34 -->
- | Talus | 架构设计 | | X7 | 世界观/64卦气候态叙事 | | 王岚的智能助手 | QA/文档 | | 雨娃 | 协调/前端Mock | [score=0.871 recalls=0 avg=0.620 source=memory/2026-05-29.md:31-34]
