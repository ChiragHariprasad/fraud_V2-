import React from 'react';
import { BarChart4, ShieldAlert, RefreshCw } from 'lucide-react';
import { useTransactions } from '../contexts/TransactionContext';

const Header: React.FC = () => {
  const { fetchTransactions, fetchStats } = useTransactions();
  
  const refreshData = () => {
    fetchTransactions();
    fetchStats();
  };

  return (
    <header className="bg-dark-800 border-b border-dark-700 py-4 px-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-primary-500 p-2 rounded-lg">
            <BarChart4 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">TransactionShield</h1>
            <p className="text-sm text-dark-400">Real-time Transaction Monitoring</p>
          </div>
        </div>
        
        <div className="flex space-x-6 items-center">
          <div className="flex items-center space-x-2 text-success-400">
            <div className="relative">
              <div className="absolute inset-0 bg-success-400 rounded-full animate-ping opacity-50" style={{ animationDuration: '3s' }}></div>
              <div className="relative w-2 h-2 bg-success-400 rounded-full"></div>
            </div>
            <span className="text-sm">Live Monitoring</span>
          </div>
          
          <div className="flex items-center space-x-2 bg-dark-700 hover:bg-dark-600 transition-colors p-2 rounded-lg cursor-pointer" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 text-primary-400" />
            <span className="text-sm">Refresh</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-2 bg-dark-700 p-2 rounded-lg">
            <ShieldAlert className="h-4 w-4 text-accent-400" />
            <span className="text-sm">Fraud Monitor v1.0</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;