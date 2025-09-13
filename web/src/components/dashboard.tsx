import { useState, useEffect, useMemo } from 'react';
import type { Account, Transaction } from '../api';
import { accountsApi, transactionsApi } from '../api';
import TransactionList from './transaction_list';
import Trendline from './trendline';

// Trend line graph showing total balance over time
function TrendLineGraph({ accounts, allTransactions }: { accounts: Account[], allTransactions: Transaction[] }) {
  // Default to showing last 3 months
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 1);

  // Calculate net worth over time - this is the only place we do the calculation
  const netWorthData = useMemo(() => {
    const dailyData: { date: string; balance: number }[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Calculate net worth for this date
      let netWorth = 0;
      accounts.forEach(account => {
        if ('balance' in account) {
          // Calculate what the balance was on this specific date
          let historicalBalance = account.balance;
          
          // Subtract all transactions that happened AFTER this date
          // (to work backwards from current balance to historical balance)
          allTransactions.forEach(transaction => {
            if (transaction.account_id === account.id && 
                transaction.date.split('T')[0] > dateStr) {
              historicalBalance -= transaction.amount;
            }
          });
          
          netWorth += account.category * historicalBalance;
        }
      });
      
      dailyData.push({
        date: dateStr,
        balance: netWorth
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyData;
  }, [accounts, allTransactions, startDate, endDate]);

  // Create a virtual account with pre-calculated balance data
  const netWorthAccount: Account & { balanceData: { date: string; balance: number }[] } = {
    id: 'net-worth',
    name: 'net worth',
    type: 'total',
    category: 1,
    created_at: startDate.toISOString(),
    balance: netWorthData[netWorthData.length - 1]?.balance || 0,
    balanceData: netWorthData // Pass the pre-calculated data directly
  };

  return (
    <div className="trend-line-graph">
      <Trendline 
        account={netWorthAccount}
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
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [accountsRes, transactionsRes] = await Promise.all([
          accountsApi.getAll(),
          transactionsApi.getAll()
        ]);
        
        setAccounts(accountsRes.data.accounts);
        setAllTransactions(transactionsRes.data.transactions);
        setError(null);
      } catch (err: any) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [refreshKey]);

  // Calculate current net worth (removed redundant balance state)
  const currentNetWorth = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      if ('balance' in acc) {
        return sum + (acc.category * acc.balance || 0);
      }
      return sum;
    }, 0);
  }, [accounts]);

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
            <TrendLineGraph accounts={accounts} allTransactions={allTransactions} />
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
