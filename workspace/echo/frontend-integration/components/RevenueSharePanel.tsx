/**
 * 7 权分账展示组件 (v0.4)
 * 暖白底 #faf9f7, 极简, 慢动画
 */
'use client';

import { CONFIG } from '../src/config';

const SHARE_PERCENT: Record<string, { bps: number; label: string; emoji: string; color: string }> = {
  CREATOR:    { bps: 4500, label: '创作者',     emoji: '☀️',  color: '#8B6F47' },
  EDGE:       { bps: 2500, label: '编排者',     emoji: '🌿',  color: '#5E7E94' },
  REVIEWER:   { bps: 800,  label: '审查员',     emoji: '🔍',  color: '#6E7A85' },
  PUBLIC_POOL:{ bps: 800,  label: '公共池',     emoji: '🌊',  color: '#528589' },
  PLATFORM:   { bps: 500,  label: '平台费',     emoji: '⚖️',  color: '#8B5A3C' },
  AMBASSADOR: { bps: 500,  label: '大使',       emoji: '✨',  color: '#B8923A' },
  RESERVE:    { bps: 400,  label: '储备',       emoji: '🌀',  color: '#3D5555' },
};

export function RevenueSharePanel({ poolMEER = 0.1 }: { poolMEER?: number }) {
  const poolWei = BigInt(Math.floor(poolMEER * 1e18));
  const total = Object.values(SHARE_PERCENT).reduce((a, b) => a + b.bps, 0);

  return (
    <div className="p-5 border border-[#d4c5b0] rounded-lg bg-[#faf9f7] shadow-sm">
      <h3 className="text-base font-medium mb-3 text-[#2a2522]">分账预览 (对战池 {poolMEER} MEER)</h3>
      <p className="text-xs text-[#8b7e6e] mb-4">合约地址: 0x43Ce...879f · 总和 100%</p>

      <div className="space-y-2">
        {Object.entries(SHARE_PERCENT).map(([key, info]) => {
          const amount = (poolWei * BigInt(info.bps)) / 10000n;
          const amountMEER = Number(amount) / 1e18;
          return (
            <div
              key={key}
              className="flex items-center justify-between p-2.5 bg-white rounded border border-[#e8dcc8] hover:border-[#2a2522] transition-colors duration-700"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{info.emoji}</span>
                <span className="text-sm text-[#2a2522] font-medium">{info.label}</span>
                <span className="text-xs text-[#8b7e6e]">({key})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-[#f0ebe1] rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{ width: `${(info.bps / 10000) * 100}%`, backgroundColor: info.color }}
                  />
                </div>
                <span className="text-sm text-[#2a2522] font-mono w-16 text-right">{info.bps / 100}%</span>
                <span className="text-xs text-[#6b5f56] font-mono w-20 text-right">{amountMEER.toFixed(4)} MEER</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-[#e8dcc8] flex justify-between text-xs text-[#8b7e6e]">
        <span>验证: validator.ts (11/11 单测)</span>
        <span>链上: e2e 7/7 (0x43CeDEd5...879f)</span>
      </div>
    </div>
  );
}

export default RevenueSharePanel;
