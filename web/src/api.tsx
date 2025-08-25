import axios from 'axios';

const api_url = 'http://localhost:3001/api/v1';

/* Account */

export interface BaseAccount {
    id: string;
    name: string;
    type: string;
    category: number; // 1 = asset, -1 = debt
    created_at: string;
}

export interface CashAccount extends BaseAccount {
    balance: number;
    history?: Transaction[];
}

export interface CheckingAccount extends CashAccount {

}

export interface SavingsAccount extends CashAccount {
    apr: number;
    compounding: number;
}

export interface BrokerageAccount extends BaseAccount {
    positions: Asset[];
}

export interface CreditAccount extends CashAccount {}

export type Account = CheckingAccount | SavingsAccount | CreditAccount | BrokerageAccount;

export interface Request_newAccount {
    name: string;
    balance: number;
    type: string;
    category: number;
    apr?: number; // Annual Percentage Rate for savings accounts
}

/* Transaction */

export interface Transaction {
    id: string;
    account_id: string;
    source: string;
    date: string;
    amount: number;
    note: string;
    account?: Account;
}

export interface Request_newTransaction {
    account: string; // UUID string
    source: string;
    date: string; // Keep as string for form input, convert to Date in component
    amount: number;
    note: string;
}

const api = axios.create({
    baseURL: api_url,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const accountsApi = {
    getAll: () => api.get<{success: boolean, accounts: Account[], count: number}>('/account'),
    getById: (id: string) => api.get<Account>(`/account/${id}`),
    create: (data: Request_newAccount) => api.post<Account>('/account', data),
    delete: (id: string) => api.delete(`/account/${id}`),
};

export const transactionsApi = {
    getAll: (params?: { account?: string; date_query?: string }) =>
        api.get<{ success: boolean; transactions: Transaction[]; count: number }>(
            '/transactions',
            { params }
        ),
    create: (data: Request_newTransaction) => api.post<Transaction>('/transactions', data),
    delete: (id: string) => api.delete(`/transactions/${id}`),
};

/* Asset */

export interface Asset {
    id: string;
    account_id: string;
    ticker: string;
    quantity: number;
    price: number;
    yield: number;
}

export default api;
