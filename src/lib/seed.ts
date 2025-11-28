import { supabase } from './supabase';

const services = [
    { name: 'Cuci AC Split 0.5 - 1 PK', price: 75000 },
    { name: 'Cuci AC Split 1.5 - 2 PK', price: 85000 },
    { name: 'Isi Freon R32/R410', price: 350000 },
    { name: 'Isi Freon R22', price: 250000 },
    { name: 'Bongkar Pasang AC', price: 450000 },
    { name: 'Perbaikan Modul', price: 350000 },
    { name: 'Ganti Kapasitor', price: 175000 },
    { name: 'Las Kebocoran', price: 250000 },
];

export const seedDatabase = async () => {
    console.log('Seeding database...');

    // 1. Insert Services
    const { error: serviceError } = await supabase.from('services').upsert(
        services.map(s => ({ ...s })),
        { onConflict: 'name' }
    );

    if (serviceError) {
        console.error('Error seeding services:', serviceError);
        alert('Error seeding services: ' + serviceError.message);
        return;
    }

    // 2. Generate Dummy Transactions
    const transactions = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6); // Last 6 months

    for (let i = 0; i < 50; i++) {
        const isIncome = Math.random() > 0.4; // 60% income, 40% expense
        const service = services[Math.floor(Math.random() * services.length)];

        const date = new Date(startDate.getTime() + Math.random() * (new Date().getTime() - startDate.getTime()));

        let description, amount, type;

        if (isIncome) {
            description = service.name;
            amount = service.price;
            type = 'income';
        } else {
            const expenses = [
                { desc: 'Beli Freon R32', price: 850000 },
                { desc: 'Beli Pipa Tembaga 3m', price: 250000 },
                { desc: 'Bensin Operasional', price: 50000 },
                { desc: 'Makan Siang Tim', price: 75000 },
                { desc: 'Tools & Equipment', price: 450000 },
                { desc: 'Iklan Facebook Ads', price: 150000 },
            ];
            const expense = expenses[Math.floor(Math.random() * expenses.length)];
            description = expense.desc;
            amount = expense.price;
            type = 'expense';
        }

        transactions.push({
            date: date.toISOString().split('T')[0],
            description,
            amount,
            type,
            payment_status: Math.random() > 0.8 ? 'unpaid' : 'paid', // 20% unpaid
        });
    }

    const { error: transactionError } = await supabase.from('transactions').insert(transactions);
    if (transactionError) throw transactionError;

    return { success: true, message: 'Berhasil membuat data dummy (Services & Transactions)! Silakan refresh halaman.' };
};
