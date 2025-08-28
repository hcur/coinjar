import { useState, useEffect } from 'react';
import type { Account } from '../api';
import { accountsApi } from '../api';
import TransactionList from './transaction_list';
import Trendline from './trendline';
import AccountTrendline from './account_trendline';

// Trend line graph showing total balance over time
function TrendLineGraph({ accounts }: { accounts: Account[] }) {
  // Default to showing last 3 months
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 3);

  // Calculate total balance from all accounts
  const totalBalance = accounts.reduce((sum, acc) => {
    if ('balance' in acc) {
      return sum + (acc.category * acc.balance || 0);
    }
    return sum;
  }, 0);

  // Create a virtual "total balance" account for the trendline
  const totalBalanceAccount: Account = {
    id: 'total-balance',
    name: 'Total Balance',
    type: 'total',
    category: 1,
    created_at: startDate.toISOString(),
    balance: totalBalance
  };

  return (
    <div className="trend-line-graph">
      <Trendline 
        account={totalBalanceAccount}
        startDate={startDate}
        endDate={endDate}
        width="100%"
        height="200px"
      />
    </div>
  );
}

function AtAGlance({ accounts }: { accounts: Account[] }) {
  return (
    <div className="accounts-grid">
    {accounts.map((account) => (
        <div key={account.id} className="account-card">
        <div className="account-info">
            <h4 className="account-name">{account.name}</h4>
            <div className="account-balance-section">
            <div className="balance-amount" style={{ color: account.category === -1 ? 'red' : 'green' }}>
                {'balance' in account && typeof account.balance === 'number'
                ? `$${account.balance.toFixed(2)}`
                : 'Balance N/A'}
            </div>
            </div>
        </div>
        </div>
    ))}
    </div>
  );
}

export default function Dashboard({ userName = "User", refreshKey }: { userName?: string, refreshKey?: number }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const accountsRes = await accountsApi.getAll();
        setAccounts(accountsRes.data.accounts);
        const totalBalance = accountsRes.data.accounts.reduce((sum: number, acc: any) => {
          if ('balance' in acc) {
            return sum + (acc.category * acc.balance || 0);
          }
          return sum;
        }, 0);
        setBalance(totalBalance);
        setError(null);
      } catch (err: any) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [refreshKey]);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        {getGreeting()}, {userName}
      </div>
      <div className="dashboard-content">
        <div className="dashboard-top">
          <div className="dashboard-balance">
            <div className="dashboard-balance-line">
              Your assets: ${balance.toFixed(2)}
            </div>
            <TrendLineGraph accounts={accounts} />
          </div>
          <div className="dashboard-ataglance">
            <h3>At a glance:</h3>
            <AtAGlance accounts={accounts} />
          </div>
        </div>
        <div className="dashboard-bottom">
          <TransactionList />
        </div>
      </div>
    </div>
  );
}
