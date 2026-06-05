/**
 * v0.7 错误处理工具
 * - RPC 失败 fallback
 * - 友好错误提示
 * - 重试机制
 */

export class ChainError extends Error {
  constructor(
    public code: 'RPC_DOWN' | 'INVALID_BATTLE' | 'TIMEOUT' | 'PARSE_ERROR' | 'UNKNOWN',
    message: string,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'ChainError';
  }
}

export function classifyError(e: any): ChainError {
  const msg = (e?.message || e?.toString() || '').toLowerCase();
  if (msg.includes('timeout') || msg.includes('etimedout')) {
    return new ChainError('TIMEOUT', 'RPC 超时 (10s)', true);
  }
  if (msg.includes('network') || msg.includes('econnrefused') || msg.includes('enotfound')) {
    return new ChainError('RPC_DOWN', 'RPC 不可达', true);
  }
  if (msg.includes('invalid') || msg.includes('call_exception')) {
    return new ChainError('INVALID_BATTLE', '无效 battleId 或合约调用', false);
  }
  if (msg.includes('parse') || msg.includes('json')) {
    return new ChainError('PARSE_ERROR', 'JSON 解析失败', true);
  }
  return new ChainError('UNKNOWN', e?.message || '未知错误', true);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delayMs?: number; onRetry?: (n: number, err: ChainError) => void } = {}
): Promise<T> {
  const { retries = 3, delayMs = 1000, onRetry } = options;
  let lastErr: ChainError | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = classifyError(e);
      if (!lastErr.retryable || i === retries - 1) throw lastErr;
      onRetry?.(i + 1, lastErr);
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr!;
}

export function errorMessage(e: any): string {
  if (e instanceof ChainError) {
    const icon = e.code === 'RPC_DOWN' ? '🌐' : e.code === 'TIMEOUT' ? '⏱' : e.code === 'INVALID_BATTLE' ? '❌' : '⚠️';
    return `${icon} ${e.code}: ${e.message}`;
  }
  return `❓ ${e?.message || '未知错误'}`;
}
