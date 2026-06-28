import { useState } from 'react';

export interface FormData {
    TypePos: string;
    Name_Pos: string;
    Num_Pos_M: string;
    Affiliation: string;
    EducationalInstitution: string;
    DateTimeInput_M: string;
}

export interface ValidationRules {
    [key: string]: string; // field name -> display name
}

export const useFormValidation = (initialData: FormData, requiredFields: ValidationRules) => {
    const [formData, setFormData] = useState<FormData>(initialData);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [showValidation, setShowValidation] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (showValidation && fieldErrors[name]) {
            setFieldErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    const handleDateChange = (value: string) => {
        setFormData(prev => ({ ...prev, DateTimeInput_M: value }));
    };

    const validateRequiredFields = (): boolean => {
        const errors: Record<string, string> = {};
        
        Object.entries(requiredFields).forEach(([fieldName, displayName]) => {
            if (!formData[fieldName as keyof FormData]?.trim()) {
                errors[fieldName] = `กรุณากรอก${displayName}`;
            }
        });

        setFieldErrors(errors);
        setShowValidation(true);
        
        return Object.keys(errors).length === 0;
    };

    const resetForm = () => {
        setFormData(initialData);
        setFieldErrors({});
        setShowValidation(false);
    };

    const hasValidationErrors = (): boolean => {
        if (!showValidation) return false;
        const errorMessages = Object.values(fieldErrors).filter(Boolean);
        return errorMessages.length > 0;
    };

    return {
        formData,
        fieldErrors,
        showValidation,
        handleInputChange,
        handleDateChange,
        validateRequiredFields,
        resetForm,
        hasValidationErrors,
        setFormData,
        setFieldErrors,
        setShowValidation
    };
};