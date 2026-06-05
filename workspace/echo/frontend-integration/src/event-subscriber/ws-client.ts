/**
 * WebSocket 客户端 — 订阅 BattleRevenue 合约事件
 *
 * 特性：
 * - 30s ping/pong 心跳
 * - 断连指数退避重连（1s/2s/4s/8s，封顶 30s）
 * - 订阅 ID 管理（避免重复订阅）
 * - 事件类型化分发
 */

import WebSocket from 'ws';
import { CONFIG, EVENT_SIGNATURES, EventName } from '../config';

export interface RawLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: string;
}

export interface WSEvent {
  event: EventName;
  log: RawLog;
}

type EventHandler = (event: WSEvent) => void | Promise<void>;

interface Subscription {
  id: string;
  eventName: EventName;
}

export class BattleRevenueWSClient {
  private ws: WebSocket | null = null;
  private handlers: Map<EventName, Set<EventHandler>> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private reconnectAttempt = 0;
  private pingTimer: NodeJS.Timeout | null = null;
  private pongTimeoutTimer: NodeJS.Timeout | null = null;
  private nextId = 1;
  private isManualClose = false;
  private readonly endpoint = CONFIG.WS_ENDPOINT;
  private readonly address = CONFIG.BATTLE_REVENUE_ADDRESS;

  /** 注册事件处理函数 */
  on(eventName: EventName, handler: EventHandler): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler);
    return () => this.handlers.get(eventName)?.delete(handler);
  }

  /** 启动连接 */
  async connect(): Promise<void> {
    this.isManualClose = false;
    await this.open();
  }

  /** 主动关闭 */
  close(): void {
    this.isManualClose = true;
    this.clearTimers();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.endpoint);
      this.ws = ws;

      ws.on('open', () => {
        this.reconnectAttempt = 0;
        this.startHeartbeat();
        // 重新订阅所有事件
        this.resubscribeAll().then(resolve).catch(reject);
      });

      ws.on('message', (data) => this.handleMessage(data.toString()));

      ws.on('pong', () => {
        // 服务端响应 pong，清除超时
        if (this.pongTimeoutTimer) {
          clearTimeout(this.pongTimeoutTimer);
          this.pongTimeoutTimer = null;
        }
      });

      ws.on('error', (err) => {
        console.error('[WS] error:', err.message);
      });

      ws.on('close', (code, reason) => {
        console.warn(`[WS] closed: ${code} ${reason.toString()}`);
        this.clearTimers();
        if (!this.isManualClose) {
          this.scheduleReconnect();
        }
      });
    });
  }

  private startHeartbeat(): void {
    this.clearTimers();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
        // 5s 内没收到 pong 就视为断连
        this.pongTimeoutTimer = setTimeout(() => {
          console.warn('[WS] pong timeout, force close');
          this.ws?.terminate();
        }, 5_000);
      }
    }, CONFIG.PING_INTERVAL_MS);
  }

  private clearTimers(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.pongTimeoutTimer) {
      clearTimeout(this.pongTimeoutTimer);
      this.pongTimeoutTimer = null;
    }
  }

  private scheduleReconnect(): void {
    const delays = CONFIG.RECONNECT_DELAYS_MS;
    const delay = delays[Math.min(this.reconnectAttempt, delays.length - 1)];
    this.reconnectAttempt++;
    console.log(`[WS] reconnect in ${delay}ms (attempt ${this.reconnectAttempt})`);
    setTimeout(() => {
      this.open().catch((err) => {
        console.error('[WS] reconnect failed:', err.message);
        this.scheduleReconnect();
      });
    }, delay);
  }

  private async resubscribeAll(): Promise<void> {
    for (const eventName of Object.keys(EVENT_SIGNATURES) as EventName[]) {
      await this.subscribe(eventName);
    }
  }

  private async subscribe(eventName: EventName): Promise<string> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WS not open');
    }
    const id = String(this.nextId++);
    return new Promise((resolve, reject) => {
      const sig = EVENT_SIGNATURES[eventName];
      const topic0 = this.keccak256(sig); // 实际生产用 ethers.id()
      const payload = {
        jsonrpc: '2.0',
        id,
        method: 'eth_subscribe',
        params: [
          'logs',
          {
            address: this.address,
            topics: [topic0],
          },
        ],
      };
      const handler = (data: WebSocket.RawData) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          this.ws?.off('message', handler);
          if (msg.error) {
            reject(new Error(msg.error.message));
          } else {
            this.subscriptions.set(msg.result, { id: msg.result, eventName });
            resolve(msg.result);
          }
        }
      };
      this.ws!.on('message', handler);
      this.ws!.send(JSON.stringify(payload));
    });
  }

  private handleMessage(raw: string): void {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    // 订阅推送
    if (msg.method === 'eth_subscription' && msg.params?.subscription) {
      const sub = this.subscriptions.get(msg.params.subscription);
      if (!sub) return;
      const log: RawLog = msg.params.result;
      this.dispatch(sub.eventName, log);
    }
  }

  private async dispatch(eventName: EventName, log: RawLog): Promise<void> {
    const handlers = this.handlers.get(eventName);
    if (!handlers) return;
    const event: WSEvent = { event: eventName, log };
    await Promise.all([...handlers].map((h) => Promise.resolve(h(event))));
  }

  /** keccak256 — 简化版用 ethers 计算 */
  private keccak256(sig: string): string {
    // 用 ethers 计算 topic0
    // 实际生产: import { id } from 'ethers'; return id(sig);
    // 这里避免依赖导入,用 Node crypto 算
    const { keccak256, toUtf8Bytes } = require('ethers');
    return keccak256(toUtf8Bytes(sig));
  }
}
