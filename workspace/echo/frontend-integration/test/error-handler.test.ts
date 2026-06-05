/**
 * v0.8 错误处理单测
 * - ChainError 分类
 * - withRetry 重试
 * - errorMessage 友好提示
 */
import { describe, it, expect, vi } from 'vitest';
import { ChainError, classifyError, withRetry, errorMessage } from '../src/utils/error-handler';

describe('error-handler', () => {
  describe('classifyError', () => {
    it('应该分类 timeout', () => {
      const e = classifyError(new Error('ETIMEDOUT'));
      expect(e.code).toBe('TIMEOUT');
      expect(e.retryable).toBe(true);
    });

    it('应该分类 network', () => {
      const e = classifyError(new Error('ECONNREFUSED'));
      expect(e.code).toBe('RPC_DOWN');
    });

    it('应该分类 invalid', () => {
      const e = classifyError(new Error('CALL_EXCEPTION: invalid battleId'));
      expect(e.code).toBe('INVALID_BATTLE');
      expect(e.retryable).toBe(false);
    });

    it('应该分类 parse', () => {
      const e = classifyError(new Error('JSON parse error'));
      expect(e.code).toBe('PARSE_ERROR');
    });

    it('应该分类 unknown', () => {
      const e = classifyError(new Error('something else'));
      expect(e.code).toBe('UNKNOWN');
    });
  });

  describe('withRetry', () => {
    it('第一次成功', async () => {
      const fn = vi.fn().mockResolvedValue('ok');
      const r = await withRetry(fn);
      expect(r).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('重试 2 次后成功', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValue('ok');
      const r = await withRetry(fn, { retries: 3, delayMs: 10 });
      expect(r).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('non-retryable 立即抛', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('CALL_EXCEPTION invalid'));
      try {
        await withRetry(fn, { retries: 3, delayMs: 10 });
        expect.fail('should have thrown');
      } catch (e: any) {
        expect(e).toBeInstanceOf(ChainError);
        expect(e.code).toBe('INVALID_BATTLE');
      }
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('重试耗尽抛最后错', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('ETIMEDOUT'));
      try {
        await withRetry(fn, { retries: 2, delayMs: 10 });
        expect.fail('should have thrown');
      } catch (e: any) {
        expect(e).toBeInstanceOf(ChainError);
        expect(e.code).toBe('TIMEOUT');
      }
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('errorMessage', () => {
    it('ChainError 友好提示', () => {
      const e = new ChainError('RPC_DOWN', 'RPC 不可达');
      expect(errorMessage(e)).toContain('🌐');
      expect(errorMessage(e)).toContain('RPC 不可达');
    });

    it('普通 Error 提示', () => {
      expect(errorMessage(new Error('test'))).toContain('❓');
    });
  });
});
