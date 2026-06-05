/**
 * 事件订阅主入口
 *
 * 策略：
 * - 默认 WS 为主，HTTP fallback 兜底
 * - WS 断连时 fallback 顶上
 * - WS 重连成功后 fallback 停止（避免重复事件）
 * - 同一事件去重（按 txHash + logIndex）
 */

import { BattleRevenueWSClient, WSEvent, RawLog } from './ws-client';
import { HTTPFallbackPoller } from './http-fallback';
import { EventName } from '../config';

type EventHandler = (event: WSEvent) => void | Promise<void>;

export class BattleEventSubscriber {
  private ws: BattleRevenueWSClient;
  private fallback: HTTPFallbackPoller;
  private handlers: Map<EventName, Set<EventHandler>> = new Map();
  private seenKeys: Set<string> = new Set();
  private fallbackActive = false;
  private wsHealthy = false;

  constructor(opts?: { rpcEndpoint?: string }) {
    this.ws = new BattleRevenueWSClient();
    this.fallback = new HTTPFallbackPoller(opts?.rpcEndpoint);
  }

  /** 注册事件处理 */
  on(eventName: EventName, handler: EventHandler): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler);

    // 同步注册到 WS 和 fallback
    const unsubWs = this.ws.on(eventName, (e) => this.maybeDispatch(e));
    const unsubFb = this.fallback.on(eventName, (e) => this.maybeDispatch(e));

    return () => {
      this.handlers.get(eventName)?.delete(handler);
      unsubWs();
      unsubFb();
    };
  }

  /** 启动订阅 */
  async start(): Promise<void> {
    // 优先启动 fallback（确保不漏事件）
    await this.fallback.start();
    this.fallbackActive = true;
    // 再启动 WS
    try {
      await this.ws.connect();
      this.wsHealthy = true;
      // WS 起来了，暂停 fallback（避免重复）
      this.fallback.stop();
      this.fallbackActive = false;
      console.log('[Subscriber] WS active, fallback paused');
    } catch (err: any) {
      console.error('[Subscriber] WS failed, fallback continues:', err.message);
    }
  }

  stop(): void {
    this.ws.close();
    this.fallback.stop();
  }

  /** 状态查询 */
  status(): { ws: boolean; fallback: boolean } {
    return { ws: this.wsHealthy, fallback: this.fallbackActive };
  }

  private async maybeDispatch(event: WSEvent): Promise<void> {
    const key = `${event.log.transactionHash}:${event.log.logIndex}`;
    if (this.seenKeys.has(key)) return;
    this.seenKeys.add(key);
    // 简单的内存清理：超过 10000 条时清空（防内存泄漏）
    if (this.seenKeys.size > 10_000) {
      this.seenKeys.clear();
    }

    const handlers = this.handlers.get(event.event);
    if (!handlers) return;
    await Promise.all([...handlers].map((h) => Promise.resolve(h(event))));
  }
}
