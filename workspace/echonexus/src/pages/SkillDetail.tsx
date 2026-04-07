import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { 
  SkillExecCard, 
  ShareBreakdown
} from '../components';
import { EchoSkill } from '../types';
import { 
  getPricingDescription, 
  getPricingModelName, 
  shortenAddress,
  calculateUsageRevenue,
  formatPrice
} from '../utils';
import { ethers } from 'ethers';
import { Tag, User, Calendar, BarChart2, ExternalLink, CheckCircle, Shield } from 'lucide-react';

export const SkillDetail: React.FC = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const navigate = useNavigate();
  const skills = useStore(state => state.skills);
  const account = useStore(state => state.account);
  const setSelectedSkill = useStore(state => state.setSelectedSkill);
  const [skill, setSkill] = useState<EchoSkill | null>(null);
  const [isRenting, setIsRenting] = useState(false);

  useEffect(() => {
    const found = skills.find(s => s.tokenId === tokenId);
    setSkill(found || null);
    if (found) {
      setSelectedSkill(found);
    }
  }, [skills, tokenId, setSelectedSkill]);

  const handleRent = async () => {
    if (!account || !skill) return;
    setIsRenting(true);
    // 模拟租赁交易
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRenting(false);
    alert('租赁成功！现在你可以使用这个技能了。');
  };

  if (!skill) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-2">技能未找到</h2>
          <p className="text-gray-600 mb-6">该技能不存在或已被删除</p>
          <button
            onClick={() => navigate('/explore')}
            className="px-6 py-2 bg-primary text-white rounded-lg"
          >
            返回市场
          </button>
        </div>
      </div>
    );
  }

  // 计算收益分配示例
  const sampleAmount = ethers.parseEther('1.0');
  const shares = calculateUsageRevenue(
    sampleAmount,
    skill.owner,
    '0xNodeOpenClaw',
    '0xProtocolEchoNexus',
    '0xEcoFundAddress'
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              {skill.category}
            </span>
            {skill.rentalInfo.isActive && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                <CheckCircle size={14} />
                可使用
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{skill.name}</h1>
          <p className="text-lg text-gray-600">{skill.description}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Execution Card */}
            <SkillExecCard skill={skill} />

            {/* About */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">关于这个技能</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">创建时间</p>
                    <p className="font-medium">
                      {new Date(skill.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">创作者地址</p>
                    <p className="font-medium font-mono">
                      {shortenAddress(skill.owner)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">累计使用</p>
                    <p className="font-medium">{skill.totalUses} 次</p>
                  </div>
                  <div>
                    <p className="text-gray-500">OpenClaw Skill ID</p>
                    <p className="font-medium">
                      {skill.openClawSkillId || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Tag size={20} />
                标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {skill.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">定价信息</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">定价模型</span>
                  <span className="font-medium">{getPricingModelName(skill.rentalInfo.pricing.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">价格</span>
                  <span className="font-bold text-primary text-lg">
                    {getPricingDescription(skill.rentalInfo.pricing)}
                  </span>
                </div>

                {account ? (
                  <button
                    onClick={handleRent}
                    disabled={isRenting}
                    className="w-full mt-4 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isRenting ? '处理中...' : '租赁/使用'}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full mt-4 px-4 py-2 bg-gray-300 text-white rounded-lg cursor-not-allowed"
                  >
                    请先连接钱包
                  </button>
                )}
              </div>
            </div>

            {/* Rights Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield size={20} />
                权利信息
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">允许衍生</span>
                  <span>{skill.derivativeTerms.upfrontFee > 0n ? '是' : '否'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">一次性衍生费</span>
                  <span>{formatPrice(skill.derivativeTerms.upfrontFee)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">衍生版税</span>
                  <span>{skill.derivativeTerms.usageRoyalty}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">允许扩展</span>
                  <span>{skill.extensible ? '是' : '否'}</span>
                </div>
                {skill.extensible && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">最大场景分润</span>
                    <span>{skill.maxSceneRoyalty}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Share Example */}
            <ShareBreakdown 
              shares={shares}
              totalAmount={sampleAmount}
              title="示例收益分配 (1 ETH)"
            />

            {/* Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart2 size={20} />
                统计
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">总使用次数</span>
                  <span className="font-medium">{skill.totalUses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">总收入</span>
                  <span className="font-medium">{formatPrice(skill.totalRevenue)} ETH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
