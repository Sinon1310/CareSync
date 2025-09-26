import React from 'react';

interface VitalReading {
  id: string;
  type: 'blood_pressure' | 'blood_sugar' | 'heart_rate';
  value: string;
  timestamp: Date;
  status: 'normal' | 'warning' | 'critical';
}

interface VitalChartProps {
  readings: VitalReading[];
}

const VitalChart: React.FC<VitalChartProps> = ({ readings }) => {
  // Simple chart implementation using CSS and divs
  const chartData = readings.slice(0, 7).reverse(); // Last 7 readings
  
  const getChartValue = (reading: VitalReading) => {
    switch (reading.type) {
      case 'blood_pressure':
        // Extract systolic value for chart
        const systolic = parseInt(reading.value.split('/')[0]);
        return Math.min(Math.max((systolic - 80) / 80 * 100, 10), 100);
      case 'blood_sugar':
        const sugar = parseInt(reading.value);
        return Math.min(Math.max((sugar - 70) / 100 * 100, 10), 100);
      case 'heart_rate':
        const hr = parseInt(reading.value);
        return Math.min(Math.max((hr - 50) / 50 * 100, 10), 100);
      default:
        return 50;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            📊
          </div>
          <p>No data available for chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <div className="flex items-end justify-between h-48 px-4 py-2 bg-gray-50 rounded-lg">
        {chartData.map((reading, index) => {
          const height = getChartValue(reading);
          return (
            <div key={reading.id} className="flex flex-col items-center space-y-2">
              <div className="text-xs text-gray-600 font-medium">
                {reading.value}
              </div>
              <div
                className={`w-8 rounded-t transition-all duration-300 hover:opacity-80 ${getStatusColor(reading.status)}`}
                style={{ height: `${height}%` }}
                title={`${reading.type}: ${reading.value} - ${reading.status}`}
              />
              <div className="text-xs text-gray-500">
                {reading.timestamp.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 flex justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-600">Normal</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-gray-600">Warning</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-600">Critical</span>
        </div>
      </div>
    </div>
  );
};

export default VitalChart;