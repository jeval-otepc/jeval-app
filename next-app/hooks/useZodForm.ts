import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
    generalFormSchema, 
    loginSchema, 
    questionResponseSchema,
    type GeneralFormData,
    type LoginData,
    type QuestionResponseData 
} from '@/lib/schemas/form-schemas';

// Specific hooks for each form type - no generics needed
export function useGeneralForm(defaultValues?: Partial<GeneralFormData>) {
    return useForm({
        resolver: zodResolver(generalFormSchema) as any,
        defaultValues,
        mode: 'onBlur',
        reValidateMode: 'onChange',
    });
}

export function useLoginForm(defaultValues?: Partial<LoginData>) {
    return useForm({
        resolver: zodResolver(loginSchema) as any,
        defaultValues,
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    });
}

export function useQuestionResponseForm(defaultValues?: Partial<QuestionResponseData>) {
    return useForm({
        resolver: zodResolver(questionResponseSchema) as any,
        defaultValues,
        mode: 'onChange',
    });
}

// Additional form hooks for other schemas
export function useChangePasswordForm() {
    return useForm({
        resolver: zodResolver(z.object({
            currentPassword: z.string().min(1, 'กรุณาระบุรหัสผ่านปัจจุบัน'),
            newPassword: z.string().min(6, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'),
            confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่'),
        }).refine((data) => data.newPassword === data.confirmPassword, {
            message: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน',
            path: ['confirmPassword'],
        })),
        mode: 'onBlur',
    });
}

export function useSearchForm() {
    return useForm({
        resolver: zodResolver(z.object({
            query: z.string().optional(),
            category: z.string().optional(),
            dateFrom: z.string().optional(),
            dateTo: z.string().optional(),
        })),
        mode: 'onChange',
    });
}

// Helper function to extract error messages
export function getFieldError(
    errors: FieldErrors,
    fieldName: string
): string | undefined {
    const error = errors[fieldName];
    return error?.message as string | undefined;
}

// Helper function to check if field has error
export function hasFieldError(
    errors: FieldErrors,
    fieldName: string
): boolean {
    return Boolean(errors[fieldName]);
}

// Helper function to get all error messages as array
export function getAllErrorMessages(errors: FieldErrors): string[] {
    const messages: string[] = [];
    
    Object.keys(errors).forEach(key => {
        const error = errors[key];
        if (error?.message) {
            messages.push(error.message as string);
        }
    });
    
    return messages;
}

// Helper function to format errors for display
export function formatFormErrors(errors: FieldErrors): Record<string, string> {
    const formatted: Record<string, string> = {};
    
    Object.keys(errors).forEach(key => {
        const error = errors[key];
        if (error?.message) {
            formatted[key] = error.message as string;
        }
    });
    
    return formatted;
}