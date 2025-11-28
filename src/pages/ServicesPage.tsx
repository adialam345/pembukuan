import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Briefcase, Trash2, ChevronRight, Search } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Service } from '../types';

interface ServicesPageProps {
    services: Service[];
    loading: boolean;
    setShowAddService: (show: boolean) => void;
    handleDeleteService: (id: string) => void;
    useServiceForTransaction: (service: Service) => void;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
};

const ITEMS_PER_PAGE = 10;

export const ServicesPage = ({
    services,
    loading,
    setShowAddService,
    handleDeleteService,
    useServiceForTransaction,
}: ServicesPageProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
    const observerTarget = useRef<HTMLDivElement>(null);

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayedServices = filteredServices.slice(0, displayedCount);
    const hasMore = displayedCount < filteredServices.length;

    // Reset displayed count when search changes
    useEffect(() => {
        setDisplayedCount(ITEMS_PER_PAGE);
    }, [searchQuery]);

    // Load more items smoothly without loading indicator
    const loadMore = useCallback(() => {
        if (!hasMore) return;
        setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredServices.length));
    }, [hasMore, filteredServices.length]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, loadMore]);

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Daftar Layanan</h2>
                    <p className="text-xs text-gray-500">Kelola harga dan jenis layanan</p>
                </div>
                <button
                    onClick={() => setShowAddService(true)}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-zinc-800 transition-colors"
                >
                    <Plus size={14} strokeWidth={3} />
                    <span>Tambah</span>
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Cari layanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 text-xs md:text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                />
            </div>


            <div className="space-y-2">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-500 text-xs">Memuat...</p>
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                            <Briefcase className="text-gray-400" size={20} />
                        </div>
                        <p className="text-gray-900 font-medium text-sm">
                            {services.length === 0 ? 'Belum ada layanan' : 'Layanan tidak ditemukan'}
                        </p>
                    </div>
                ) : (
                    <>
                        {displayedServices.map((service) => (
                            <motion.div
                                variants={item}
                                key={service.id}
                                className="group flex items-center justify-between p-4 md:p-5 bg-white rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                            >
                                <div className="flex items-center gap-4 md:gap-6">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-black group-hover:text-white transition-colors duration-300">
                                        <Briefcase size={18} className="md:w-6 md:h-6" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm md:text-base text-gray-900">{service.name}</h3>
                                        <p className="text-xs md:text-sm text-gray-500 font-medium">{formatCurrency(Number(service.price))}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:gap-3">
                                    <button
                                        onClick={() => useServiceForTransaction(service)}
                                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-900 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors"
                                    >
                                        <span>Pilih</span>
                                        <ChevronRight size={16} />
                                    </button>

                                    {/* Mobile Select Button (Icon Only) */}
                                    <button
                                        onClick={() => useServiceForTransaction(service)}
                                        className="sm:hidden p-2 bg-gray-50 text-gray-900 rounded-lg hover:bg-black hover:text-white transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>

                                    <div className="w-px h-6 md:h-8 bg-gray-200 mx-1 md:mx-2"></div>

                                    <button
                                        onClick={() => handleDeleteService(service.id)}
                                        className="p-2 md:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} strokeWidth={2} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {/* Invisible trigger for infinite scroll - smooth without loading indicator */}
                        {hasMore && <div ref={observerTarget} className="h-1" />}
                    </>
                )}
            </div>
        </motion.div>
    );
};
