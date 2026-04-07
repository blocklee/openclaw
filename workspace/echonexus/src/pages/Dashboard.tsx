import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { RevenueChart, UsageChart } from '../components';
import { formatPrice } from '../utils';
import { Wallet, TrendingUp, Zap, Calendar } from 'lucide-react';
import { ethers } from 'ethers';

// 生成示例图表数据
const generateChartData = () => {
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      revenue: Math.random() * 5 + 0.5,
      uses: Math.floor(Math.random() * 20 + 1),
    });
  }
  return data;
};

export const Dashboard: React.FC = () => {
  const account = useStore(state => state.account);
  const skills = useStore(state => state.skills);
  const myRentedSkills = useStore(state => state.myRentedSkills);

  const mySkills = useMemo(() => {
    if (!account) return [];
    return skills.filter(s => s.owner.toLowerCase() === account.toLowerCase());
  }, [skills, account]);

  const stats = useMemo(() => {
    const myCreated = mySkills.length;
    const myRentedCount = myRentedSkills.length;
    const totalRevenue = mySkills.reduce((sum, s) => sum + s.totalRevenue, 0n);
    const totalUses = mySkills.reduce((sum, s) => sum + s.totalUses, 0);
    return { myCreated, myRentedCount, totalRevenue, totalUses };
  }, [mySkills, myRentedSkills]);

  const chartData = useMemo(() => generateChartData(), []);

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">请先连接钱包</h2>
          <p className="text-yellow-700 mb-4">
            连接钱包后才能查看你的控制台
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">控制台</h1>
          <p className="text-gray-600">
            管理你的技能资产和收益
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">我创建的</p>
                <p className="text-3xl font-bold">{stats.myCreated}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Zap size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">我租赁的</p>
                <p className="text-3xl font-bold">{stats.myRentedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <Wallet size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">总收益</p>
                <p className="text-3xl font-bold text-primary">{formatPrice(stats.totalRevenue)}</p>
                <p className="text-xs text-gray-500">ETH</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">总使用次数</p>
                <p className="text-3xl font-bold">{stats.totalUses}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <Calendar size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">收益趋势 (30天)</h3>
            <RevenueChart data={chartData} />
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">使用量趋势 (30天)</h3>
            <UsageChart data={chartData} />
          </div>
        </div>

        {/* My Created Skills */}
        {mySkills.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold mb-4">我创建的技能</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-600">名称</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">分类</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">使用次数</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">收益</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {mySkills.map((skill) => (
                    <tr key={skill.tokenId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <Link to={`/skill/${skill.tokenId}`} className="font-medium text-primary hover:underline">
                          {skill.name}
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-right">{skill.category}</td>
                      <td className="py-3 px-2 text-right">{skill.totalUses}</td>
                      <td className="py-3 px-2 text-right font-medium text-green-600">
                        {formatPrice(skill.totalRevenue)} ETH
                      </td>
                      <td className="py-3 px-2 text-right text-gray-500">
                        {new Date(skill.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">快速操作</h3>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/create"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
            >
              创建新技能
            </Link>
            <Link
              to="/explore"
              className="px-4 py-2 bg-white border border-gray-300 hover:border-primary hover:text-primary rounded-lg transition-colors"
            >
              探索市场
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
