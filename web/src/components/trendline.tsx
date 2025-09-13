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
import { useMemo } from 'react';
import type { Account, Transaction } from '../api';

// Type guard to check if account has a 'history' field (i.e., is a CashAccount or similar)
function hasHistory(acc: Account): acc is Account & { history: Transaction[]; balance: number } {
  return (
    'history' in acc &&
    Array.isArray((acc as any).history) &&
    'balance' in acc &&
    typeof (acc as any).balance === 'number'
  );
}

// Add this type guard after the existing hasHistory function
function hasBalanceData(acc: Account): acc is Account & { balanceData: { date: string; balance: number }[] } {
  return 'balanceData' in acc && Array.isArray((acc as any).balanceData);
}

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

function abbreviateThousand(balance: Number): string {
  if (balance > 999) {
    balance = balance / 1000;
    balance = balance.toFixed(1);
    return "" + balance.toString() + "K";
  }
  return balance.toString();
}

export default function Trendline({ 
  account,
  startDate,
  endDate, 
  width = "100%", 
  height = "300px" 
}: TrendlineProps) {
  // Calculate balance over time
  const balanceData = useMemo<BalancePoint[]>(() => {
    // If account has pre-calculated balance data, use it directly
    if (hasBalanceData(account)) {
      return account.balanceData;
    }
    
    // Simple fallback for accounts without balance data
    if ('balance' in account && typeof (account as any).balance === 'number') {
      const accountCreated = new Date(account.created_at);
      return [
        {
          date: accountCreated.toISOString().split('T')[0],
          balance: (account as any).balance
        }
      ];
    }
    
    return [];
  }, [account, startDate, endDate]);

  // Chart configuration
  const chartData = {
    labels: balanceData.map((point) => point.date),
    datasets: [
      {
        label: ``,
        data: balanceData.map((point) => point.balance),
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
        display: false,
      },
      title: {
        display: true,
        text:
          'balance' in account && typeof (account as any).balance === 'number'
            ? `$${Number((account as any).balance).toFixed(2)} ${account.name}`
            : `${account.name}`,
        font: {
          size: 20,
          weight: 'bold',
        },
        color: '#fff',
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
        },
        ticks: {
          maxTicksLimit: 8,
        },
      },
      y: {
        type: 'linear',
        title: {
          display: false,
        },
        ticks: {
          callback: function(value) {
            //return `$${Number(value).toFixed(2)}`;
            return `$${abbreviateThousand(value)}`;
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div style={{ width, height }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
