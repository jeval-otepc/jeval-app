// Common shared types

export interface BaseEntity {
    id: number | string;
    createdAt?: string;
    updatedAt?: string;
}

export interface TimestampFields {
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
}

export interface SelectOption<T = string> {
    value: T;
    label: string;
    disabled?: boolean;
    description?: string;
    group?: string;
}

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
    required?: boolean;
    placeholder?: string;
    options?: SelectOption[];
    validation?: ValidationRule[];
    disabled?: boolean;
    hidden?: boolean;
}

export interface ValidationRule {
    type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
    value?: any;
    message: string;
    validator?: (value: any) => boolean;
}

export interface NotificationMessage {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    duration?: number;
    actions?: NotificationAction[];
    persistent?: boolean;
}

export interface NotificationAction {
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'danger';
}

export interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    color?: string;
    className?: string;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'small' | 'medium' | 'large' | 'xl';
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
}

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    showPageSize?: boolean;
    maxVisiblePages?: number;
}

export interface SearchFilters {
    query?: string;
    category?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface BreadcrumbItem {
    label: string;
    href?: string;
    active?: boolean;
}

export interface MenuItem {
    id: string;
    label: string;
    href?: string;
    icon?: string;
    children?: MenuItem[];
    active?: boolean;
    disabled?: boolean;
}

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'th' | 'en';
export type Status = 'active' | 'inactive' | 'pending' | 'archived';

export interface UserPreferences {
    theme: Theme;
    language: Language;
    notifications: boolean;
    emailUpdates: boolean;
    timezone?: string;
}