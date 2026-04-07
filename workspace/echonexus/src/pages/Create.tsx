import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { EchoSkill, PricingModelType, PricingInfo, DerivativeTerms } from '../types';
import { ethers } from 'ethers';
import { Plus, Trash2 } from 'lucide-react';

export const Create: React.FC = () => {
  const navigate = useNavigate();
  const account = useStore(state => state.account);
  const addSkill = useStore(state => state.addSkill);
  const setIsLoading = useStore(state => state.setIsLoading);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    openClawSkillId: '',
    tags: '',
    pricingModel: 'TimesBased' as PricingModelType,
    pricePerUse: '',
    pricePerMinute: '',
    minMinutes: '1',
    pricePerMonth: '',
    freeUses: '5',
    pricePerUseAfter: '',
  });

  const [derivativeTerms, setDerivativeTerms] = useState({
    upfrontFee: '',
    usageRoyalty: '20',
  });

  const [extensible, setExtensible] = useState(true);
  const [maxSceneRoyalty, setMaxSceneRoyalty] = useState('15');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      alert('请先连接钱包');
      return;
    }

    setIsLoading(true);

    try {
      // 构建定价信息
      const pricing: PricingInfo = {
        type: formData.pricingModel,
      };

      switch (formData.pricingModel) {
        case 'TimesBased':
          pricing.pricePerUse = ethers.parseEther(formData.pricePerUse);
          break;
        case 'DurationBased':
          pricing.pricePerMinute = ethers.parseEther(formData.pricePerMinute);
          pricing.minMinutes = parseInt(formData.minMinutes);
          break;
        case 'Subscription':
          pricing.pricePerMonth = ethers.parseEther(formData.pricePerMonth);
          break;
        case 'Freemium':
          pricing.freeUses = parseInt(formData.freeUses);
          pricing.pricePerUseAfter = ethers.parseEther(formData.pricePerUseAfter);
          break;
        case 'Hybrid':
          // pricing.base = ethers.parseEther(formData.)
          break;
      }

      // 构建衍生条款
      const derivTerms: DerivativeTerms = {
        upfrontFee: ethers.parseEther(derivativeTerms.upfrontFee || '0'),
        usageRoyalty: parseInt(derivativeTerms.usageRoyalty),
      };

      // 创建新技能对象
      const newSkill: EchoSkill = {
        tokenId: Date.now().toString(), // 在实际中由合约生成
        owner: account,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        rentalInfo: {
          pricing,
          isActive: true,
        },
        derivativeTerms: derivTerms,
        extensible,
        maxSceneRoyalty: parseInt(maxSceneRoyalty),
        createdAt: Date.now(),
        totalUses: 0,
        totalRevenue: 0n,
        openClawSkillId: formData.openClawSkillId,
      };

      // 模拟链上mint
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 添加到列表
      addSkill(newSkill);

      // 跳转到详情页
      navigate(`/skill/${newSkill.tokenId}`);
    } catch (error) {
      console.error(error);
      alert('创建失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">请先连接钱包</h2>
          <p className="text-yellow-700">
            连接钱包后才能创建技能资产
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">创建技能资产</h1>
          <p className="text-gray-600">
            将你的 AI Skill 转化为链上资产，设置定价和授权规则，开始获得收益
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">基础信息</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  技能名称
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  placeholder="例如：专业法律咨询顾问"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  技能描述
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[100px]"
                  placeholder="描述这个技能能做什么，解决什么问题..."
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分类
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    placeholder="例如：法律、开发、医疗"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OpenClaw Skill ID
                  </label>
                  <input
                    type="text"
                    value={formData.openClawSkillId}
                    onChange={(e) => setFormData({ ...formData, openClawSkillId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    placeholder="对应 OpenClaw 中 Skill 的 ID"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签（逗号分隔）
                </label>
                <input
                  type="text"
                  required
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  placeholder="法律,咨询,合同"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">定价模型</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  定价类型
                </label>
                <select
                  value={formData.pricingModel}
                  onChange={(e) => setFormData({ ...formData, pricingModel: e.target.value as PricingModelType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  <option value="TimesBased">按次付费</option>
                  <option value="DurationBased">按时长付费</option>
                  <option value="Subscription">订阅制</option>
                  <option value="Freemium">免费+超出付费</option>
                  <option value="Hybrid">混合模式</option>
                </select>
              </div>

              {formData.pricingModel === 'TimesBased' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    单次价格 (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.pricePerUse}
                    onChange={(e) => setFormData({ ...formData, pricePerUse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    placeholder="0.5"
                  />
                </div>
              )}

              {formData.pricingModel === 'DurationBased' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      每分钟价格 (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={formData.pricePerMinute}
                      onChange={(e) => setFormData({ ...formData, pricePerMinute: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      placeholder="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最低分钟数
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.minMinutes}
                      onChange={(e) => setFormData({ ...formData, minMinutes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      placeholder="1"
                    />
                  </div>
                </>
              )}

              {formData.pricingModel === 'Subscription' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    每月价格 (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.pricePerMonth}
                    onChange={(e) => setFormData({ ...formData, pricePerMonth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    placeholder="10"
                  />
                </div>
              )}

              {formData.pricingModel === 'Freemium' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      免费次数
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.freeUses}
                      onChange={(e) => setFormData({ ...formData, freeUses: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      超出后单次价格 (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={formData.pricePerUseAfter}
                      onChange={(e) => setFormData({ ...formData, pricePerUseAfter: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      placeholder="0.1"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Derivative Terms */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">衍生权设置</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  一次性衍生费 (ETH)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={derivativeTerms.upfrontFee}
                  onChange={(e) => setDerivativeTerms({ ...derivativeTerms, upfrontFee: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  placeholder="100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  创建衍生品需要支付的一次性费用
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  使用版税百分比 (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={derivativeTerms.usageRoyalty}
                  onChange={(e) => setDerivativeTerms({ ...derivativeTerms, usageRoyalty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  placeholder="20"
                />
                <p className="text-sm text-gray-500 mt-1">
                  衍生品每次使用时，需要向你支付的版税百分比
                </p>
              </div>
            </div>
          </div>

          {/* Extension Settings */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">扩展权设置</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="extensible"
                  checked={extensible}
                  onChange={(e) => setExtensible(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="extensible" className="ml-2 block text-sm text-gray-700">
                  允许跨场景扩展授权
                </label>
              </div>
              {extensible && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    场景最高分润百分比 (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={maxSceneRoyalty}
                    onChange={(e) => setMaxSceneRoyalty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    placeholder="15"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    场景运营者可以获得的最高分润比例
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
            >
              创建并 Mint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
