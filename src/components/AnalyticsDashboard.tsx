import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Activity,
  Heart,
  Droplet,
  Target,
  Award,
  CheckCircle
} from 'lucide-react';

interface AnalyticsData {
  patientId: string;
  patientName: string;
  healthScore: number;
  trend: 'improving' | 'stable' | 'declining';
  vitalTrends: {
    bloodPressure: { current: string; trend: 'up' | 'down' | 'stable'; change: string };
    heartRate: { current: string; trend: 'up' | 'down' | 'stable'; change: string };
    bloodSugar: { current: string; trend: 'up' | 'down' | 'stable'; change: string };
  };
  medicationAdherence: number;
  riskFactors: string[];
  lastUpdated: Date;
}

interface AnalyticsDashboardProps {
  patients: Array<{
    id: string;
    name: string;
    email: string;
    status: 'normal' | 'warning' | 'critical';
    latestVitals?: any;
    lastReading?: Date;
  }>;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ patients }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'health' | 'adherence' | 'trends'>('health');

  useEffect(() => {
    generateAnalytics();
  }, [patients]);

  const generateAnalytics = () => {
    const analytics: AnalyticsData[] = patients.map(patient => {
      // Calculate health score (0-100)
      let healthScore = 85; // Base score
      
      if (patient.status === 'critical') healthScore -= 30;
      else if (patient.status === 'warning') healthScore -= 15;
      
      // Determine trend based on latest vitals
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      const riskFactors: string[] = [];
      
      if (patient.latestVitals?.bloodPressure) {
        const [systolic, diastolic] = patient.latestVitals.bloodPressure.split('/').map(Number);
        if (systolic > 140 || diastolic > 90) {
          healthScore -= 10;
          riskFactors.push('Hypertension');
          trend = 'declining';
        }
      }
      
      if (patient.latestVitals?.heartRate) {
        const hr = parseInt(patient.latestVitals.heartRate);
        if (hr > 100) {
          healthScore -= 8;
          riskFactors.push('Tachycardia');
          trend = 'declining';
        }
      }
      
      // Mock medication adherence (in real app, calculate from logs)
      const medicationAdherence = Math.floor(Math.random() * 30) + 70; // 70-100%
      
      if (medicationAdherence < 80) {
        healthScore -= 10;
        riskFactors.push('Poor Medication Adherence');
      }
      
      // Generate mock vital trends
      const vitalTrends = {
        bloodPressure: {
          current: patient.latestVitals?.bloodPressure || 'N/A',
          trend: patient.status === 'critical' ? 'up' as const : 'stable' as const,
          change: patient.status === 'critical' ? '+12%' : '+2%'
        },
        heartRate: {
          current: patient.latestVitals?.heartRate || 'N/A',
          trend: patient.status === 'warning' ? 'up' as const : 'down' as const,
          change: patient.status === 'warning' ? '+8%' : '-3%'
        },
        bloodSugar: {
          current: patient.latestVitals?.bloodSugar || 'N/A',
          trend: 'stable' as const,
          change: '+1%'
        }
      };
      
      return {
        patientId: patient.id,
        patientName: patient.name,
        healthScore: Math.max(0, Math.min(100, healthScore)),
        trend,
        vitalTrends,
        medicationAdherence,
        riskFactors,
        lastUpdated: new Date()
      };
    });
    
    setAnalyticsData(analytics);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getVitalTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const getAdherenceColor = (adherence: number) => {
    if (adherence >= 90) return 'bg-green-500';
    if (adherence >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Calculate summary statistics
  const avgHealthScore = analyticsData.length > 0 
    ? Math.round(analyticsData.reduce((sum, data) => sum + data.healthScore, 0) / analyticsData.length)
    : 0;
    
  const avgAdherence = analyticsData.length > 0
    ? Math.round(analyticsData.reduce((sum, data) => sum + data.medicationAdherence, 0) / analyticsData.length)
    : 0;
    
  const improvingPatients = analyticsData.filter(data => data.trend === 'improving').length;
  const decliningPatients = analyticsData.filter(data => data.trend === 'declining').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Avg Health Score</h3>
              <p className="text-2xl font-bold text-gray-900">{avgHealthScore}/100</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Improving</h3>
              <p className="text-2xl font-bold text-gray-900">{improvingPatients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Declining</h3>
              <p className="text-2xl font-bold text-gray-900">{decliningPatients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Avg Adherence</h3>
              <p className="text-2xl font-bold text-gray-900">{avgAdherence}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Patient Analytics</h2>
              <p className="text-sm text-gray-600">Health trends and medication tracking</p>
            </div>
          </div>
          
          {/* Metric Selector */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedMetric('health')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === 'health'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Health Scores
            </button>
            <button
              onClick={() => setSelectedMetric('adherence')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === 'adherence'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Adherence
            </button>
            <button
              onClick={() => setSelectedMetric('trends')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === 'trends'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Vital Trends
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {analyticsData.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No analytics data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analyticsData.map((data) => (
                <div key={data.patientId} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-gray-900">{data.patientName}</h4>
                      {getTrendIcon(data.trend)}
                      <span className="text-sm text-gray-500 capitalize">{data.trend}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      Last updated: {data.lastUpdated.toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Health Score View */}
                  {selectedMetric === 'health' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getHealthScoreColor(data.healthScore)}`}>
                          {data.healthScore}/100
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Health Score</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-gray-700 mb-2">Risk Factors:</p>
                        {data.riskFactors.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {data.riskFactors.map((factor, index) => (
                              <span key={index} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                {factor}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            No current risk factors
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Adherence View */}
                  {selectedMetric === 'adherence' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Medication Adherence</span>
                        <span className="text-sm font-bold text-gray-900">{data.medicationAdherence}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getAdherenceColor(data.medicationAdherence)}`}
                          style={{ width: `${data.medicationAdherence}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {data.medicationAdherence >= 90 ? 'Excellent compliance' :
                         data.medicationAdherence >= 75 ? 'Good compliance' :
                         'Needs improvement'}
                      </p>
                    </div>
                  )}

                  {/* Vital Trends View */}
                  {selectedMetric === 'trends' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium">Blood Pressure</span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-bold">{data.vitalTrends.bloodPressure.current}</span>
                            {getVitalTrendIcon(data.vitalTrends.bloodPressure.trend)}
                          </div>
                          <span className="text-xs text-gray-500">{data.vitalTrends.bloodPressure.change}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex items-center space-x-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium">Heart Rate</span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-bold">{data.vitalTrends.heartRate.current}</span>
                            {getVitalTrendIcon(data.vitalTrends.heartRate.trend)}
                          </div>
                          <span className="text-xs text-gray-500">{data.vitalTrends.heartRate.change}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex items-center space-x-2">
                          <Droplet className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Blood Sugar</span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-bold">{data.vitalTrends.bloodSugar.current}</span>
                            {getVitalTrendIcon(data.vitalTrends.bloodSugar.trend)}
                          </div>
                          <span className="text-xs text-gray-500">{data.vitalTrends.bloodSugar.change}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
