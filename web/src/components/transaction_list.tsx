import { useState, useEffect } from 'react';
import type { Transaction } from '../api';
import { transactionsApi } from '../api';

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionsApi.getAll();
      setTransactions(response.data.transactions);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    const isPositive = amount >= 0;
    const formattedAmount = Math.abs(amount).toFixed(2);
    return `${isPositive ? '+' : '-'}$${formattedAmount}`;
  };

  if (loading) return <div className="transaction-list">Loading transactions...</div>;
  if (error) return <div className="transaction-list error">Error: {error}</div>;

  return (
    <div className="transaction-list">
      <h2>Recent Transactions</h2>
      {transactions.length === 0 ? (
        <p className="no-transactions">No transactions found. Create your first transaction!</p>
      ) : (
        <div className="transactions-container">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-header">
                <div className="transaction-source">{transaction.source}</div>
                <div className="transaction-amount">
                  <span className={transaction.amount >= 0 ? 'positive' : 'negative'}>
                    {formatAmount(transaction.amount)}
                  </span>
                </div>
              </div>
              <div className="transaction-details">
                <div className="transaction-account">{transaction.account?.name || 'Unknown Account'}</div>
                <div className="transaction-date">{formatDate(transaction.date)}</div>
              </div>
              {transaction.note && (
                <div className="transaction-note">{transaction.note}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 