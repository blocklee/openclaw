import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { SkillCard } from '../components';
import { Search, Filter } from 'lucide-react';
import { getMockSkills } from '../utils/echo';

export const Explore: React.FC = () => {
  const skills = useStore(state => state.skills);
  const setSkills = useStore(state => state.setSkills);
  const isLoading = useStore(state => state.isLoading);
  const setIsLoading = useStore(state => state.setIsLoading);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setSkills(getMockSkills());
      setIsLoading(false);
    }, 300);
  }, [setSkills, setIsLoading]);

  const categories = ['all', ...new Set(skills.map(s => s.category))];

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = !searchQuery || 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || skill.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">探索能力市场</h1>
          <p className="text-gray-600">
            发现来自各个领域的高价值 AI 能力，按需付费使用
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索技能名称、描述、标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white"
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c === 'all' ? '全部分类' : c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-500">
            加载中...
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            未找到符合条件的技能
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map(skill => (
              <SkillCard key={skill.tokenId} skill={skill} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-gray-500 text-sm">
          共找到 {filteredSkills.length} 个技能
        </div>
      </div>
    </div>
  );
};
