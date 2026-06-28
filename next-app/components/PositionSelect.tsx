import { useState, useEffect } from 'react';
import { ApiService } from '@/lib/api';

interface PositionType {
    id: number;
    documentId: string;
    PositionTypeID: string;
    PositionTypeName: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
}

interface PositionSelectProps {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    showValidation?: boolean;
    hasError?: boolean;
    errorMessage?: string;
    required?: boolean;
}

export default function PositionSelect({
    name,
    value,
    onChange,
    showValidation = false,
    hasError = false,
    errorMessage = '',
    required = false
}: PositionSelectProps) {
    const [positionTypes, setPositionTypes] = useState<PositionType[]>([]);

    useEffect(() => {
        const loadPositionTypes = async () => {
            try {
                const response = await ApiService.getPositionTypes();
                console.log('Position types loaded:', response);
                setPositionTypes(response.data || []);
            } catch (error) {
                console.error('Error loading position types:', error);
                // Fallback to default position types if API fails
                setPositionTypes([
                    {
                        id: 1,
                        documentId: 'fallback-spec',
                        PositionTypeID: '34',
                        PositionTypeName: 'วิชาการ',
                        createdAt: '',
                        updatedAt: '',
                        publishedAt: '',
                    },
                    {
                        id: 2,
                        documentId: 'fallback-admin',
                        PositionTypeID: '10',
                        PositionTypeName: 'อำนวยการ',
                        createdAt: '',
                        updatedAt: '',
                        publishedAt: '',
                    },
                ]);
            }
        };

        loadPositionTypes();
    }, []);


    return (
        <div>
            <label
                htmlFor={name}
                className="block text-sm font-medium text-gray-700 mb-2"
            >
                ประเภทตำแหน่ง
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
                name={name}
                aria-label="ประเภทตำแหน่ง"
                value={value}
                onChange={onChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white text-gray-900 ${
                    showValidation && hasError
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                required={required}
            >
                <option value="">ประเภทตำแหน่ง</option>
                {positionTypes.map((type) => (
                    <option key={type.id} value={type.PositionTypeID}>
                        {type.PositionTypeName}
                    </option>
                ))}
            </select>
            {showValidation && hasError && (
                <div className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errorMessage}
                </div>
            )}
        </div>
    );
}

// Export the helper function for use in other components
export { PositionSelect };
export type { PositionType };