import { useState, useEffect } from 'react';
import type { Account, Transaction } from '../api';
import { accountsApi, transactionsApi } from '../api';

// Placeholder for a trend line graph
function TrendLineGraph({ accounts }: { accounts: Account[] }) {
  return (
    <div className="trend-line-graph">
      <span style={{ color: '#888' }}>[Trend line graph placeholder]</span>
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [accountsRes, transactionsRes] = await Promise.all([
          accountsApi.getAll(),
          transactionsApi.getAll()
        ]);
        setAccounts(accountsRes.data.accounts);
        setTransactions(transactionsRes.data.transactions);
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
          <h2 style={{ textAlign: 'left', fontSize: 24, marginBottom: 16 }}>Transactions</h2>
          <div className="transactions-list" style={{ textAlign: 'left', fontSize: 18 }}>
            {transactions.length === 0 ? (
              <p>No transactions found.</p>
            ) : (
              <ul style={{ paddingLeft: 0, listStyle: 'none', width: '100%' }}>
                {transactions.map((tx) => (
                  <li key={tx.id} style={{ marginBottom: 12 }}>
                    <span>{tx.source}</span> | <span>{new Date(tx.date).toLocaleDateString()}</span> | <span>{tx.amount >= 0 ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
