// API Helper Utilities

export interface ApiResponse<T = any> {
    data?: T;
    error?: {
        message: string;
        details?: any;
        status?: number;
    };
    meta?: any;
}

export interface ApiError {
    message: string;
    status: number;
    details?: any;
}

/**
 * Handle API response and extract data
 */
export function handleApiResponse<T>(response: any): ApiResponse<T> {
    if (response.error) {
        return {
            error: {
                message: response.error.message || 'API Error',
                details: response.error,
                status: response.error.status || 500,
            },
        };
    }

    return {
        data: response.data || response,
        meta: response.meta,
    };
}

/**
 * Create API error object
 */
export function createApiError(
    message: string,
    status: number = 500,
    details?: any,
): ApiError {
    return {
        message,
        status,
        details,
    };
}

/**
 * Check if response has error
 */
export function hasApiError(response: any): boolean {
    return !!(response.error || (response.status && response.status >= 400));
}

/**
 * Extract error message from various error formats
 */
export function extractErrorMessage(error: any): string {
    if (typeof error === 'string') {
        return error;
    }

    if (error?.message) {
        return error.message;
    }

    if (error?.error?.message) {
        return error.error.message;
    }

    if (error?.details?.message) {
        return error.details.message;
    }

    return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
}

/**
 * Format validation errors from API
 */
export function formatValidationErrors(errors: any): Record<string, string> {
    const formatted: Record<string, string> = {};

    if (!errors) return formatted;

    // Handle Strapi validation error format
    if (Array.isArray(errors)) {
        errors.forEach((error: any) => {
            if (error.path && error.message) {
                formatted[error.path.join('.')] = error.message;
            }
        });
    } else if (typeof errors === 'object') {
        Object.keys(errors).forEach((key) => {
            const error = errors[key];
            if (Array.isArray(error) && error.length > 0) {
                formatted[key] = error[0];
            } else if (typeof error === 'string') {
                formatted[key] = error;
            }
        });
    }

    return formatted;
}

/**
 * Create loading state manager
 */
export function createLoadingState<T extends string>() {
    const loadingStates: Record<T, boolean> = {} as Record<T, boolean>;

    return {
        isLoading: (key: T): boolean => Boolean(loadingStates[key]),
        setLoading: (key: T, loading: boolean) => {
            loadingStates[key] = loading;
        },
        getAllLoading: (): Record<T, boolean> => ({ ...loadingStates }),
        isAnyLoading: (): boolean => Object.values(loadingStates).some(Boolean),
    };
}

/**
 * Debounce function for API calls
 */
export function debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number,
): T & { cancel: () => void } {
    let timeout: NodeJS.Timeout | undefined;

    const debounced = ((...args: any[]) => {
        const later = () => {
            timeout = undefined;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    }) as T & { cancel: () => void };

    debounced.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        }
    };

    return debounced;
}

/**
 * Retry API call with exponential backoff
 */
export async function retryApiCall<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            lastError = error;

            if (attempt === maxRetries) {
                break;
            }

            // Exponential backoff: baseDelay * 2^attempt
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
    data: Record<string, any>,
    requiredFields: string[],
): { isValid: boolean; missingFields: string[] } {
    const missingFields = requiredFields.filter((field) => {
        const value = data[field];
        return value === undefined || value === null || value === '';
    });

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
}

/**
 * Sanitize data before API submission
 */
export function sanitizeApiData<T extends Record<string, any>>(data: T): T {
    const sanitized: Record<string, any> = { ...data };

    Object.keys(sanitized).forEach((key) => {
        const value = sanitized[key];

        // Remove empty strings, null, undefined
        if (value === '' || value === null || value === undefined) {
            delete sanitized[key];
        }

        // Trim strings
        if (typeof value === 'string') {
            sanitized[key] = value.trim();
        }
    });

    return sanitized as T;
}
