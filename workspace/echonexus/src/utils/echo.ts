// ECHO 合约工具函数

import { EchoSkill, PricingInfo, PricingModelType, RevenueShare } from '../types';
import { ethers } from 'ethers';

// 格式化价格显示
export function formatPrice(amount: bigint, decimals: number = 18): string {
  return parseFloat(ethers.formatUnits(amount, decimals)).toFixed(4);
}

// 获取定价模型显示名称
export function getPricingModelName(type: PricingModelType): string {
  const names: Record<PricingModelType, string> = {
    TimesBased: '按次付费',
    DurationBased: '按时长付费',
    Subscription: '订阅制',
    Freemium: '免费+付费',
    Hybrid: '混合模式'
  };
  return names[type];
}

// 获取价格描述
export function getPricingDescription(pricing: PricingInfo): string {
  switch (pricing.type) {
    case 'TimesBased':
      return `${formatPrice(pricing.pricePerUse!)} / 次`;
    case 'DurationBased':
      return `${formatPrice(pricing.pricePerMinute!)} / 分钟`;
    case 'Subscription':
      return `${formatPrice(pricing.pricePerMonth!)} / 月`;
    case 'Freemium':
      return `${pricing.freeUses} 次免费，之后 ${formatPrice(pricing.pricePerUseAfter!)} / 次`;
    case 'Hybrid':
      return `基础 ${formatPrice(pricing.base!)} + 用量 ${formatPrice(pricing.usage!)}`;
    default:
      return '未知定价';
  }
}

// 计算收益分配
// 基于优化后的分成比例：创作者 75% / OpenClaw节点 8% / 协议 12% / 生态基金 5%
export function calculateUsageRevenue(
  totalAmount: bigint, 
  creator: string,
  nodeAddress: string,
  protocolAddress: string,
  fundAddress: string
): RevenueShare[] {
  const shares = [
    { recipient: creator, share: 75 },
    { recipient: nodeAddress, share: 8 },
    { recipient: protocolAddress, share: 12 },
    { recipient: fundAddress, share: 5 }
  ];

  return shares.map(s => ({
    recipient: s.recipient,
    share: s.share,
    amount: (totalAmount * BigInt(s.share)) / 100n
  }));
}

// 计算衍生收益分配
// 一次性衍生费：亲代 70% / 生态 20% / 协议 10%
export function calculateDerivativeUpfrontFee(
  fee: bigint,
  parentCreator: string,
  ecosystemAddress: string,
  protocolAddress: string
): RevenueShare[] {
  return [
    { recipient: parentCreator, share: 70, amount: (fee * 70n) / 100n },
    { recipient: ecosystemAddress, share: 20, amount: (fee * 20n) / 100n },
    { recipient: protocolAddress, share: 10, amount: (fee * 10n) / 100n }
  ];
}

// 计算衍生使用版税
// 衍生品所有者 60% / 亲代累计 30% / 协议 10%
export function calculateDerivativeRoyalty(
  amount: bigint,
  derivativeOwner: string,
  protocolAddress: string,
  parentShares: { tokenId: string; share: number }[]
): RevenueShare[] {
  const result: RevenueShare[] = [];
  let remaining = amount;

  // 亲代分润累计 30%
  let totalParentShare = 0;
  for (const ps of parentShares) {
    const shareAmount = (amount * BigInt(ps.share)) / 100n;
    result.push({
      recipient: ps.tokenId, // 实际应该是对应的owner地址
      share: ps.share,
      amount: shareAmount
    });
    remaining -= shareAmount;
    totalParentShare += ps.share;
  }

  // 确保总共 30%，如果不足补差额给协议
  if (totalParentShare < 30) {
    const diff = 30 - totalParentShare;
    const diffAmount = (amount * BigInt(diff)) / 100n;
    remaining -= diffAmount;
    result.push({
      recipient: protocolAddress,
      share: 10 + diff,
      amount: (amount * BigInt(10 + diff)) / 100n
    });
  } else {
    // 协议拿 10%
    result.push({
      recipient: protocolAddress,
      share: 10,
      amount: (amount * 10n) / 100n
    });
    remaining -= (amount * 10n) / 100n;
  }

  // 衍生品所有者拿剩下的 60% 左右（因为整数除法可能略有差异）
  result.unshift({
    recipient: derivativeOwner,
    share: 100 - (totalParentShare + 10),
    amount: remaining
  });

  return result;
}

// 计算扩展权场景分润
// 资产所有者 75% / 场景受益人 15% / 协议 10%
export function calculateExtensionRevenue(
  amount: bigint,
  owner: string,
  beneficiary: string,
  protocolAddress: string
): RevenueShare[] {
  return [
    { recipient: owner, share: 75, amount: (amount * 75n) / 100n },
    { recipient: beneficiary, share: 15, amount: (amount * 15n) / 100n },
    { recipient: protocolAddress, share: 10, amount: (amount * 10n) / 100n }
  ];
}

// 生成示例技能数据（用于demo）
export function getMockSkills(): EchoSkill[] {
  return [
    {
      tokenId: '1',
      owner: '0x1234567890123456789012345678901234567890',
      name: '法律咨询顾问',
      description: '专业的法律咨询能力，涵盖合同法、公司法、知识产权等领域，为您提供准确的法律建议。',
      category: '法律',
      tags: ['法律', '咨询', '合同'],
      rentalInfo: {
        pricing: {
          type: 'TimesBased',
          pricePerUse: ethers.parseEther('0.5')
        },
        isActive: true
      },
      derivativeTerms: {
        upfrontFee: ethers.parseEther('100'),
        usageRoyalty: 20
      },
      extensible: true,
      maxSceneRoyalty: 15,
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      totalUses: 128,
      totalRevenue: ethers.parseEther('64'),
      openClawSkillId: 'legal-consultant-v1'
    },
    {
      tokenId: '2',
      owner: '0x2345678901234567890123456789012345678901',
      name: '智能合约审计',
      description: '专业的Solidity智能合约安全审计，自动检测常见漏洞和安全问题。',
      category: '区块链',
      tags: ['安全', '审计', '智能合约', 'solidity'],
      rentalInfo: {
        pricing: {
          type: 'TimesBased',
          pricePerUse: ethers.parseEther('2.0')
        },
        isActive: true
      },
      derivativeTerms: {
        upfrontFee: ethers.parseEther('200'),
        usageRoyalty: 15
      },
      extensible: false,
      maxSceneRoyalty: 10,
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      totalUses: 42,
      totalRevenue: ethers.parseEther('84'),
      openClawSkillId: 'smart-contract-audit'
    },
    {
      tokenId: '3',
      owner: '0x3456789012345678901234567890123456789012',
      name: '前端React组件生成',
      description: '根据需求描述自动生成高质量的React组件代码，支持TypeScript和Tailwind CSS。',
      category: '开发',
      tags: ['react', '前端', '代码生成', 'typescript'],
      rentalInfo: {
        pricing: {
          type: 'Freemium',
          freeUses: 5,
          pricePerUseAfter: ethers.parseEther('0.1')
        },
        isActive: true
      },
      derivativeTerms: {
        upfrontFee: ethers.parseEther('50'),
        usageRoyalty: 25
      },
      extensible: true,
      maxSceneRoyalty: 20,
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      totalUses: 256,
      totalRevenue: ethers.parseEther('25.1'),
      openClawSkillId: 'react-component-generator'
    },
    {
      tokenId: '4',
      owner: '0x4567890123456789012345678901234567890123',
      name: '医学文献综述',
      description: '针对特定医学主题，自动检索最新文献并生成结构化综述。',
      category: '医疗',
      tags: ['医学', '文献', '综述', '科研'],
      rentalInfo: {
        pricing: {
          type: 'Subscription',
          pricePerMonth: ethers.parseEther('10.0'),
          features: ['无限次使用', 'PDF导出', '引用格式生成']
        },
        isActive: true
      },
      derivativeTerms: {
        upfrontFee: ethers.parseEther('150'),
        usageRoyalty: 10
      },
      extensible: true,
      maxSceneRoyalty: 15,
      createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      totalUses: 89,
      totalRevenue: ethers.parseEther('890'),
      openClawSkillId: 'medical-literature-review'
    }
  ];
}

// 短地址显示
export function shortenAddress(address: string, length: number = 4): string {
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}
