import React from 'react';
import { Link } from 'react-router-dom';
import { EchoSkill } from '../types';
import { getPricingDescription, shortenAddress } from '../utils';
import { User, Tag } from 'lucide-react';

interface SkillCardProps {
  skill: EchoSkill;
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill }) => {
  return (
    <Link to={`/skill/${skill.tokenId}`}>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all transform hover:-translate-y-1 cursor-pointer h-full flex flex-col">
        <div className="h-36 bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
          <div className="text-center px-4">
            <h3 className="text-xl font-semibold mb-2">{skill.name}</h3>
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">
              {skill.category}
            </span>
          </div>
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {skill.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {skill.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
            {skill.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                +{skill.tags.length - 3}
              </span>
            )}
          </div>

          <div className="mt-auto space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">定价</span>
              <span className="font-medium text-primary">
                {getPricingDescription(skill.rentalInfo.pricing)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">累计使用</span>
              <span className="text-gray-900">{skill.totalUses} 次</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">创作者</span>
              <span className="text-gray-900 font-mono">
                {shortenAddress(skill.owner, 3)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
