import { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { Account, Transaction } from '../api';
import { transactionsApi } from '../api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TrendlineProps {
  account: Account;
  startDate: Date;
  endDate: Date;
  width?: string;
  height?: string;
}

interface BalancePoint {
  date: string;
  balance: number;
}

export default function Trendline({ 
  account, 
  startDate, 
  endDate, 
  width = "100%", 
  height = "300px" 
}: TrendlineProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions for the account within the date range
  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      try {
        const response = await transactionsApi.getAll({
          account: account.id,
          date_query: `${startDate.toISOString()}/${endDate.toISOString()}`
        });
        setTransactions(response.data.transactions);
        setError(null);
      } catch (err: any) {
        setError('Failed to load transactions');
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [account.id, startDate, endDate]);

  // Calculate balance over time
  const balanceData = useMemo(() => {
    if (!transactions.length && 'balance' in account) {
      // If no transactions, show starting balance from account creation
      const accountCreated = new Date(account.created_at);
      return [
        {
          date: accountCreated.toISOString().split('T')[0],
          balance: account.balance
        }
      ];
    }

    // Sort transactions by date
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate running balance
    let runningBalance = 'balance' in account ? account.balance : 0;
    const balancePoints: BalancePoint[] = [];
    
    // Add starting balance point
    balancePoints.push({
      date: startDate.toISOString().split('T')[0],
      balance: runningBalance
    });

    // Process each transaction
    sortedTransactions.forEach(transaction => {
      runningBalance += transaction.amount;
      balancePoints.push({
        date: transaction.date.split('T')[0],
        balance: runningBalance
      });
    });

    // Add end date point if no transactions on that date
    const lastTransactionDate = sortedTransactions.length > 0 
      ? sortedTransactions[sortedTransactions.length - 1].date.split('T')[0]
      : null;
    
    if (lastTransactionDate !== endDate.toISOString().split('T')[0]) {
      balancePoints.push({
        date: endDate.toISOString().split('T')[0],
        balance: runningBalance
      });
    }

    return balancePoints;
  }, [transactions, account, startDate, endDate]);

  // Chart configuration
  const chartData = {
    labels: balanceData.map(point => point.date),
    datasets: [
      {
        label: `${account.name} Balance`,
        data: balanceData.map(point => point.balance),
        borderColor: account.category === 1 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        backgroundColor: account.category === 1 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${account.name} Balance Trend`,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Balance: $${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'category',
        title: {
          display: true,
          text: 'Date',
        },
        ticks: {
          maxTicksLimit: 8,
        },
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'Balance ($)',
        },
        ticks: {
          callback: function(value) {
            return `$${Number(value).toFixed(2)}`;
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  if (loading) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading trend data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red' }}>
        <div>Error: {error}</div>
      </div>
    );
  }

  return (
    <div style={{ width, height }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
