/**
 * BattleArena 实时版 v0.5
 * 接入 BattleChainReader (链上查询) + BattleEventSubscriber (实时事件)
 * 暖白底 #faf9f7
 */
'use client';

import { useState, useEffect } from 'react';
import { JsonRpcProvider } from 'ethers';
import { CONFIG } from '../src/config';
import { BattleChainReader } from '../src/chain-reader/reader';
import { BattleEventSubscriber } from '../src/event-subscriber/subscriber';
import { RevenueSharePanel } from './RevenueSharePanel';
import { HexagramSelector } from './HexagramSelector';
import { HexagramInfoTheory } from './HexagramInfoTheory';

const KNOWN_BATTLES = [
  // 来自 abi-build/e2e-revenue-v3.ts 7/7 验证的 battle
  '0xda1797222c613967331e4064c268dbe85770bd2aba294d09f525f196675bbef5',
  '0xa564a69d24b0b5431bc493c1c8f48f8c674037c7bd27b2da5f67d7dbb3c5d4ed',
];

export function BattleArenaLive() {
  const [battleId, setBattleId] = useState(KNOWN_BATTLES[0]);
  const [battleData, setBattleData] = useState<any>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [poolMEER, setPoolMEER] = useState(0.1);

  useEffect(() => {
    const provider = new JsonRpcProvider('https://qng.rpc.qitmeer.io', 813, { staticNetwork: true });
    const reader = new BattleChainReader(provider);
    const subscriber = new BattleEventSubscriber({ rpcEndpoint: 'https://qng.rpc.qitmeer.io' });

    const fetchBattle = async () => {
      setLoading(true);
      try {
        const data = await reader.getBattle(battleId);
        setBattleData(data);
        // 用链上 revenuePool 驱动 poolMEER
        if (data && data.revenuePool) {
          const pool = Number(data.revenuePool) / 1e18;
          setPoolMEER(pool);
        }
      } catch (e: any) {
        setEvents(prev => [`[${new Date().toISOString().slice(11, 19)}] ❌ ${e.message}`, ...prev].slice(0, 10));
      } finally {
        setLoading(false);
      }
    };

    fetchBattle();

    if (liveMode) {
      const unsub = subscriber.on('RevenueDistributed' as any, (evt: any) => {
        setEvents(prev => [
          `[${new Date().toISOString().slice(11, 19)}] 💸 ${evt.event || 'RevenueDistributed'}: ${JSON.stringify(evt).slice(0, 80)}`,
          ...prev,
        ].slice(0, 10));
        fetchBattle(); // 重新拉数据
      });
      return () => unsub();
    }
  }, [battleId, liveMode]);

  return (
    <div className="min-h-screen bg-[#faf9f7] p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-medium leading-relaxed text-[#2a2522] mb-2">ECHO 势位之战 · 实时版</h1>
          <p className="text-sm text-[#6b5f56]">
            链上数据 · 合约 0x43CeDEd5...879f (7 权) · v0.5 实时事件订阅
          </p>
        </header>

        <div className="mb-5 p-4 bg-white rounded border border-[#d4c5b0]">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-[#6b5f56]">Battle ID:</label>
            <select
              value={battleId}
              onChange={e => setBattleId(e.target.value)}
              className="flex-1 min-w-0 px-3 py-1.5 border border-[#d4c5b0] rounded text-sm bg-white font-mono"
            >
              {KNOWN_BATTLES.map(b => (
                <option key={b} value={b}>{b.slice(0, 20)}...{b.slice(-6)}</option>
              ))}
            </select>
            <button
              onClick={() => setLiveMode(!liveMode)}
              className={`px-4 py-1.5 text-sm rounded transition-colors duration-700 ${
                liveMode
                  ? 'bg-[#cd5c5c] text-white hover:bg-[#a04848]'
                  : 'bg-[#2a2522] text-white hover:bg-[#3d3632]'
              }`}
            >
              {liveMode ? '🟢 实时中' : '⚪ 开启实时'}
            </button>
          </div>
        </div>

        {battleData && (
          <div className="mb-5 p-4 bg-[#f5f3ef] rounded border border-[#d4c5b0]">
            <h3 className="text-sm font-medium text-[#2a2522] mb-2">链上 Battle 状态</h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#6b5f56]">
              <div>Player 1: <span className="text-[#2a2522]">{battleData.player1?.slice(0, 12)}...</span></div>
              <div>Player 2: <span className="text-[#2a2522]">{battleData.player2?.slice(0, 12)}...</span></div>
              <div>Bet: <span className="text-[#2a2522]">{battleData.betAmount ? Number(battleData.betAmount) / 1e18 : 0} MEER</span></div>
              <div>Pool: <span className="text-[#2a2522]">{battleData.revenuePool ? Number(battleData.revenuePool) / 1e18 : 0} MEER</span></div>
              <div>Distributed: <span className={battleData.distributed ? 'text-[#cd5c5c]' : 'text-[#daa520]'}>
                {battleData.distributed ? '✓ 是' : '⏳ 否'}
              </span></div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5">
          <RevenueSharePanel poolMEER={poolMEER} />
          <HexagramSelector />
        </div>

        {liveMode && events.length > 0 && (
          <div className="p-4 bg-white rounded border border-[#d4c5b0]">
            <h3 className="text-sm font-medium text-[#2a2522] mb-2">实时事件流 (最近 {events.length} 条)</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {events.map((e, i) => (
                <div key={i} className="text-xs font-mono text-[#6b5f56] truncate">{e}</div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-6 text-xs text-[#8b7e6e] text-center">
          v0.6 · 实时数据 + 信息论 · 单测 20/20 + e2e 7/7 + AmandaLi 暖白底 review + X7 信息论组件
        </footer>
      </div>
    </div>
  );
}

export default BattleArenaLive;
