import { formatCurrency } from '../lib/utils';

interface StatCardProps {
    icon: any;
    title: string;
    amount: number;
}

export const StatCard = ({
    icon: Icon,
    title,
    amount,
}: StatCardProps) => (
    <div className="bg-white rounded border border-gray-200 p-3">
        <div className="flex items-center gap-1.5 mb-1">
            <Icon className="text-gray-800" size={14} strokeWidth={2.5} />
            <p className="text-xs text-gray-600 font-medium">{title}</p>
        </div>
        <p className="text-base font-bold text-gray-900">{formatCurrency(amount)}</p>
    </div>
);
