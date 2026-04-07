import React, { useState } from 'react';
import { EchoSkill } from '../types';
import { useStore } from '../store';
import { executeOpenClawSkill } from '../utils/openclaw';
import { Play, Loader2 } from 'lucide-react';

interface SkillExecCardProps {
  skill: EchoSkill;
}

export const SkillExecCard: React.FC<SkillExecCardProps> = ({ skill }) => {
  const account = useStore(state => state.account);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!account) {
      setError('请先连接钱包');
      return;
    }
    if (!input.trim()) {
      setError('请输入问题');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setResult(null);

    try {
      const response = await executeOpenClawSkill(
        skill,
        { query: input },
        account
      );

      if (response.success && response.result) {
        setResult(response.result.output);
      } else {
        setError(response.error || '执行失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '执行出错');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Play size={20} className="text-primary" />
        立即测试
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            输入你的请求
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例如：帮我审查这份智能合约..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[100px]"
            disabled={isExecuting}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              执行结果
            </label>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg whitespace-pre-wrap text-sm text-gray-800">
              {result}
            </div>
          </div>
        )}

        <button
          onClick={handleExecute}
          disabled={isExecuting || !account}
          className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isExecuting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              执行中...
            </>
          ) : (
            <>
              <Play size={16} />
              执行 Skill
            </>
          )}
        </button>

        {!account && (
          <p className="text-sm text-gray-500 text-center">
            请先连接钱包才能执行
          </p>
        )}
      </div>
    </div>
  );
};
