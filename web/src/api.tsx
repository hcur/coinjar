import axios from 'axios';

const api_url = 'http://localhost:3001';

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
    account: string;
    source: string;
    date: string;
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
    getAll: () => api.get<Account[]>('/accounts'),
    getById: (id: string) => api.get<Account>('/accounts/${id}'),
    create: (data: Request_newTransaction) => api.post<Account>('/accounts', data),
    delete: (id: string) => api.delete('/accounts/${id}'),
};

export const transactionsApi = {
    create: (data: Request_newTransaction) => api.post<Transaction>('/transactions', data),
    delete: (id: string) => api.delete('/transactions/${id}'),
};

export default api;
