import React from 'react';

interface RoleSwitcherProps {
    role: 'patient' | 'doctor';
    setRole: (role: 'patient' | 'doctor') => void;
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ role, setRole }) => {
    return (
        <div className="flex bg-gray-100 rounded-full p-1 mb-8 w-full max-w-sm mx-auto">
            <button
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${role === 'patient'
                        ? 'bg-white shadow text-gray-900'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                onClick={() => setRole('patient')}
            >
                Patient
            </button>
            <button
                className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${role === 'doctor'
                        ? 'bg-white shadow text-gray-900'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                onClick={() => setRole('doctor')}
            >
                Doctor
            </button>
        </div>
    );
};

export default RoleSwitcher;
