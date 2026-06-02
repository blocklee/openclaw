# 备份失败记录

## 时间
2026-05-31 00:00 UTC (北京时间 08:00)

## 失败原因
- SSH命令不存在：`error: cannot run ssh: No such file or directory`
- HTTPS方式需要密码，但没有credential存储

## 已尝试
1. 原始remote: git@github.com:blocklee/my-openclaw.git (SSH)
2. 尝试改为HTTPS: fatal: could not read Username for 'https://github.com': terminal prompts disabled

## 影响
日常备份任务失败，commit已生成本地但未推送到远程
下次运行时会包含本次commit一起推送

## 建议
- 安装ssh client
- 或配置git credential store存储GitHub token
- 或使用GitHub Personal Access Token替代密码