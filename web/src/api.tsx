import axios from 'axios';

const api_url = 'http://localhost:3001/api/v1';

/* Account */

export interface Account {
    id: string;
    name: string;
    balance: number;
}

export interface Request_newAccount {
    name: string;
    balance: number;
}

/* Transaction */

export interface Transaction {
    id: string;
    account_id: string;
    source: string;
    date: string;
    amount: number;
    note: string;
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
    create: (data: Request_newTransaction) => api.post<Transaction>('/transaction/add', data),
    delete: (id: string) => api.delete(`/transaction/delete/${id}`),
};

export default api;
