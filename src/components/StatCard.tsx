import React from 'react';
import { Stethoscope, Heart, Activity, Thermometer, Calendar, User } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: 'stethoscope' | 'heart' | 'activity' | 'thermometer' | 'calendar' | 'user';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon,
  color = 'blue'
}) => {
  const icons = {
    stethoscope: Stethoscope,
    heart: Heart,
    activity: Activity,
    thermometer: Thermometer,
    calendar: Calendar,
    user: User
  };

  const colors = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      border: 'border-green-200'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      border: 'border-red-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      border: 'border-purple-200'
    },
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
      border: 'border-indigo-200'
    }
  };

  const changeColors = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-gray-600'
  };

  const Icon = icons[icon];
  const colorConfig = colors[color];

  return (
    <div className={`
      bg-white rounded-lg border ${colorConfig.border} p-6 shadow-sm hover:shadow-md transition-shadow
    `}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-xs ${changeColors[changeType]} mt-1`}>
              {change}
            </p>
          )}
        </div>
        <div className={`
          w-12 h-12 ${colorConfig.bg} rounded-lg flex items-center justify-center
        `}>
          <Icon className={`h-6 w-6 ${colorConfig.icon}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
