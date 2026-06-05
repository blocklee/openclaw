/**
 * HTTP polling fallback — WS 断连时用 eth_getLogs 轮询
 *
 * 特性：
 * - 12s 轮询间隔（对齐 QNG 区块时间）
 * - 维护 lastSeenBlock，避免漏事件或重复
 * - 相同事件类型分发到与 WS 相同的 handler
 */

import { CONFIG, EVENT_SIGNATURES, EventName } from '../config';
import { RawLog } from './ws-client';

type EventHandler = (event: { event: EventName; log: RawLog }) => void | Promise<void>;

export class HTTPFallbackPoller {
  private handlers: Map<EventName, Set<EventHandler>> = new Map();
  private lastSeenBlock = 0;
  private pollTimer: NodeJS.Timeout | null = null;
  private readonly rpcEndpoint: string;
  private readonly contractAddress: string;

  constructor(rpcEndpoint = 'https://qng.rpc.qitmeer.io') {
    this.rpcEndpoint = rpcEndpoint;
    this.contractAddress = CONFIG.BATTLE_REVENUE_ADDRESS;
  }

  on(eventName: EventName, handler: EventHandler): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler);
    return () => this.handlers.get(eventName)?.delete(handler);
  }

  /** 启动轮询 */
  async start(): Promise<void> {
    // 初始 latest block
    this.lastSeenBlock = parseInt(await this.rpcCall('eth_blockNumber', []), 16);
    this.pollTimer = setInterval(() => this.pollOnce(), CONFIG.POLL_INTERVAL_MS);
    console.log(`[HTTP-Fallback] start at block ${this.lastSeenBlock}`);
  }

  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async pollOnce(): Promise<void> {
    try {
      const latestHex = await this.rpcCall('eth_blockNumber', []);
      const latest = parseInt(latestHex, 16);
      if (latest <= this.lastSeenBlock) return;

      // QNG 单次查询上限 1000 块,分段查
      const fromBlock = this.lastSeenBlock + 1;
      const toBlock = Math.min(latest, fromBlock + 999);

      for (const eventName of Object.keys(EVENT_SIGNATURES) as EventName[]) {
        const logs = await this.getLogs(eventName, fromBlock, toBlock);
        for (const log of logs) {
          await this.dispatch(eventName, log);
        }
      }
      this.lastSeenBlock = toBlock;
    } catch (err: any) {
      console.error('[HTTP-Fallback] poll error:', err.message);
    }
  }

  private async getLogs(eventName: EventName, from: number, to: number): Promise<RawLog[]> {
    const sig = EVENT_SIGNATURES[eventName];
    const { keccak256, toUtf8Bytes } = require('ethers');
    const topic0 = keccak256(toUtf8Bytes(sig));
    const result = await this.rpcCall('eth_getLogs', [
      {
        address: this.contractAddress,
        topics: [topic0],
        fromBlock: '0x' + from.toString(16),
        toBlock: '0x' + to.toString(16),
      },
    ]);
    return result || [];
  }

  private async rpcCall(method: string, params: any[]): Promise<any> {
    const res = await fetch(this.rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
    });
    const json: any = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.result;
  }

  private async dispatch(eventName: EventName, log: RawLog): Promise<void> {
    const handlers = this.handlers.get(eventName);
    if (!handlers) return;
    await Promise.all([...handlers].map((h) => Promise.resolve(h({ event: eventName, log }))));
  }
}
