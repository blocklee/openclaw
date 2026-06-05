/**
 * BattleArena 集成 v0.4
 * 嵌入 7 权分账 UI + 16 卦选择器
 * 暖白底 #faf9f7
 */
'use client';

import { useState } from 'react';
import { RevenueSharePanel } from './RevenueSharePanel';
import { HexagramSelector } from './HexagramSelector';

export function BattleArena() {
  const [poolMEER, setPoolMEER] = useState(0.1);
  const [view, setView] = useState<'revenue' | 'hexagram' | 'both'>('both');

  return (
    <div className="min-h-screen bg-[#faf9f7] p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-medium leading-relaxed text-[#2a2522] mb-2">ECHO 势位之战</h1>
          <p className="text-sm text-[#6b5f56]">
            对战分账 + 卦象规则 · 合约 0x43CeDEd5...879f (7 权) · 链上验证 7/7
          </p>
        </header>

        <div className="mb-5 flex items-center gap-4">
          <label className="text-sm text-[#6b5f56]">对战池 (MEER):</label>
          <input
            type="number"
            value={poolMEER}
            onChange={e => setPoolMEER(Number(e.target.value))}
            min={0.1}
            max={10}
            step={0.1}
            className="px-3 py-1.5 border border-[#d4c5b0] rounded text-sm bg-white focus:outline-none focus:border-[#2a2522] w-24"
          />
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setView('revenue')}
              className={`px-3 py-1.5 text-sm rounded transition-colors duration-700 ${view === 'revenue' ? 'bg-[#2a2522] text-white' : 'bg-white border border-[#d4c5b0] text-[#2a2522] hover:border-[#2a2522]'}`}
            >
              分账
            </button>
            <button
              onClick={() => setView('hexagram')}
              className={`px-3 py-1.5 text-sm rounded transition-colors duration-700 ${view === 'hexagram' ? 'bg-[#2a2522] text-white' : 'bg-white border border-[#d4c5b0] text-[#2a2522] hover:border-[#2a2522]'}`}
            >
              卦象
            </button>
            <button
              onClick={() => setView('both')}
              className={`px-3 py-1.5 text-sm rounded transition-colors duration-700 ${view === 'both' ? 'bg-[#2a2522] text-white' : 'bg-white border border-[#d4c5b0] text-[#2a2522] hover:border-[#2a2522]'}`}
            >
              全屏
            </button>
          </div>
        </div>

        <div className={`grid gap-6 ${view === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {(view === 'revenue' || view === 'both') && <RevenueSharePanel poolMEER={poolMEER} />}
          {(view === 'hexagram' || view === 'both') && <HexagramSelector />}
        </div>

        <footer className="mt-6 text-xs text-[#8b7e6e] text-center">
          ECHO v0.4 · 联调: 20/20 单测 + 7/7 e2e · 仓库: zhouyatingkol/echo-v2
        </footer>
      </div>
    </div>
  );
}

export default BattleArena;
