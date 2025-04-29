import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaExclamationTriangle } from 'react-icons/fa';

const RoleChangeSelfConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    darkMode,
    selectedRole
}) => {
    const [mounted, setMounted] = useState(false);
    const [animation, setAnimation] = useState(false);

    // Handle mount/unmount animations
    useEffect(() => {
        if (isOpen && !mounted) {
            setMounted(true);
            // Trigger animation after mount
            setTimeout(() => setAnimation(true), 10);
        } else if (!isOpen && mounted) {
            setAnimation(false);
            // Delay unmount to complete animation
            setTimeout(() => setMounted(false), 300);
        }
    }, [isOpen, mounted]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!mounted) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div
                className={`fixed inset-0 transition-opacity duration-300 ${animation ? 'opacity-50' : 'opacity-0'
                    } ${darkMode ? 'bg-black' : 'bg-gray-900'}`}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-md p-6 rounded-xl shadow-2xl transform transition-all duration-300 ${animation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    } ${darkMode
                        ? 'bg-gray-800 text-white border border-gray-700'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col">
                    <div className="flex items-center mb-4">
                        <FaExclamationTriangle className="text-3xl text-yellow-500 mr-3" />
                        <h3 className="text-xl font-bold">Change Your Role?</h3>
                    </div>

                    <p className={`mb-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Warning: You are about to change your own role to <span className="font-bold">{selectedRole}</span>.
                        This will update your permissions and may redirect you.
                    </p>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${darkMode
                                ? 'bg-gray-700 text-white hover:bg-gray-600'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-md"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Use portal to render at the end of the document body
    return createPortal(modalContent, document.body);
};

export default RoleChangeSelfConfirmModal; 