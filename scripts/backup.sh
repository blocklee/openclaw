#!/bin/bash
cd /home/node/.openclaw
git add -A
git commit -m "auto backup $(date +%Y-%m-%d)" 2>/dev/null || true
git push
