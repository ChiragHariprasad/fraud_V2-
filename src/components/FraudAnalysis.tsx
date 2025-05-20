import React, { useMemo } from 'react';
import { useTransactions } from '../contexts/TransactionContext';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, PieChart } from 'lucide-react';

const FraudAnalysis: React.FC = () => {
  const { transactions, stats, loading } = useTransactions();

  const fraudMetrics = useMemo(() => {
    if (!transactions.length) return null;

    // Get fraud transactions
    const fraudTxs = transactions.filter(tx => tx.fraud_prediction === 1);
    const legitimateTxs = transactions.filter(tx => tx.fraud_prediction === 0);

    // Average fraud probability
    const avgFraudProb = fraudTxs.reduce((acc, tx) => acc + tx.fraud_probability, 0) / 
                        (fraudTxs.length || 1);

    // Calculate average transaction amounts
    const avgFraudAmount = fraudTxs.reduce((acc, tx) => acc + parseFloat(tx.Amount), 0) / 
                          (fraudTxs.length || 1);
    const avgLegitAmount = legitimateTxs.reduce((acc, tx) => acc + parseFloat(tx.Amount), 0) / 
                          (legitimateTxs.length || 1);

    // Calculate risk trend (compare first half with second half)
    const sortedByTime = [...transactions].sort((a, b) => 
      a.processed_timestamp - b.processed_timestamp
    );
    const midpoint = Math.floor(sortedByTime.length / 2);
    const firstHalf = sortedByTime.slice(0, midpoint);
    const secondHalf = sortedByTime.slice(midpoint);

    const firstHalfFraudRate = firstHalf.filter(tx => tx.fraud_prediction === 1).length / 
                              (firstHalf.length || 1);
    const secondHalfFraudRate = secondHalf.filter(tx => tx.fraud_prediction === 1).length / 
                               (secondHalf.length || 1);
    
    const riskTrend = secondHalfFraudRate - firstHalfFraudRate;
    
    // Common device types in fraudulent transactions
    const deviceTypes: Record<string, number> = {};
    const methods: Record<string, number> = {};

    fraudTxs.forEach(tx => {
      deviceTypes[tx.Device_Type] = (deviceTypes[tx.Device_Type] || 0) + 1;
      methods[tx.Payment_Method] = (methods[tx.Payment_Method] || 0) + 1;
    });

    // Get most common device type and payment method
    const topDeviceType = Object.entries(deviceTypes)
      .sort((a, b) => b[1] - a[1])
      .map(([code]) => {
        const deviceMap: Record<string, string> = {
          '0': 'Mobile',
          '1': 'PC',
          '2': 'Tablet'
        };
        return deviceMap[code] || code;
      })[0] || 'Unknown';

    const topPaymentMethod = Object.entries(methods)
      .sort((a, b) => b[1] - a[1])
      .map(([code]) => {
        const methodMap: Record<string, string> = {
          '0': 'Credit Card',
          '1': 'Debit Card',
          '2': 'UPI',
          '3': 'Net Banking',
          '4': 'Wallet'
        };
        return methodMap[code] || code;
      })[0] || 'Unknown';

    return {
      avgFraudProb,
      avgFraudAmount,
      avgLegitAmount,
      riskTrend,
      topDeviceType,
      topPaymentMethod,
      totalFraudAmount: stats.fraudAmountTotal || 0,
    };
  }, [transactions, stats]);

  if (loading) {
    return (
      <div className="bg-dark-800 rounded-lg shadow-xl overflow-hidden animate-pulse">
        <div className="p-5 border-b border-dark-700">
          <div className="h-5 bg-dark-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-dark-700 rounded w-3/4"></div>
        </div>
        <div className="p-5 space-y-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-dark-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-dark-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-dark-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-800 rounded-lg shadow-xl overflow-hidden animate-fade-in">
      <div className="p-5 border-b border-dark-700">
        <h2 className="text-lg font-semibold text-white mb-1">Fraud Analysis</h2>
        <p className="text-sm text-dark-400">Insights into fraudulent transaction patterns</p>
      </div>
      
      <div className="p-5 space-y-6">
        {/* Fraud detection rate */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-error-700 to-error-900 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-dark-400">Fraud Detection Rate</p>
            <p className="text-xl font-bold text-white">{stats.detectionRate.toFixed(2)}%</p>
          </div>
        </div>
        
        {/* Fraud risk trend */}
        {fraudMetrics && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center">
              {fraudMetrics.riskTrend > 0 ? (
                <TrendingUp className="h-5 w-5 text-white" />
              ) : (
                <TrendingDown className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <p className="text-sm text-dark-400">Fraud Risk Trend</p>
              <div className="flex items-center">
                <p className="text-xl font-bold text-white">
                  {Math.abs(fraudMetrics.riskTrend * 100).toFixed(1)}%
                </p>
                <span className={`text-sm ml-2 ${
                  fraudMetrics.riskTrend > 0 ? 'text-error-400' : 'text-success-400'
                }`}>
                  {fraudMetrics.riskTrend > 0 ? 'Increasing' : 'Decreasing'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Average fraud amount */}
        {fraudMetrics && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-700 to-accent-900 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-400">Avg. Fraud Amount</p>
              <p className="text-xl font-bold text-white">
                ${fraudMetrics.avgFraudAmount.toFixed(2)}
              </p>
              <p className="text-xs text-dark-400">
                vs ${fraudMetrics.avgLegitAmount.toFixed(2)} legitimate
              </p>
            </div>
          </div>
        )}
        
        {/* Most common fraud vector */}
        {fraudMetrics && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary-700 to-secondary-900 flex items-center justify-center">
              <PieChart className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-400">Common Fraud Vector</p>
              <p className="text-md font-bold text-white">
                {fraudMetrics.topPaymentMethod} on {fraudMetrics.topDeviceType}
              </p>
            </div>
          </div>
        )}
        
        {/* Total fraud amount prevented */}
        {fraudMetrics && (
          <div className="mt-8 pt-5 border-t border-dark-700">
            <p className="text-center text-dark-400 mb-1">Total Fraud Amount Detected</p>
            <p className="text-center text-2xl font-bold text-white">
              ${fraudMetrics.totalFraudAmount.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FraudAnalysis;