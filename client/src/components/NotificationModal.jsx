import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';

const NotificationModal = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'info', // 'success', 'error', 'info', 'warning'
    confirmText = 'OK',
    duration = 0 // Auto-close after duration (ms), 0 means no auto-close
}) => {
    useEffect(() => {
        // Auto close after duration if specified
        if (isOpen && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    // Close on ESC key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <FaCheckCircle className="text-green-500 text-4xl" />;
            case 'error':
                return <FaTimesCircle className="text-red-500 text-4xl" />;
            case 'warning':
                return <FaExclamationCircle className="text-yellow-500 text-4xl" />;
            default:
                return <FaInfoCircle className="text-blue-500 text-4xl" />;
        }
    };

    const getButtonClass = () => {
        switch (type) {
            case 'success':
                return 'bg-green-600 hover:bg-green-700';
            case 'error':
                return 'bg-red-600 hover:bg-red-700';
            case 'warning':
                return 'bg-yellow-600 hover:bg-yellow-700';
            default:
                return 'bg-blue-600 hover:bg-blue-700';
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fade-in">
                <div className="absolute right-4 top-4">
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col items-center text-center">
                    <div className="mb-4">
                        {getIcon()}
                    </div>

                    <h2 className="text-xl font-semibold mb-2 text-gray-800">
                        {title}
                    </h2>

                    <div className="text-gray-600 mb-6">
                        {message}
                    </div>

                    <button
                        onClick={onClose}
                        className={`px-6 py-2 text-white rounded-md ${getButtonClass()} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default NotificationModal;
