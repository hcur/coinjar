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
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ background: '#222' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Source</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Date</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Amount</th>
              {/* Room for extra headers */}
              <th style={{ padding: '12px 16px' }}></th>
              <th style={{ padding: '12px 16px' }}></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} style={{ background: '#181818', borderBottom: '1px solid #333' }}>
                <td style={{ textAlign: 'left', padding: '12px 16px' }}>{transaction.source}</td>
                <td style={{ textAlign: 'left', padding: '12px 16px' }}>{formatDate(transaction.date)}</td>
                <td style={{ textAlign: 'left', padding: '12px 16px' }}>
                  <span style={{ color: transaction.amount >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                    {formatAmount(transaction.amount)}
                  </span>
                </td>
                {/* Extra columns for future headers */}
                <td style={{ padding: '12px 16px' }}></td>
                <td style={{ padding: '12px 16px' }}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {transactions.length === 0 && (
        <p className="no-transactions">No transactions found. Create your first transaction!</p>
      )}
    </div>
  );
}