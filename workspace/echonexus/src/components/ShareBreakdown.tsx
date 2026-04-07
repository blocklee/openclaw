import React from 'react';
import { RevenueShare } from '../types';
import { formatPrice } from '../utils/echo';

interface ShareBreakdownProps {
  shares: RevenueShare[];
  totalAmount: bigint;
  title?: string;
}

export const ShareBreakdown: React.FC<ShareBreakdownProps> = ({ 
  shares, 
  totalAmount,
  title = '收益分配'
}) => {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
      <h3 className="text-lg font-semibold mb-4 text-primary">{title}</h3>
      <div className="space-y-3">
        {shares.map((share, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">
                {typeof share.recipient === 'string' && share.recipient.startsWith('0x') 
                  ? `${share.recipient.slice(0, 6)}...${share.recipient.slice(-4)}`
                  : share.recipient
                }
              </span>
              <span className="text-sm font-bold text-primary">
                {formatPrice(share.amount)} ({share.share}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${share.share}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-indigo-300">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">总计</span>
          <span className="font-bold text-primary text-lg">
            {formatPrice(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};
