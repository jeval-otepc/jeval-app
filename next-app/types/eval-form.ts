// Shared types for evaluation form

export interface Question {
    No: number;
    Title: string;
    id: number;
    answers: Array<{ id: number; No: number; Title: string }>;
}

export interface FormId {
    id: string;
    idNumber: number;
}

export interface ResultData {
    TypePos: string;
    formData: Record<string, unknown>;
    khScoreConvt: number;
    psScoreConvt: number; 
    acScoreConvt: number;
    totalScore: number;
    ResultSummary: boolean;
}

export interface ProcessStatus {
    step: number;
    message: string;
    isLoading: boolean;
    error?: string;
}

export interface FormData {
    TypePos: string;
    Name_Pos: string;
    Num_Pos_M: string;
    Affiliation: string;
    EducationalInstitution: string;
    DateTimeInput_M: string;
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface FormSubmissionResult {
    success: boolean;
    data?: any;
    errors?: ValidationError[];
    message?: string;
}

export interface QuestionResponse {
    questionId: number;
    questionNo: number;
    value: string;
    memo?: string;
}

export interface EvaluationScore {
    khScore: number;
    psScore: number; 
    acScore: number;
    totalScore: number;
}

export type FormStep = 'general' | 'questions' | 'result';
export type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';