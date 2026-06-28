// Loading State Management Utilities

export interface LoadingState {
    isLoading: boolean;
    error?: string;
    data?: any;
}

export interface AsyncState<T = any> extends LoadingState {
    data?: T;
    lastUpdated?: Date;
}

/**
 * Create async state manager hook
 */
export function createAsyncState<T = any>(initialData?: T): AsyncState<T> {
    return {
        isLoading: false,
        error: undefined,
        data: initialData,
        lastUpdated: undefined
    };
}

/**
 * Update async state with loading
 */
export function setAsyncLoading<T>(state: AsyncState<T>): AsyncState<T> {
    return {
        ...state,
        isLoading: true,
        error: undefined
    };
}

/**
 * Update async state with success
 */
export function setAsyncSuccess<T>(state: AsyncState<T>, data: T): AsyncState<T> {
    return {
        ...state,
        isLoading: false,
        error: undefined,
        data,
        lastUpdated: new Date()
    };
}

/**
 * Update async state with error
 */
export function setAsyncError<T>(state: AsyncState<T>, error: string): AsyncState<T> {
    return {
        ...state,
        isLoading: false,
        error
    };
}

/**
 * Multi-step loading state manager
 */
export interface ProcessStep {
    id: string;
    label: string;
    status: 'pending' | 'loading' | 'completed' | 'error';
    error?: string;
}

export interface ProcessState {
    currentStep: number;
    steps: ProcessStep[];
    isCompleted: boolean;
    hasError: boolean;
    overallProgress: number;
}

/**
 * Create process state
 */
export function createProcessState(steps: Omit<ProcessStep, 'status'>[]): ProcessState {
    return {
        currentStep: 0,
        steps: steps.map(step => ({ ...step, status: 'pending' })),
        isCompleted: false,
        hasError: false,
        overallProgress: 0
    };
}

/**
 * Update process step
 */
export function updateProcessStep(
    state: ProcessState, 
    stepId: string, 
    status: ProcessStep['status'], 
    error?: string
): ProcessState {
    const steps = state.steps.map(step => {
        if (step.id === stepId) {
            return { ...step, status, error };
        }
        return step;
    });
    
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const hasError = steps.some(s => s.status === 'error');
    const currentStepIndex = steps.findIndex(s => s.status === 'loading');
    
    return {
        ...state,
        steps,
        currentStep: currentStepIndex >= 0 ? currentStepIndex : Math.min(completedSteps, steps.length - 1),
        isCompleted: completedSteps === steps.length && !hasError,
        hasError,
        overallProgress: (completedSteps / steps.length) * 100
    };
}

/**
 * Progress to next step
 */
export function progressToNextStep(state: ProcessState): ProcessState {
    const currentIndex = state.currentStep;
    const nextIndex = Math.min(currentIndex + 1, state.steps.length - 1);
    
    const steps = state.steps.map((step, index) => {
        if (index === currentIndex) {
            return { ...step, status: 'completed' as const };
        }
        if (index === nextIndex) {
            return { ...step, status: 'loading' as const };
        }
        return step;
    });
    
    return {
        ...state,
        steps,
        currentStep: nextIndex,
        overallProgress: ((currentIndex + 1) / state.steps.length) * 100
    };
}

/**
 * Component loading states
 */
export const LoadingSpinnerVariants = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6', 
    large: 'w-8 h-8'
} as const;

export const LoadingMessages = {
    loading: 'กำลังโหลด...',
    saving: 'กำลังบันทึก...',
    submitting: 'กำลังส่งข้อมูล...',
    processing: 'กำลังประมวลผล...',
    validating: 'กำลังตรวจสอบข้อมูل...',
    connecting: 'กำลังเชื่อมต่อ...'
} as const;

/**
 * Create loading message with dots animation
 */
export function createLoadingMessage(
    baseMessage: string, 
    dotsCount: number = 3,
    animationSpeed: number = 500
): string {
    const dots = '.'.repeat(dotsCount);
    return `${baseMessage}${dots}`;
}