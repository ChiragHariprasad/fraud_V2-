import React, { useState } from 'react';
import { Search, Calendar, CreditCard, Filter } from 'lucide-react';

interface FilterBarProps {
  onFilterChange: (filters: any) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    paymentMethod: '',
    status: ''
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const paymentMethods = [
    { value: '', label: 'All Payment Methods' },
    { value: '0', label: 'Credit Card' },
    { value: '1', label: 'Debit Card' },
    { value: '2', label: 'UPI' },
    { value: '3', label: 'Net Banking' },
    { value: '4', label: 'Wallet' }
  ];

  const statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'complete', label: 'Complete' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed (Fraud)' }
  ];

  return (
    <div className="bg-dark-800 rounded-lg shadow-lg p-4 animate-fade-in">
      <form onSubmit={handleSearch}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              name="search"
              placeholder="Search transactions..."
              className="w-full bg-dark-700 text-white border border-dark-600 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          {/* Date Range */}
          <div className="flex space-x-2 lg:col-span-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400">
                <Calendar size={18} />
              </div>
              <input
                type="date"
                name="startDate"
                className="w-full bg-dark-700 text-white border border-dark-600 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400">
                <Calendar size={18} />
              </div>
              <input
                type="date"
                name="endDate"
                className="w-full bg-dark-700 text-white border border-dark-600 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          {/* Amount Range */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400">
                <CreditCard size={18} />
              </div>
              <input
                type="number"
                name="minAmount"
                placeholder="Min $"
                className="w-full bg-dark-700 text-white border border-dark-600 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={filters.minAmount}
                onChange={handleFilterChange}
              />
            </div>
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400">
                <CreditCard size={18} />
              </div>
              <input
                type="number"
                name="maxAmount"
                placeholder="Max $"
                className="w-full bg-dark-700 text-white border border-dark-600 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={filters.maxAmount}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400">
              <Filter size={18} />
            </div>
            <select
              name="paymentMethod"
              className="w-full bg-dark-700 text-white border border-dark-600 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              value={filters.paymentMethod}
              onChange={handleFilterChange}
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400">
              <Filter size={18} />
            </div>
            <select
              name="status"
              className="w-full bg-dark-700 text-white border border-dark-600 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              value={filters.status}
              onChange={handleFilterChange}
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FilterBar;