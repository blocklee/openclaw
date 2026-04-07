import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { SkillCard } from '../components';
import { getMockSkills } from '../utils/echo';
import { ArrowRight, Zap, Shield, DollarSign, Network } from 'lucide-react';

export const Home: React.FC = () => {
  const skills = useStore(state => state.skills);
  const setSkills = useStore(state => state.setSkills);
  const isLoading = useStore(state => state.isLoading);
  const setIsLoading = useStore(state => state.setIsLoading);

  useEffect(() => {
    setIsLoading(true);
    // 模拟加载，实际会从链上+索引获取
    setTimeout(() => {
      setSkills(getMockSkills());
      setIsLoading(false);
    }, 500);
  }, [setSkills, setIsLoading]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 to-purple-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-secondary text-gradient mb-6">
            EchoNexus
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI Agent 能力资产化协议
          </p>
          <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
            将 AI Agent 的 Skills/Knowledge 转化为可交易的链上资产，实现<br/>
            <span className="font-semibold">"能力即资产，调用即分润"</span> 的原生 AI 经济体系。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/explore"
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all transform hover:-translate-y-1 shadow-lg shadow-primary/20"
            >
              探索能力市场
            </Link>
            <Link
              to="/create"
              className="px-6 py-3 bg-white border border-gray-300 hover:border-primary hover:text-primary rounded-lg font-medium transition-all transform hover:-translate-y-1 shadow-md"
            >
              创建你的技能 <ArrowRight size={16} className="inline ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">核心特点</h2>
            <p className="text-lg text-gray-600">
              基于 ECHO 四权分离协议，结合 OpenClaw Agent 执行引擎
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-primary mb-4">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2">能力资产化</h3>
              <p className="text-gray-600 text-sm">
                将 Skill/知识库转化为链上 NFT，四权分离清晰界定所有者、使用者、衍生者各方权利。
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-primary mb-4">
                <DollarSign size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2">自动分润</h3>
              <p className="text-gray-600 text-sm">
                每次调用自动触发分润，原创者、衍生者、平台按智能合约约定自动获得收益。
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-primary mb-4">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2">权限可控</h3>
              <p className="text-gray-600 text-sm">
                基于智能合约的自动化权限控制，支持按次、按时长、订阅等多种授权模式。
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-primary mb-4">
                <Network size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2">生态开放</h3>
              <p className="text-gray-600 text-sm">
                与 OpenClaw 深度整合，任何人都可以接入生态，共享网络效应。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Skills */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">精选技能</h2>
            <p className="text-lg text-gray-600">
              探索已经上线的高价值 AI 能力
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-10 text-gray-500">加载中...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {skills.slice(0, 4).map((skill) => (
                <SkillCard key={skill.tokenId} skill={skill} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to="/explore"
              className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
            >
              查看全部 <ArrowRight size={16} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">架构设计</h2>
            <p className="text-lg text-gray-600">
              四层架构设计：用户层 + Hub调度层 + ECHO合约层 + OpenClaw执行层
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 overflow-x-auto">
            <pre className="text-xs md:text-sm leading-relaxed">
{`┌─────────────────────────────────────────────────────────────────┐
│                       用户交互层 (Frontend)                      │
│  - DApp 市场  - 创作者工作台  - 消费者控制台  - 开发者面板       │
├─────────────────────────────────────────────────────────────────┤
│                    EchoNexus Hub 调度层                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐  │
│  │ 能力路由    │ │ 权限裁决    │ │ 计费结算    │ │ 能力注册   │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐  │
│  │ 语义索引    │ │ 使用追踪    │ │ 分润引擎    │ │ 事件通知   │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   ECHO 合约层    │  │   索引层(IPFS)  │  │ OpenClaw 执行层 │
│  - 资产存证      │  │  - 元数据索引   │  │  - Agent 运行   │
│  - 权限管理      │  │  - 语义向量    │  │  - Skill 调用   │
│  - 自动分润      │  │  - 能力发现    │  │  - 结果返回     │
│  - 事件日志      │  │  - 推荐引擎    │  │  - 沙箱隔离     │
└──────────────────┘  └──────────────────┘  └──────────────────┘`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
};
