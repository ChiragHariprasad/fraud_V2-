import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { useTransactions } from '../contexts/TransactionContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TransactionChartsProps {
  activeFilters?: any;
}

const TransactionCharts: React.FC<TransactionChartsProps> = ({ activeFilters = {} }) => {
  const { transactions, loading } = useTransactions();
  const [timeFrame, setTimeFrame] = useState<'hourly' | 'daily' | 'weekly'>('hourly');

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            family: 'Inter',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.7)',
        borderColor: 'rgba(100, 116, 139, 0.3)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        bodyFont: {
          family: 'Inter',
        },
        titleFont: {
          family: 'Inter',
          weight: 'bold',
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(30, 41, 59, 0.5)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            family: 'Inter',
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(30, 41, 59, 0.5)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            family: 'Inter',
          },
        },
      },
    },
  };

  // Process transactions to get data for charts
  const getChartData = () => {
    if (!transactions.length) {
      return {
        volumeData: null,
        paymentMethodData: null,
        hourlyPatternData: null,
      };
    }

    // Group transactions by time periods
    const groupedByTime: Record<string, any[]> = {};
    const fraudByTime: Record<string, number> = {};
    const legitimateByTime: Record<string, number> = {};
    
    transactions.forEach(tx => {
      const date = new Date(tx.processed_timestamp * 1000);
      let timeKey;
      
      if (timeFrame === 'hourly') {
        timeKey = `${date.getHours()}:00`;
      } else if (timeFrame === 'daily') {
        timeKey = date.toLocaleDateString();
      } else {
        // Weekly - group by day of week
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        timeKey = days[date.getDay()];
      }
      
      if (!groupedByTime[timeKey]) {
        groupedByTime[timeKey] = [];
        fraudByTime[timeKey] = 0;
        legitimateByTime[timeKey] = 0;
      }
      
      groupedByTime[timeKey].push(tx);
      
      if (tx.fraud_prediction === 1) {
        fraudByTime[timeKey]++;
      } else {
        legitimateByTime[timeKey]++;
      }
    });
    
    // Sort time periods
    let sortedTimeKeys;
    if (timeFrame === 'hourly') {
      sortedTimeKeys = Object.keys(groupedByTime).sort((a, b) => {
        return parseInt(a) - parseInt(b);
      });
    } else if (timeFrame === 'daily') {
      sortedTimeKeys = Object.keys(groupedByTime).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
      });
    } else {
      // Weekly - sort by day of week
      const dayOrder = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
      sortedTimeKeys = Object.keys(groupedByTime).sort((a, b) => {
        return dayOrder[a as keyof typeof dayOrder] - dayOrder[b as keyof typeof dayOrder];
      });
    }

    // Transaction volume over time (line chart)
    const volumeData = {
      labels: sortedTimeKeys,
      datasets: [
        {
          label: 'Legitimate Transactions',
          data: sortedTimeKeys.map(key => legitimateByTime[key]),
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Fraudulent Transactions',
          data: sortedTimeKeys.map(key => fraudByTime[key]),
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          tension: 0.4,
          fill: true,
        }
      ]
    };

    // Payment method distribution (pie chart)
    const paymentMethods: Record<string, number> = {};
    transactions.forEach(tx => {
      const methodCode = tx.Payment_Method;
      if (!paymentMethods[methodCode]) {
        paymentMethods[methodCode] = 0;
      }
      paymentMethods[methodCode]++;
    });

    const methodLabels: Record<string, string> = {
      '0': 'Credit Card',
      '1': 'Debit Card',
      '2': 'UPI',
      '3': 'Net Banking',
      '4': 'Wallet'
    };

    const paymentMethodData = {
      labels: Object.keys(paymentMethods).map(code => methodLabels[code] || code),
      datasets: [
        {
          data: Object.values(paymentMethods),
          backgroundColor: [
            'rgba(14, 165, 233, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
          ],
          borderColor: [
            'rgba(14, 165, 233, 1)',
            'rgba(249, 115, 22, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };

    // Transaction patterns (bar chart)
    const hourlyData: Record<string, number> = {};
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    
    hours.forEach(hour => {
      hourlyData[hour] = 0;
    });

    transactions.forEach(tx => {
      const date = new Date(tx.processed_timestamp * 1000);
      const hour = `${date.getHours()}:00`;
      hourlyData[hour]++;
    });

    const hourlyPatternData = {
      labels: hours,
      datasets: [
        {
          label: 'Transactions',
          data: hours.map(hour => hourlyData[hour]),
          backgroundColor: 'rgba(6, 182, 212, 0.7)',
          borderColor: 'rgba(6, 182, 212, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };

    return {
      volumeData,
      paymentMethodData,
      hourlyPatternData,
    };
  };

  const { volumeData, paymentMethodData, hourlyPatternData } = getChartData();

  return (
    <div className="bg-dark-800 rounded-lg shadow-xl p-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        <h2 className="text-lg font-semibold text-white">Transaction Analytics</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeFrame('hourly')}
            className={`px-3 py-1 text-sm rounded-md ${
              timeFrame === 'hourly'
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-white hover:bg-dark-600'
            }`}
          >
            Hourly
          </button>
          <button
            onClick={() => setTimeFrame('daily')}
            className={`px-3 py-1 text-sm rounded-md ${
              timeFrame === 'daily'
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-white hover:bg-dark-600'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeFrame('weekly')}
            className={`px-3 py-1 text-sm rounded-md ${
              timeFrame === 'weekly'
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-white hover:bg-dark-600'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Volume Over Time Chart */}
        <div className="bg-dark-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-dark-400 mb-3">Transaction Volume Over Time</h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : volumeData ? (
              <Line data={volumeData} options={chartOptions} />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-dark-400">No data available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Hourly Transaction Patterns */}
        <div className="bg-dark-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-dark-400 mb-3">Hourly Transaction Patterns</h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : hourlyPatternData ? (
              <Bar data={hourlyPatternData} options={chartOptions} />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-dark-400">No data available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Payment Method Distribution */}
        <div className="bg-dark-700 rounded-lg p-4 lg:col-span-2">
          <h3 className="text-sm font-medium text-dark-400 mb-3">Payment Method Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            {loading ? (
              <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            ) : paymentMethodData ? (
              <div className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4 mx-auto">
                <Pie data={paymentMethodData} options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      ...chartOptions.plugins.legend,
                      position: 'right'
                    }
                  }
                }} />
              </div>
            ) : (
              <p className="text-dark-400">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionCharts;