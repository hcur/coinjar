import { useState, useEffect } from 'react';
import type { Account } from '../api';
import { accountsApi } from '../api';

export default function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      console.log('Making API call to load accounts...');
      const response = await accountsApi.getAll();
      console.log('API response:', response);
      setAccounts(response.data.accounts);
    } catch (err: any) {
      console.error('Detailed error loading accounts:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading accounts...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="accounts-list">
      <h2>Your Accounts</h2>
      {accounts.length === 0 ? (
        <p>No accounts found. Create your first account!</p>
      ) : (
        <div className="accounts-grid">
          {accounts.map((account) => (
            <div key={account.id} className="account-card">
              <div className="account-info">
                <h3 className="account-name">{account.name}</h3>
                <div className="account-balance-section">
                  <div className="balance-amount">
                    ${account.balance.toFixed(2)}
                  </div>
                  <div className="trend-line-placeholder">
                    {/* Future trend line will go here */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
