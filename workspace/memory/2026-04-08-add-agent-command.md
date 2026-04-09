# Session: 2026-04-08 15:29:13 UTC

- **Session Key**: agent:main:feishu:main:direct:ou_8d379606db2e0a64b8dbda39b4671fa6
- **Session ID**: ebaa5272-1fa5-4214-976a-e10bc35073f8
- **Source**: feishu

## Conversation Summary

user: Conversation info (untrusted metadata):
```json
{
  "message_id": "om_x100b5269f16324a4ee8decef4bb7f0b",
  "sender_id": "ou_8d379606db2e0a64b8dbda39b4671fa6",
  "sender": "听风",
  "timestamp": "Wed 2026-04-08 04:39 UTC"
}
```

Sender (untrusted metadata):
```json
{
  "label": "听风 (ou_8d379606db2e0a64b8dbda39b4671fa6)",
  "id": "ou_8d379606db2e0a64b8dbda39b4671fa6",
  "name": "听风"
}
```

[message_id: om_x100b5269f16324a4ee8decef4bb7f0b]
听风: 添加agent的完整命令是什么
assistant: [[reply_to_current]]
根据 OpenClaw 官方文档，添加 Agent 的完整命令格式如下：

### 基本语法
```bash
openclaw agents add [agent名称] --workspace <工作区目录> [选项]
```

### 常用选项
- `--workspace <dir>`：指定 Agent 的工作区目录（必填，非交互式模式下必须指定）
- `--model <id>`：指定默认模型
- `--bind <channel[:accountId]>`：绑定渠道（可重复指定多个绑定），格式如 `feishu` 或 `telegram:user123`
- `--non-interactive`：非交互式模式
- `--agent-dir <dir>`：指定 Agent 状态目录

### 示例
1. **基础添加（交互式向导）**：
```bash
openclaw agents add work
```

2. **非交互式完整添加**：
```bash
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind feishu --non-interactive
```

3. **绑定多个渠道**：
```bash
openclaw agents add myagent --workspace ~/.openclaw/workspace-myagent --bind feishu --bind telegram:myaccount --non-interactive
```

### 注意事项
- `main` 是保留名称，不能用作新 Agent 的 ID
- 如果你省略了显式标志，会进入交互式配置向导
- 添加后可以使用 `openclaw agents list` 查看已添加的 Agent
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "om_x100b52699e6700a4ee7e1ff241fea79",
  "sender_id": "ou_8d379606db2e0a64b8dbda39b4671fa6",
  "sender": "听风",
  "timestamp": "Wed 2026-04-08 04:43 UTC"
}
```

Sender (untrusted metadata):
```json
{
  "label": "听风 (ou_8d379606db2e0a64b8dbda39b4671fa6)",
  "id": "ou_8d379606db2e0a64b8dbda39b4671fa6",
  "name": "听风"
}
```

[message_id: om_x100b52699e6700a4ee7e1ff241fea79]
听风:   --non-interactive    干啥的
assistant: [[reply_to_current]]
`--non-interactive` 是让命令**不进入交互式向导**，直接使用你提供的命令行参数完成添加，全程不需要用户输入任何内容。

具体区别：

1. **不加 `--non-interactive`**：会启动交互式配置向导，一步一步问你：
   - 工作区目录在哪里
   - 要绑定哪个渠道
   - 默认模型用什么
   - 需要你一步步回答确认

2. **加 `--non-interactive`**：直接使用命令行上给定的参数（`--workspace`、`--bind`、`--model` 等）一次性完成创建，适合：
   - 脚本自动化部署
   - 你已经清楚所有配置，不想一步步回答提问
   - 批量创建多个 Agent

> 注意：使用 `--non-interactive` 时，**必须同时指定 `--workspace`**，否则命令会报错，因为它没法交互式问你工作区在哪。

举个对比：
```bash
# 交互式，会一步步问你配置
openclaw agents add myagent

# 非交互式，一键完成，不需要交互
openclaw agents add myagent --workspace ~/.openclaw/workspace-myagent --bind feishu --non-interactive
```
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "om_x100b526990e67ca0eea25271982e80f",
  "sender_id": "ou_8d379606db2e0a64b8dbda39b4671fa6",
  "sender": "听风",
  "timestamp": "Wed 2026-04-08 04:47 UTC"
}
```

Sender (untrusted metadata):
```json
{
  "label": "听风 (ou_8d379606db2e0a64b8dbda39b4671fa6)",
  "id": "ou_8d379606db2e0a64b8dbda39b4671fa6",
  "name": "听风"
}
```

[message_id: om_x100b526990e67ca0eea25271982e80f]
听风: 新添加飞书账户呢
assistant: [[reply_to_current]]
添加新的飞书账户分两种情况，完整步骤如下：

---

### 情况一：首次添加飞书渠道
如果还没配置过飞书，直接使用交互式向导：
```bash
openclaw channels add
```
然后按提示选择 **Feishu**，输入你的：
- App ID（格式 `cli_xxx`，从飞书开放平台获取）
- App Secret（从飞书开放平台获取）

配置完成后重启网关：
```bash
openclaw gateway restart
```

---

### 情况二：已有飞书渠道，添加第二个账户
需要手动编辑配置文件 `~/.openclaw/openclaw.json`，在 `channels.feishu.accounts` 下新增账户：

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main", // 设置默认账户
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "主机器人",
        },
        second: { // 新账户 ID
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "第二个机器人",
          enabled: true,
        },
      },
    },
  },
}
```

改完后重启网关生效：
```bash
openclaw gateway restart
```

---

### 完整前置准备（飞书开放平台侧）
1. 访问 [飞书开放平台](https://open.feishu.cn/app) 创建企业应用
2. 启用机器人能力
3. 批量导入权限（复制以下权限 JSON）：
```json
{
  "scopes": {
    "tenant": [
      "aily:file:read", "aily:file:write", "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage", "application:bot.menu:write", "cardkit:card:read",
      "cardkit:card:write", "contact:user.employee_id:readonly", "corehr:file:download", "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read", "im:chat.members:bot_access", "im:message",
      "im:message.group_at_msg:readonly", "im:message.p2p_msg:readonly", "im:message:readonly",
      "im:message:send_as_bot", "im:resource"
    ]
  }
}
```
4. 事件订阅选择**使用长连接接收事件**，添加事件 `im.message.receive_v1`
5. 创建版本并发布应用

---

### 之后需要做什么
发布完成后，在飞书中私信机器人，会收到配对码，然后批准配对：
```bash
openclaw pairing approve feishu <配对码>
```

如果你要把这个新飞书账户绑定到特定 Agent，可以用：
```bash
openclaw agents bind --agent <agent名称> --bind feishu:<账户ID>
```
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "om_x100b52561eb32134ee76cf02915f347",
  "sender_id": "ou_8d379606db2e0a64b8dbda39b4671fa6",
  "sender": "听风",
  "timestamp": "Wed 2026-04-08 09:51 UTC"
}
```

Sender (untrusted metadata):
```json
{
  "label": "听风 (ou_8d379606db2e0a64b8dbda39b4671fa6)",
  "id": "ou_8d379606db2e0a64b8dbda39b4671fa6",
  "name": "听风"
}
```

[message_id: om_x100b52561eb32134ee76cf02915f347]
听风: 帮我派 2 个子智能体，每个智能体都睡觉 3 分钟，其他什么事都不用做
assistant: 已派出两个子智能体，它们正在睡觉等待3分钟，完成后会自动通知。

- 子智能体1：`sleep-agent-1` (session: `agent:main:subagent:5dd67d33-86f2-41e0-809f-57110f90eb7f`)
- 子智能体2：`sleep-agent-2` (session: `agent:main:subagent:721a52a7-d9d2-474b-a331-04d1cd0745b1`)

等待完成中...
assistant: [[reply_to_current]]
✅ **第一个子智能体已完成任务**：已睡满 3 分钟，顺利结束。
assistant: [[reply_to_current]]
✅ **第二个子智能体也已完成任务**：已睡满 3 分钟，顺利结束。

两个子智能体都完成了3分钟睡眠任务，已自动清理。
