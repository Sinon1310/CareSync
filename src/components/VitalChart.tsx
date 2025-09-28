import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { VitalReading } from '../lib/supabase'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface VitalChartProps {
  readings: VitalReading[]
}

const VitalChart: React.FC<VitalChartProps> = ({ readings }) => {
  // Get last 7 days of readings
  const last7Days = readings.slice(0, 7).reverse()

  // Prepare data for different vital types
  const heartRateData = last7Days
    .filter(r => r.type === 'heart_rate')
    .map(r => ({
      x: new Date(r.created_at).toLocaleDateString(),
      y: parseInt(r.value)
    }))

  const bloodSugarData = last7Days
    .filter(r => r.type === 'blood_sugar')
    .map(r => ({
      x: new Date(r.created_at).toLocaleDateString(),
      y: parseInt(r.value)
    }))

  const systolicData = last7Days
    .filter(r => r.type === 'blood_pressure')
    .map(r => ({
      x: new Date(r.created_at).toLocaleDateString(),
      y: parseInt(r.value.split('/')[0])
    }))

  const temperatureData = last7Days
    .filter(r => r.type === 'temperature')
    .map(r => ({
      x: new Date(r.created_at).toLocaleDateString(),
      y: parseFloat(r.value)
    }))

  const data = {
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: heartRateData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Blood Sugar (mg/dL)',
        data: bloodSugarData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Systolic BP (mmHg)',
        data: systolicData,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Temperature (°F)',
        data: temperatureData,
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  }

  if (last7Days.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available for chart
      </div>
    )
  }

  return <Line data={data} options={options} />
}

export default VitalChart