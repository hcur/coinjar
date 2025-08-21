import { useState, useEffect } from 'react';
import type { Request_newAccount, Request_newTransaction, Account } from '../api';
import { accountsApi, transactionsApi } from '../api';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewItemModal({ isOpen, onClose, onSuccess }: NewItemModalProps) {
  const [activeTab, setActiveTab] = useState<'transaction' | 'account'>('transaction');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState<Request_newTransaction>({
    account: '',
    source: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    note: ''
  });

  // Account form state
  const [accountForm, setAccountForm] = useState<Request_newAccount>({
    name: '',
    balance: 0,
    type: 'checking' // Default to checking account
  });

  // Load accounts when modal opens
  useEffect(() => {
    if (isOpen && activeTab === 'transaction') {
      loadAccounts();
    }
  }, [isOpen, activeTab]);

  const loadAccounts = async () => {
    try {
      const response = await accountsApi.getAll();
      setAccounts(response.data.accounts);
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert date string to Date object for the API
      const dateObj = new Date(transactionForm.date);
      
      // Create the transaction data with proper types
      const transactionData = {
        account: transactionForm.account,
        source: transactionForm.source,
        date: dateObj.toISOString(), // Send as ISO string
        amount: transactionForm.amount,
        note: transactionForm.note
      };

      await transactionsApi.create(transactionData);
      onSuccess();
      onClose();
      // Reset form
      setTransactionForm({
        account: '',
        source: '',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        note: ''
      });
    } catch (err: any) {
      setError('Failed to create transaction');
      console.error('Error creating transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await accountsApi.create(accountForm);
      onSuccess();
      onClose();
      // Reset form
      setAccountForm({
        name: '',
        balance: 0,
        type: 'checking'
      });
    } catch (err: any) {
      setError('Failed to create account');
      console.error('Error creating account:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Item</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Tab Toggle */}
        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'transaction' ? 'active' : ''}`}
            onClick={() => setActiveTab('transaction')}
          >
            Transaction
          </button>
          <button
            className={`tab-button ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Transaction Form */}
        {activeTab === 'transaction' && (
          <form onSubmit={handleTransactionSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="account">Account</label>
              <select
                id="account"
                value={transactionForm.account}
                onChange={(e) => setTransactionForm({...transactionForm, account: e.target.value})}
                required
              >
                <option value="">Select an account</option>
                {accounts.map((account) => {
                  // Handle different account types
                  if (account.type === 'brokerage') {
                    return (
                      <option key={account.id} value={account.id}>
                        {account.name} (Brokerage)
                      </option>
                    );
                  } else {
                    // Checking and savings accounts have balance
                    const cashAccount = account as any;
                    return (
                      <option key={account.id} value={account.id}>
                        {account.name} (${cashAccount.balance?.toFixed(2) || '0.00'})
                      </option>
                    );
                  }
                })}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="source">Source</label>
              <input
                type="text"
                id="source"
                value={transactionForm.source}
                onChange={(e) => setTransactionForm({...transactionForm, source: e.target.value})}
                required
                placeholder="e.g., Grocery Store"
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                value={transactionForm.date}
                onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input
                type="number"
                id="amount"
                step="0.01"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({...transactionForm, amount: parseFloat(e.target.value)})}
                required
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="note">Note</label>
              <textarea
                id="note"
                value={transactionForm.note}
                onChange={(e) => setTransactionForm({...transactionForm, note: e.target.value})}
                placeholder="Optional note about this transaction"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Transaction'}
              </button>
            </div>
          </form>
        )}

        {/* Account Form */}
        {activeTab === 'account' && (
          <form onSubmit={handleAccountSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="accountType">Account Type</label>
              <select
                id="accountType"
                value={accountForm.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setAccountForm({
                    ...accountForm, 
                    type: newType,
                    // Reset balance to 0 for brokerage accounts
                    balance: newType === 'brokerage' ? 0 : accountForm.balance
                  });
                }}
                required
              >
                <option value="checking">Checking Account</option>
                <option value="savings">Savings Account</option>
                <option value="brokerage">Brokerage Account</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="accountName">Account Name</label>
              <input
                type="text"
                id="accountName"
                value={accountForm.name}
                onChange={(e) => setAccountForm({...accountForm, name: e.target.value})}
                required
                placeholder="e.g., Savings Account"
              />
            </div>

            {/* Only show balance for cash accounts */}
            {(accountForm.type === 'checking' || accountForm.type === 'savings') && (
              <div className="form-group">
                <label htmlFor="initialBalance">Initial Balance</label>
                <input
                  type="number"
                  id="initialBalance"
                  step="0.01"
                  value={accountForm.balance}
                  onChange={(e) => setAccountForm({...accountForm, balance: parseFloat(e.target.value)})}
                  required
                  placeholder="0.00"
                />
              </div>
            )}

            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : `Create ${accountForm.type.charAt(0).toUpperCase() + accountForm.type.slice(1)} Account`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 