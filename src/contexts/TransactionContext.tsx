import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { format } from 'date-fns';

export interface Transaction {
  _id: string;
  Amount: string;
  stream_id: string;
  processed_timestamp: number;
  fraud_prediction: number;
  fraud_probability: number;
  fraud_token?: string;
  legit_token?: string;
  Payment_Method: string;
  Device_Type: string;
  status: 'pending' | 'complete' | 'failed';
  created_at?: string;
}

interface TransactionStats {
  total: number;
  fraud: number;
  legitimate: number;
  amountTotal: number;
  fraudAmountTotal: number;
  detectionRate: number;
}

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  stats: TransactionStats;
  fetchTransactions: (filters?: any) => Promise<void>;
  fetchStats: () => Promise<void>;
}

const DEFAULT_STATS: TransactionStats = {
  total: 0,
  fraud: 0,
  legitimate: 0,
  amountTotal: 0,
  fraudAmountTotal: 0,
  detectionRate: 0,
};

const TransactionContext = createContext<TransactionContextType>({
  transactions: [],
  loading: false,
  error: null,
  stats: DEFAULT_STATS,
  fetchTransactions: async () => {},
  fetchStats: async () => {},
});

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TransactionStats>(DEFAULT_STATS);
  const { socket, isConnected } = useSocket();

  const fetchTransactions = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
      
      const API_URL = import.meta.env.DEV 
        ? 'http://localhost:3001/api' 
        : 'https://api.080405.tech/api';

      
      const response = await fetch(`${API_URL}/transactions?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      
      // Process the data to ensure it has the correct format
      const processedTransactions = data.map((tx: Transaction) => ({
        ...tx,
        // Convert MongoDB numerical strings to numbers if needed
        Amount: parseFloat(tx.Amount).toFixed(2),
        // Ensure we have a status
        status: tx.status || (tx.fraud_prediction === 1 ? 'failed' : 'complete'),
        // Add a formatted date if not present
        created_at: tx.created_at || format(new Date(tx.processed_timestamp * 1000), 'yyyy-MM-dd HH:mm:ss')
      }));
      
      setTransactions(processedTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const API_URL = import.meta.env.DEV 
        ? 'http://localhost:3001/api' 
        : '/api';
      
      const response = await fetch(`${API_URL}/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction statistics');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Don't set error state here to avoid disrupting the UI
    }
  }, []);

  useEffect(() => {
    // Initial data fetch
    fetchTransactions();
    fetchStats();
    
    // Set up polling for stats every 30 seconds
    const statsInterval = setInterval(() => {
      fetchStats();
    }, 30000);
    
    return () => {
      clearInterval(statsInterval);
    };
  }, [fetchTransactions, fetchStats]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // Listen for new transactions
    socket.on('new_transaction', (newTransaction: Transaction) => {
      // Process the new transaction
      const processedTransaction: Transaction = {
        ...newTransaction,
        Amount: parseFloat(newTransaction.Amount).toFixed(2),
        status: newTransaction.fraud_prediction === 1 ? 'failed' : 'complete',
        created_at: format(new Date(newTransaction.processed_timestamp * 1000), 'yyyy-MM-dd HH:mm:ss')
      };
      
      // Add to transactions list
      setTransactions(prev => [processedTransaction, ...prev].slice(0, 100)); // Keep only most recent 100
      
      // Update stats
      setStats(prev => {
        const isFraud = newTransaction.fraud_prediction === 1;
        const amount = parseFloat(newTransaction.Amount);
        
        return {
          ...prev,
          total: prev.total + 1,
          fraud: prev.fraud + (isFraud ? 1 : 0),
          legitimate: prev.legitimate + (isFraud ? 0 : 1),
          amountTotal: prev.amountTotal + amount,
          fraudAmountTotal: prev.fraudAmountTotal + (isFraud ? amount : 0),
          // Recalculate detection rate
          detectionRate: ((prev.fraud + (isFraud ? 1 : 0)) / (prev.total + 1)) * 100
        };
      });
    });
    
    // Listen for stats updates
    socket.on('stats_update', (newStats: TransactionStats) => {
      setStats(newStats);
    });
    
    return () => {
      socket.off('new_transaction');
      socket.off('stats_update');
    };
  }, [socket, isConnected]);

  return (
    <TransactionContext.Provider value={{ 
      transactions, 
      loading, 
      error, 
      stats,
      fetchTransactions,
      fetchStats
    }}>
      {children}
    </TransactionContext.Provider>
  );
};