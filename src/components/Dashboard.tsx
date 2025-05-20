import React, { useState } from 'react';
import Header from './Header';
import TransactionCounter from './TransactionCounter';
import TransactionList from './TransactionList';
import FraudAnalysis from './FraudAnalysis';
import TransactionCharts from './TransactionCharts';
import FilterBar from './FilterBar';
import { useTransactions } from '../contexts/TransactionContext';

const Dashboard: React.FC = () => {
  const { stats, loading } = useTransactions();
  const [activeFilters, setActiveFilters] = useState({});

  const handleFilterChange = (filters: any) => {
    setActiveFilters(filters);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <FilterBar onFilterChange={handleFilterChange} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <TransactionCounter 
            title="Total Transactions" 
            value={stats.total} 
            icon="database"
            loading={loading}
          />
          <TransactionCounter 
            title="Legitimate Transactions" 
            value={stats.legitimate} 
            icon="check-circle"
            className="bg-gradient-to-br from-success-700 to-success-900"
            loading={loading}
          />
          <TransactionCounter 
            title="Fraudulent Transactions" 
            value={stats.fraud} 
            icon="alert-triangle"
            className="bg-gradient-to-br from-error-700 to-error-900"
            loading={loading}
          />
          <TransactionCounter 
            title="Fraud Detection Rate" 
            value={stats.detectionRate.toFixed(2)} 
            suffix="%"
            icon="percent"
            className="bg-gradient-to-br from-accent-700 to-accent-900"
            loading={loading}
          />
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2">
            <TransactionCharts activeFilters={activeFilters} />
          </div>
          <div>
            <FraudAnalysis />
          </div>
        </div>
        
        <div className="bg-dark-800 rounded-lg shadow-xl overflow-hidden">
          <TransactionList filters={activeFilters} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;