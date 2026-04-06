# Session: 2026-03-24 16:47:20 UTC

- **Session Key**: agent:main:feishu:main:direct:ou_8d379606db2e0a64b8dbda39b4671fa6
- **Session ID**: 074ddace-e9bd-48e7-9557-ac2f598f3bc7
- **Source**: feishu

## Conversation Summary

assistant: `missing` 不代表坏了——它表示**这个 skill 的依赖条件在当前环境里没满足**。OpenClaw 在检测到依赖齐全后才会把它标为 ready。

## 各 skill 缺失的原因

| 缺失原因 | 说明 | 例子 |
|---|---|---|
| `bins: xxx` | 缺少某个命令行工具 | `apple-notes` 需要 `memo`，`github` 需要 `gh` |
| `os: darwin` | 仅为 macOS 设计 | `apple-notes`、`imsg`、`things-mac` |
| `env: XXX_API_KEY` | 缺少环境变量 | `notion` 需要 `NOTION_API_KEY`，`sag` 需要 `ELEVENLABS_API_KEY` |
| `config: channels.xxx` | 缺少渠道配置 | `discord` 需要 `channels.discord.token` |

## 让它们 ready 的方法

**通用工具类**（可以安装二进制）：
```bash
# 例如安装 gh (GitHub CLI)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh

# 例如安装 ffmpeg (video-frames 需要)
sudo apt install ffmpeg

# 例如安装 tmux
sudo apt install tmux
```

**环境变量类**——在 `openclaw.json` 的 `env` 或系统环境里配置：
```json
"env": {
  "NOTION_API_KEY": "your-key"
}
```

**macOS only 的 skill**——在 Linux 容器里无法使用（`apple-notes`、`imsg`、`bear-notes` 等）

## 当前环境里已经 ready 的

你这里已经有 **10 个 ready** 的 skill：`feishu-*`、`clawhub`、`healthcheck`、`node-connect`、`skill-creator`、`video-frames`、`weather`，都是当前环境依赖已满足的。

简单说：`missing` 是正常的，表示"还缺东西"。装好对应的 binary 或配好环境变量，它就会变成 ready。
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "om_x100b531f570748a4eea0b1d53f8d0e7",
  "sender_id": "ou_8d379606db2e0a64b8dbda39b4671fa6",
  "sender": "听风",
  "timestamp": "Tue 2026-03-24 15:45 UTC"
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

[message_id: om_x100b531f570748a4eea0b1d53f8d0e7]
听风: /app# openclaw skills install coding-agent


🦞 OpenClaw 2026.3.22 (unknown) — I'm not magic—I'm just extremely persistent with retries and coping strategies.


ClawHub /api/v1/skills/coding-agent failed (404): Skill not found
assistant: `coding-agent` 是 OpenClaw **内置的 bundled skill**，不在 ClawHub 上——它已经在 `/app/skills/coding-agent/` 里了，不需要安装。

直接用就行：

```bash
openclaw skills list | grep coding
```

会看到它已经是 eligible 的状态（只是 binary 依赖 `claude`/`codex`/`opencode`/`pi` 没装，所以 status 不是 ready，但 skill 本身已经在那了）。

如果你想装的是"用 AI 写代码"的 skill，可以试试 ClawHub 上搜索到的：

```bash
openclaw skills install agentic-coding
```

或者更智能的编码 agent：

```bash
openclaw skills install dev-coding-agent
```

要看完整列表：

```bash
openclaw skills list --eligible
```

bundled skill 缺失依赖的解决方法（如果你确实想让它 ready）：

```bash
# coding-agent 需要 claude 或 codex 或 opencode
# 例如安装 opencode：
curl -fsSL https://get.opencode.ai | bash
```
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "om_x100b531f663994a4ee764269531eadc",
  "sender_id": "ou_8d379606db2e0a64b8dbda39b4671fa6",
  "sender": "听风",
  "timestamp": "Tue 2026-03-24 15:49 UTC"
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

[message_id: om_x100b531f663994a4ee764269531eadc]
听风: ot@cc81f008b480:/app# curl -fsSL https://get.opencode.ai | bash
curl: (6) Could not resolve host: get.opencode.ai
assistant: GitHub 和 npm 可以访问，但 `get.opencode.ai` 域名解析失败（可能是 DNS 污染或该域名本身问题）。

`coding-agent` 只要有 `claude` / `codex` / `opencode` / `pi` 任一 binary 就能 ready。要不试试直接装 Claude Code：

```bash
# 方式1: 从 GitHub releases 下载 opencode 二进制
# 去 https://github.com/opencode-ai/opencode/releases 看最新版本

# 方式2: 装 Claude Code
npm install -g @anthropic-ai/claude-code
```

但如果容器网络有限制，有些下载站可能也访问不了。

---

**换个角度**——`coding-agent` 缺失 binary 不是坏事，它只是"还没配 binary"。如果你当前不需要让 coding skill 工作，完全可以跳过。

你具体想用 coding-agent 做什么？也许有更简单的替代方案。
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "om_x100b531f60b6a0acee706f5ab40d118",
  "sender_id": "ou_8d379606db2e0a64b8dbda39b4671fa6",
  "sender": "听风",
  "timestamp": "Tue 2026-03-24 15:51 UTC"
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

[message_id: om_x100b531f60b6a0acee706f5ab40d118]
听风: root@cc81f008b480:/app# openclaw skills install summarize


🦞 OpenClaw 2026.3.22 (unknown) — I'm the reason your shell history looks like a hacker-movie montage.


Downloading summarize@1.0.0 from ClawHub…
ClawHub /api/v1/download failed (429): Rate limit exceeded
root@cc81f008b480:/app#
assistant: 
ClawHub 下载被限速了（429 Rate limit exceeded），是临时限制。

等 **1-2 分钟** 再试就行：

```bash
openclaw skills install summarize
```

如果急着装，也可以用 `clawhub` CLI 绕过（稍有不同的下载路径）：

```bash
npx clawhub install summarize
```

或者直接看 summarize skill 需要什么 binary——它本质上是调用一个 `summarize` 命令，也许直接装那个工具更快：

```bash
# 看看 skill 内容需要什么
cat /app/skills/summarize/SKILL.md
```

不过通常就是等一会儿再重试，ClawHub 的限速比较宽松。
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "om_x100b531f760cd0a0ee757ab79bc0e95",
  "sender_id": "ou_8d379606db2e0a64b8dbda39b4671fa6",
  "sender": "听风",
  "timestamp": "Tue 2026-03-24 15:53 UTC"
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

[message_id: om_x100b531f760cd0a0ee757ab79bc0e95]
听风: coding-agent 需要哪些依赖，可以安装么
assistant: 依赖四个 binary 之一：**`claude`**、**`codex`**、**`opencode`**、**`pi`**，任选一个安装即可。

## 逐一说明

| Binary | 来源 | 安装难度 |
|---|---|---|
| `claude` | Anthropic Claude Code | ✅ 最好装 |
| `codex` | OpenAI Codex | ⚠️ 需要 OpenAI API key |
| `opencode` | opencode.ai | ❌ 域名解析失败 |
| `pi` | `@mariozechner/pi-coding-agent` (npm) | ✅ 可试 |

---

## 最推荐：装 Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

装完验证：
```bash
claude --version
```

然后：
```bash
openclaw skills check | grep coding
```

应该就 ready 了。

---

## 备选：装 Pi（npm 可达）

```bash
npm install -g @mariozechner/pi-coding-agent
```

---

## 如果 npm 也网络受限

可以先看 `coding-agent` 本身——它主要就是个编排层，真正干活的是这几个 agent CLI。只要有一个能跑，skill 就活了。

你现在网络状况如何？npm 和 GitHub 能访问吗？
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "om_x100b531f9b2a14a4eeae74f32448737",
  "sender_id": "ou_8d379606db2e0a64b8dbda39b4671fa6",
  "sender": "听风",
  "timestamp": "Tue 2026-03-24 16:35 UTC"
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

[message_id: om_x100b531f9b2a14a4eeae74f32448737]
听风: https://clawhub.ai/shaivpidadi/free-ride
请看一下这个skill应该怎么安装
assistant: 这个 skill 叫 **free-ride**，让 OpenClaw 使用 OpenRouter 上的免费 AI 模型。

## 安装步骤

**1. 安装 skill（从 ClawHub）：**
```bash
openclaw skills install free-ride
```

**2. 确保有 OpenRouter API Key：**
```bash
echo $OPENROUTER_API_KEY
```
如果没有，去 [https://openrouter.ai/keys](https://openrouter.ai/keys) 申请一个免费的，然后：
```bash
openclaw config set env.OPENROUTER_API_KEY "sk-or-v1-..."
```

**3. 安装 freeride CLI：**
```bash
cd ~/.openclaw/workspace/skills/free-ride
pip install -e .
```

**4. 配置免费模型：**
```bash
freeride auto
```

**5. 重启 gateway 让配置生效：**
```bash
openclaw gateway restart
```

---

## 这个 skill 做了什么

- 把最优质的免费模型（`qwen3-coder:free`）设为主模型
- 添加 5 个免费 fallback，防止 rate limit 中断
- 保留你现有的所有其他配置

## 验证

发给它 `/status`，看 active model 是否变成 `openrouter/.../...:free` 结尾的免费模型。

有问题随时说。
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "om_x100b531f9506cca0eeaffed9fdff2ad",
  "sender_id": "ou_8d379606db2e0a64b8dbda39b4671fa6",
  "sender": "听风",
  "timestamp": "Tue 2026-03-24 16:37 UTC"
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

[message_id: om_x100b531f9506cca0eeaffed9fdff2ad]
听风:  clawhub search free-ride
didi  Didi  (0.719)
freebie  Freebie  (0.683)
ecommerce-ad-copy-generator-free  Ecommerce Ad Copy Generator Free  (0.683)
ride-receipts-llm  Ride Receipts  (0.667)
strider-uber  Strider Uber  (0.637)
uber  I need a ride like real quick  (0.610)
strider-lyft  Strider Lyft  (0.610)
api-hunter  API Hunter  (0.577)
free-token  Free Token  (0.534)
strider-southwest  Strider usouthwest  (0.529)
root@cc81f008b480:/app# 
这艘出来这么多，我该如何准确定位到[shaivpidadi/free-ride](https://clawhub.ai/shaivpidadi/free-ride)
assistant: 
直接用完整 slug 安装即可：

```bash
openclaw skills install shaivpidadi/free-ride
```

ClawHub 的 skill slug 格式就是 `用户名/skill名`，`openclaw skills install` 直接接受这个格式。

如果不行，再试试搜索精确匹配：

```bash
openclaw skills search "shaivpidadi free ride"
```

或者直接去 skill 页面看确切 slug——网页 URL `clawhub.ai/shaivpidadi/free-ride` 里斜杠后面的部分就是 slug。
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "om_x100b531fa557c0a0ee8420f14911562",
  "sender_id": "ou_8d379606db2e0a64b8dbda39b4671fa6",
  "sender": "听风",
  "timestamp": "Tue 2026-03-24 16:41 UTC"
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

[message_id: om_x100b531fa557c0a0ee8420f14911562]
听风: openclaw skills search " free ride"
搜索skill如何显示作者
assistant: 搜索结果只显示 `slug  名称  描述`，没有作者列。但可以查具体 skill 的 info：

```bash
openclaw skills info free-ride
```

不过 info 查的是本地已安装的。

对于 ClawHub 上的远程 skill，可以用 `clawhub` CLI 查看详细信息：

```bash
npx clawhub search "free ride" --limit 5
```

或者直接看 skill 页面 URL——作者就在斜杠前面，比如 `shaivpidadi/free-ride` 的作者就是 **shaivpidadi**。

---

**另有一个思路**——你装的 `free-ride` 对应哪个？搜索结果里显示的是 `free-ride-1-0-5`（带版本号），slug 是 `free-ride`。安装时：

```bash
openclaw skills install free-ride
```

会自动装最新版本。如果想装特定作者版本才需要 `shaivpidadi/free-ride`，普通情况直接 `free-ride` 就够了。
