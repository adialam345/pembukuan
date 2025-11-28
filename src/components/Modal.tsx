import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
    show: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    isMobile: boolean;
}

export const Modal = ({
    show,
    onClose,
    title,
    children,
    isMobile,
}: ModalProps) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={isMobile ? { y: "100%" } : { scale: 0.95, opacity: 0 }}
                        animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
                        exit={isMobile ? { y: "100%" } : { scale: 0.95, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full md:max-w-md md:rounded rounded-t-xl border border-gray-300 max-h-[85vh] overflow-y-auto shadow-2xl"
                    >
                        <div className="flex items-center justify-between p-3 border-b border-gray-200 sticky top-0 bg-white z-10">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">{title}</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <X size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="p-3">{children}</div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
