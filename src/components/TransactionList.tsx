import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Download, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useTransactions } from '../contexts/TransactionContext';
import { format } from 'date-fns';

interface TransactionListProps {
  filters?: any;
}

const TransactionList: React.FC<TransactionListProps> = ({ filters = {} }) => {
  const { transactions, loading } = useTransactions();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('processed_timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    // Apply filters
    let filtered = [...transactions];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter((tx) => 
        tx._id.toLowerCase().includes(searchTerm) ||
        tx.Amount.toString().includes(searchTerm) ||
        tx.Payment_Method?.toString().includes(searchTerm)
      );
    }

    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate).getTime();
      const endDate = new Date(filters.endDate).getTime() + (24 * 60 * 60 * 1000); // Add one day to include end date
      
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.created_at || tx.processed_timestamp * 1000).getTime();
        return txDate >= startDate && txDate <= endDate;
      });
    }

    if (filters.minAmount) {
      filtered = filtered.filter((tx) => parseFloat(tx.Amount) >= parseFloat(filters.minAmount));
    }

    if (filters.maxAmount) {
      filtered = filtered.filter((tx) => parseFloat(tx.Amount) <= parseFloat(filters.maxAmount));
    }

    if (filters.paymentMethod) {
      filtered = filtered.filter((tx) => tx.Payment_Method === filters.paymentMethod);
    }

    if (filters.status) {
      filtered = filtered.filter((tx) => tx.status === filters.status);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle special cases like amounts
      if (sortField === 'Amount') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortField === 'processed_timestamp') {
        // For timestamps, we want the raw value
        aValue = a.processed_timestamp;
        bValue = b.processed_timestamp;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [transactions, filters, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportCSV = () => {
    // Generate CSV data
    const headers = ['ID', 'Amount', 'Payment Method', 'Status', 'Time', 'Fraud Probability'];
    const csvData = filteredTransactions.map(tx => [
      tx._id,
      tx.Amount,
      getPaymentMethod(tx.Payment_Method),
      tx.status,
      tx.created_at,
      (tx.fraud_probability * 100).toFixed(2) + '%'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPaymentMethod = (code: string) => {
    const methods: Record<string, string> = {
      '0': 'Credit Card',
      '1': 'Debit Card',
      '2': 'UPI',
      '3': 'Net Banking',
      '4': 'Wallet'
    };
    return methods[code] || code;
  };

  const getStatusIcon = (status: string, fraudPrediction: number) => {
    if (status === 'pending' || status === undefined) {
      return <Clock className="h-5 w-5 text-warning-400" />;
    }
    if (status === 'failed' || fraudPrediction === 1) {
      return <AlertTriangle className="h-5 w-5 text-error-400" />;
    }
    return <CheckCircle className="h-5 w-5 text-success-400" />;
  };

  const getStatusClass = (status: string, fraudPrediction: number) => {
    if (status === 'pending' || status === undefined) {
      return 'bg-warning-900/30 text-warning-400 border-warning-700';
    }
    if (status === 'failed' || fraudPrediction === 1) {
      return 'bg-error-900/30 text-error-400 border-error-700';
    }
    return 'bg-success-900/30 text-success-400 border-success-700';
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="animate-fade-in">
      <div className="p-4 flex justify-between items-center border-b border-dark-700">
        <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
        <div className="flex space-x-2">
          <button 
            onClick={exportCSV} 
            className="flex items-center space-x-1 bg-dark-700 hover:bg-dark-600 text-white px-3 py-1 rounded-md transition-colors"
            title="Export as CSV"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-dark-300">
          <thead className="text-xs uppercase bg-dark-700 text-dark-400">
            <tr>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('_id')}>
                <div className="flex items-center space-x-1">
                  <span>Transaction ID</span>
                  {sortField === '_id' && (
                    <ArrowUpDown size={14} className={sortDirection === 'asc' ? 'transform rotate-180' : ''} />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('Amount')}>
                <div className="flex items-center space-x-1">
                  <span>Amount</span>
                  {sortField === 'Amount' && (
                    <ArrowUpDown size={14} className={sortDirection === 'asc' ? 'transform rotate-180' : ''} />
                  )}
                </div>
              </th>
              <th className="px-6 py-3">Payment Method</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('processed_timestamp')}>
                <div className="flex items-center space-x-1">
                  <span>Time</span>
                  {sortField === 'processed_timestamp' && (
                    <ArrowUpDown size={14} className={sortDirection === 'asc' ? 'transform rotate-180' : ''} />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('fraud_probability')}>
                <div className="flex items-center space-x-1">
                  <span>Fraud Probability</span>
                  {sortField === 'fraud_probability' && (
                    <ArrowUpDown size={14} className={sortDirection === 'asc' ? 'transform rotate-180' : ''} />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading state
              [...Array(5)].map((_, index) => (
                <tr key={index} className="border-b border-dark-700 bg-dark-800">
                  {[...Array(6)].map((_, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                      <div className="h-4 bg-dark-700 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedTransactions.length > 0 ? (
              // Data rows
              paginatedTransactions.map((transaction, index) => (
                <tr 
                  key={transaction._id} 
                  className={`border-b border-dark-700 ${
                    transaction.fraud_prediction === 1 
                      ? 'bg-error-900/10 hover:bg-error-900/20' 
                      : 'bg-dark-800 hover:bg-dark-700'
                  } transition-colors duration-150`}
                >
                  <td className="px-6 py-4 font-medium">
                    {transaction._id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 font-medium">
                    ${parseFloat(transaction.Amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {getPaymentMethod(transaction.Payment_Method)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      getStatusClass(transaction.status, transaction.fraud_prediction)
                    }`}>
                      {getStatusIcon(transaction.status, transaction.fraud_prediction)}
                      <span className="ml-1">
                        {transaction.status === 'failed' || transaction.fraud_prediction === 1 
                          ? 'Fraud Detected' 
                          : transaction.status || 'Processing'}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {transaction.created_at}
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-dark-600 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          transaction.fraud_probability > 0.7 
                            ? 'bg-error-500' 
                            : transaction.fraud_probability > 0.4 
                              ? 'bg-warning-500' 
                              : 'bg-success-500'
                        }`}
                        style={{ width: `${transaction.fraud_probability * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs mt-1 block">
                      {(transaction.fraud_probability * 100).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              // No data
              <tr className="border-b border-dark-700 bg-dark-800">
                <td colSpan={6} className="px-6 py-8 text-center text-dark-400">
                  No transactions found matching your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredTransactions.length > 0 && (
        <div className="p-4 flex items-center justify-between border-t border-dark-700">
          <div className="text-sm text-dark-400">
            Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length} entries
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1 
                  ? 'text-dark-500 bg-dark-800 cursor-not-allowed' 
                  : 'text-white bg-dark-700 hover:bg-dark-600'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              // Calculate page numbers to show around current page
              let pageToShow;
              if (totalPages <= 5) {
                pageToShow = i + 1;
              } else if (currentPage <= 3) {
                pageToShow = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageToShow = totalPages - 4 + i;
              } else {
                pageToShow = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageToShow)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md ${
                    currentPage === pageToShow
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-700 text-white hover:bg-dark-600'
                  }`}
                >
                  {pageToShow}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? 'text-dark-500 bg-dark-800 cursor-not-allowed'
                  : 'text-white bg-dark-700 hover:bg-dark-600'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;