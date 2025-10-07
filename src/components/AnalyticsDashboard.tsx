import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  BarChart3,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, subDays, parseISO } from 'date-fns';

interface VitalReading {
  id: string;
  user_id: string;
  type: string;
  value: string;
  status: 'normal' | 'warning' | 'critical';
  recorded_at: string;
}

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [vitalReadings, setVitalReadings] = useState<VitalReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('30d');

  useEffect(() => {
    if (!user?.id) return;
    loadAnalyticsData();
  }, [user?.id, timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const daysMap = { '7d': 7, '30d': 30 };
      const startDate = subDays(new Date(), daysMap[timeRange]).toISOString();
      
      const { data: readings } = await supabase
        .from('vital_readings')
        .select('*')
        .gte('recorded_at', startDate)
        .order('recorded_at', { ascending: true });
      
      setVitalReadings(readings || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalReadings = vitalReadings.length;
  const criticalReadings = vitalReadings.filter(r => r.status === 'critical').length;
  const warningReadings = vitalReadings.filter(r => r.status === 'warning').length;
  const normalReadings = vitalReadings.filter(r => r.status === 'normal').length;

  // Prepare chart data
  const chartData = vitalReadings
    .filter(r => r.type === 'heart_rate')
    .slice(-7)
    .map(reading => ({
      date: format(parseISO(reading.recorded_at), 'MM/dd'),
      heart_rate: parseInt(reading.value)
    }));

  const statusData = [
    { name: 'Normal', value: normalReadings, color: '#10B981' },
    { name: 'Warning', value: warningReadings, color: '#F59E0B' },
    { name: 'Critical', value: criticalReadings, color: '#EF4444' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive health insights and data visualization</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 text-sm font-medium bg-transparent border-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="7d">📅 Last 7 days</option>
              <option value="30d">📅 Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Readings</p>
                <p className="text-2xl font-bold text-gray-900">{totalReadings}</p>
                <p className="text-xs text-gray-500 mt-1">All time data</p>
              </div>
            </div>
            <div className="text-blue-600">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-xl">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Normal Status</p>
                <p className="text-2xl font-bold text-green-600">{normalReadings}</p>
                <p className="text-xs text-green-500 mt-1">✓ Healthy range</p>
              </div>
            </div>
            <div className="text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{warningReadings}</p>
                <p className="text-xs text-yellow-500 mt-1">⚠️ Needs attention</p>
              </div>
            </div>
            <div className="text-yellow-600">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-red-100 to-red-200 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{criticalReadings}</p>
                <p className="text-xs text-red-500 mt-1">🚨 Urgent care</p>
              </div>
            </div>
            <div className="text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Heart Rate Trend */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Activity className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Heart Rate Trends</h3>
                <p className="text-sm text-gray-500">BPM over time</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Heart Rate</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="heart_rate" 
                stroke="#EF4444" 
                strokeWidth={3}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#EF4444', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Status Distribution</h3>
                <p className="text-sm text-gray-500">Reading categories</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={40}
                dataKey="value"
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {statusData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legend */}
          <div className="flex justify-center space-x-6 mt-4">
            {statusData.map((entry, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Quick Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total Data Points</p>
            <p className="text-xl font-bold text-blue-600">{totalReadings}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Health Score</p>
            <p className="text-xl font-bold text-green-600">
              {totalReadings > 0 ? Math.round((normalReadings / totalReadings) * 100) : 0}%
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Risk Level</p>
            <p className={`text-xl font-bold ${
              criticalReadings === 0 ? 'text-green-600' : 
              criticalReadings < 3 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {criticalReadings === 0 ? 'Low' : 
               criticalReadings < 3 ? 'Medium' : 'High'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
