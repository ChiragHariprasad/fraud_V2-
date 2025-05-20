import React from 'react';
import { AlertCircle as CircleAlert, Check, Database, Percent } from 'lucide-react';

interface TransactionCounterProps {
  title: string;
  value: number | string;
  icon: string;
  className?: string;
  suffix?: string;
  loading?: boolean;
}

const TransactionCounter: React.FC<TransactionCounterProps> = ({
  title,
  value,
  icon,
  className = "bg-gradient-to-br from-primary-700 to-primary-900",
  suffix = "",
  loading = false
}) => {
  const renderIcon = () => {
    switch (icon) {
      case 'alert-triangle':
        return <CircleAlert className="h-8 w-8 text-error-300" />;
      case 'check-circle':
        return <Check className="h-8 w-8 text-success-300" />;
      case 'database':
        return <Database className="h-8 w-8 text-primary-300" />;
      case 'percent':
        return <Percent className="h-8 w-8 text-accent-300" />;
      default:
        return <Database className="h-8 w-8 text-primary-300" />;
    }
  };

  return (
    <div className={`rounded-xl shadow-lg p-5 ${className} transition-all duration-300 hover:shadow-xl`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-white/80 mb-1">{title}</h3>
          {loading ? (
            <div className="h-8 w-32 bg-white/10 rounded animate-pulse"></div>
          ) : (
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-white">
                {value}
                <span className="text-xl ml-1">{suffix}</span>
              </p>
            </div>
          )}
        </div>
        <div className="p-3 bg-dark-800/30 rounded-lg backdrop-blur-sm">
          {renderIcon()}
        </div>
      </div>
    </div>
  );
};

export default TransactionCounter;