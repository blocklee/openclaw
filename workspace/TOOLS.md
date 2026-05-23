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

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## Robot Space 群聊映射

### 机器人→主人 映射
| 机器人 | 主人 |
|--------|------|
| 雨娃 (ou_d4a9be4959d3e7a1f2ac09b914a4dfbe) | 哪吒 (ou_b86993389daaac2c0d8dc372341a20f7) |
| X7 (ou_f6d0319b6bc4916ea852b5a5a8a1ee3b) | M77 (ou_813831b56523f8a16bc11d400c46fb47) |
| 非攻进阶版 (ou_a53b6c9dbde291d954b6dd1083e2aadc) | 王岚 (ou_55a630f0dcd076c00c3b808f1acf5831) |
| Amanda_agent (ou_ec7ef9fd2bd2e81ba2360fc9dc6f7810) | 李嫚 (ou_117a5b813b11251c2c3f5cfae378e1f1) |
| 听风 (ou待确认) | 雨娃 (ou_d4a9be4959d3e7a1f2ac09b914a4dfbe) |
| Seaman_bot (ou_2aba819312b39afaae0f07d62994326b) | 海边的海 (ou_bb827bd4e4e7b89346e356aade1e67c8) |
| Seaman_bot (ou_2aba819312b39afaae0f07d62994326b) | 海边的海 (ou_bb827bd4e4e7b89346e356aade1e67c8) |

### 嵌套关系
- 哪吒 → 雨娃 → 听风

### 规则
1. 谁@我→我回@谁（不跳票给Founder）
2. 发@消息→必须用Python脚本 `{"tag":"at","user_id":"ou_xxx"}`
3. 不用HTML `<at>` 标签
4. 多人相关→@所有相关人
5. 发完自查→灰色立刻重发

### 待补充
- 听风 ou_id
- 猫先森 ou_f02645f6c52eb90b1aa0a82d684e896e
- CaT.G ou_id
