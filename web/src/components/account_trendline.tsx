import { useState } from 'react';
import type { Account } from '../api';
import Trendline from './trendline';

interface AccountTrendlineProps {
  accounts: Account[];
  defaultAccountId?: string;
  defaultPeriod?: '7d' | '14d' | '1m' | '3m' | '6m' | '1y';
}

export default function AccountTrendline({ 
  accounts, 
  defaultAccountId,
  defaultPeriod = '3m'
}: AccountTrendlineProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(defaultAccountId || accounts[0]?.id || '');
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);

  // Calculate date range based on selected period
  const getDateRange = (period: string) => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '14d':
        startDate.setDate(endDate.getDate() - 14);
        break;
      case '1m':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 3);
    }
    
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange(selectedPeriod);
  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  if (!selectedAccount) {
    return (
      <div className="account-trendline">
        <div className="trendline-controls">
          <select 
            value={selectedAccountId} 
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="account-select"
          >
            <option value="">Select an account</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="period-select"
          >
            <option value="7d">Last 7 days</option>
            <option value="14d">Last 14 days</option>
            <option value="1m">Last month</option>
            <option value="3m">Last 3 months</option>
            <option value="6m">Last 6 months</option>
            <option value="1y">Last year</option>
          </select>
        </div>
        
        <div className="trendline-placeholder">
          Please select an account to view its trend
        </div>
      </div>
    );
  }

  return (
    <div className="account-trendline">
      <div className="trendline-controls">
        <select 
          value={selectedAccountId} 
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="account-select"
        >
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        
        <select 
          value={selectedPeriod} 
          onChange={(e) => setSelectedPeriod(e.target.value as any)}
          className="period-select"
        >
          <option value="7d">Last 7 days</option>
          <option value="14d">Last 14 days</option>
          <option value="1m">Last month</option>
          <option value="3m">Last 3 months</option>
          <option value="6m">Last 6 months</option>
          <option value="1y">Last year</option>
        </select>
      </div>
      
      <div className="trendline-chart">
        <Trendline 
          account={selectedAccount}
          startDate={startDate}
          endDate={endDate}
          width="100%"
          height="300px"
        />
      </div>
    </div>
  );
}
