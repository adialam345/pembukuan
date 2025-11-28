export interface Service {
    id: string;
    name: string;
    price: number;
    created_at: string;
}

export interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    payment_status: 'paid' | 'unpaid';
    created_at: string;
}

export type NavPage = 'dashboard' | 'transactions' | 'services' | 'reports';
