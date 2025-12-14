import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend: 'up' | 'down' | 'neutral';
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, trend, color }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-600'}`}>
            {change}
          </span>
          <span className="text-slate-400 ml-2">จากเดือนก่อน</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;