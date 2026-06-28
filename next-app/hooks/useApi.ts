import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { handleApiResponse, extractErrorMessage } from '@/lib/utils/api-helpers';
import type { 
    Question, 
    FormData, 
    FormSubmissionResult,
    PositionType,
    ApiResponse 
} from '@/types';

// Query Keys
export const queryKeys = {
    questions: ['questions'] as const,
    positions: ['positions'] as const,
    forms: ['forms'] as const,
    form: (id: string) => ['forms', id] as const,
    user: ['user'] as const,
};

// Questions Hook
export function useQuestions() {
    const { user } = useAuth();

    return useQuery({
        queryKey: queryKeys.questions,
        queryFn: async (): Promise<Question[]> => {
            const response = await ApiService.get('/api/questions');
            const result = handleApiResponse<Question[]>(response);
            
            if (result.error) {
                throw new Error(result.error.message);
            }
            
            return result.data || [];
        },
        enabled: !!user, // Only fetch when user is authenticated
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

// Positions Hook
export function usePositions() {
    return useQuery({
        queryKey: queryKeys.positions,
        queryFn: async (): Promise<PositionType[]> => {
            const response = await ApiService.get('/api/position-types');
            const result = handleApiResponse<PositionType[]>(response);
            
            if (result.error) {
                throw new Error(result.error.message);
            }
            
            return result.data || [];
        },
        staleTime: 30 * 60 * 1000, // 30 minutes (positions don't change often)
    });
}

// Form Submission Hook
export function useFormSubmission() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (formData: FormData): Promise<FormSubmissionResult> => {
            if (!user) {
                throw new Error('User must be authenticated');
            }

            const response = await ApiService.post('/api/forms', {
                data: formData
            });

            const result = handleApiResponse(response);
            
            if (result.error) {
                return {
                    success: false,
                    message: result.error.message,
                    errors: [{ field: 'general', message: result.error.message }]
                };
            }

            return {
                success: true,
                data: result.data,
                message: 'บันทึกข้อมูลสำเร็จ'
            };
        },
        onSuccess: (data) => {
            if (data.success) {
                // Invalidate related queries
                queryClient.invalidateQueries({ queryKey: queryKeys.forms });
            }
        },
        onError: (error: any) => {
            console.error('Form submission error:', error);
        }
    });
}

// Question Response Submission Hook
export function useQuestionSubmission() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ 
            formId, 
            responses 
        }: { 
            formId: string; 
            responses: Array<{ questionNo: number; value: string; memo?: string }> 
        }) => {
            const response = await ApiService.post(`/api/forms/${formId}/responses`, {
                data: { responses }
            });

            const result = handleApiResponse(response);
            
            if (result.error) {
                throw new Error(result.error.message);
            }

            return result.data;
        },
        onSuccess: (_, variables) => {
            // Invalidate form-specific queries
            queryClient.invalidateQueries({ 
                queryKey: queryKeys.form(variables.formId) 
            });
        }
    });
}

// User Profile Hook
export function useUserProfile() {
    const { user } = useAuth();

    return useQuery({
        queryKey: queryKeys.user,
        queryFn: async () => {
            const response = await ApiService.get('/api/users/me');
            const result = handleApiResponse(response);
            
            if (result.error) {
                throw new Error(result.error.message);
            }
            
            return result.data;
        },
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Forms List Hook
export function useForms(filters?: { 
    page?: number; 
    limit?: number; 
    status?: string 
}) {
    const { user } = useAuth();

    return useQuery({
        queryKey: [...queryKeys.forms, filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.page) params.set('page', filters.page.toString());
            if (filters?.limit) params.set('limit', filters.limit.toString());
            if (filters?.status) params.set('status', filters.status);

            const url = `/api/forms${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await ApiService.get(url);
            const result = handleApiResponse(response);
            
            if (result.error) {
                throw new Error(result.error.message);
            }
            
            return result.data;
        },
        enabled: !!user,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

// Form Detail Hook
export function useForm(formId: string) {
    const { user } = useAuth();

    return useQuery({
        queryKey: queryKeys.form(formId),
        queryFn: async () => {
            const response = await ApiService.get(`/api/forms/${formId}`);
            const result = handleApiResponse(response);
            
            if (result.error) {
                throw new Error(result.error.message);
            }
            
            return result.data;
        },
        enabled: !!user && !!formId,
    });
}