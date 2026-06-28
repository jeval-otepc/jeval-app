'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useFormValidation, type FormData } from '@/hooks/useFormValidation';
import { useNotification } from '@/contexts/NotificationContext';
import { ApiService } from '@/lib/api';
import { PositionType } from '@/components/PositionSelect';

// Types
export interface Question {
    No: number;
    Title: string;
    id: number;
    answers: Array<{ id: number; No: number; Title: string; Code: string }>;
}

export interface FormId {
    id: string;
    idNumber: number | string;
}

export interface ResultData {
    TypePos: string;
    formData: Record<string, unknown>;
    khScoreConvt: number;
    psScoreConvt: number;
    acScoreConvt: number;
    totalScore: number;
    ResultScore: boolean; // ผ่านค่าคะแนน: total อยู่ในช่วง min–max ตาม TypePos
    ResultSummary: boolean;
}

export interface ProcessStatus {
    step: number;
    message: string;
    isLoading: boolean;
    error?: string;
}

// Context interface
interface EvalFormContextType {
    // Form state
    currentStep: number;
    currentQuestionIndex: number;
    questions: Question[];
    positionTypes: PositionType[];
    formId: FormId | null;
    showResult: boolean;
    resultData: ResultData | null;
    processStatus: ProcessStatus;

    // Form validation
    formData: FormData;
    fieldErrors: Record<string, string>;
    showValidation: boolean;

    // Actions
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleDateChange: (value: string) => void;
    handleQuestionChange: (questionNo: number, value: string, memo?: string) => void;
    saveGeneralForm: (e: React.FormEvent) => Promise<void>;
    nextStep: () => Promise<void>;
    prevStep: () => void;
    submitEvaluation: () => Promise<void>;
    resetForm: () => void;

    // Setters
    setCurrentStep: (step: number) => void;
    setCurrentQuestionIndex: (index: number) => void;
    setQuestions: (questions: Question[]) => void;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    setShowResult: (show: boolean) => void;
    setResultData: (data: ResultData | null) => void;
}

const EvalFormContext = createContext<EvalFormContextType | undefined>(undefined);

// Required fields configuration
const requiredFields = {
    TypePos: 'ประเภทตำแหน่ง',
    Name_Pos: 'ชื่อตำแหน่ง',
    Num_Pos_M: 'เลขที่ตำแหน่ง',
};

// Today's date as YYYY-MM-DD — same format the date picker emits, so the
// "วัน-เวลา ที่รับเรื่อง" field defaults to today (เจ้าหน้าที่กรอกในวันที่รับเรื่อง).
const getTodayIso = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Initial form data
const initialFormData: FormData = {
    TypePos: '',
    Name_Pos: '',
    Num_Pos_M: '',
    Affiliation: '',
    EducationalInstitution: '',
    DateTimeInput_M: getTodayIso(),
};

interface EvalFormProviderProps {
    children: ReactNode;
}

export function EvalFormProvider({ children }: EvalFormProviderProps) {
    const { success, error, warning } = useNotification();

    // Form stepper state
    const [currentStep, setCurrentStep] = useState(1);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [positionTypes, setPositionTypes] = useState<PositionType[]>([]);

    // Initialize form validation
    const {
        formData,
        fieldErrors,
        showValidation,
        handleInputChange,
        handleDateChange,
        validateRequiredFields,
        setFormData,
        setFieldErrors,
        setShowValidation,
    } = useFormValidation(initialFormData, requiredFields);

    // Form results state
    const [formId, setFormId] = useState<FormId | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [resultData, setResultData] = useState<ResultData | null>(null);

    // Process status tracking
    const [processStatus, setProcessStatus] = useState<ProcessStatus>({
        step: 0,
        message: '',
        isLoading: false,
    });

    // Helper function to get position type name
    const getPositionTypeName = (typeId: string) => {
        const positionType = positionTypes.find(
            (type: PositionType) => type.PositionTypeID === typeId,
        );
        return positionType ? positionType.PositionTypeName : typeId;
    };

    // Save only general form data (Step 1)
    const saveGeneralForm = async (e: React.FormEvent) => {
        console.log('🚀 === GENERAL FORM SUBMISSION STARTED ===');

        e.preventDefault();
        console.log('✅ Step 1: Default form submission prevented');

        // Extract form data
        const formElement = e.target as HTMLFormElement;
        const formGeneralData = new FormData(formElement);

        // Transform data to object
        const transformedData: Record<string, string> = {};
        formGeneralData.forEach((value, key) => {
            transformedData[key] = value as string;
        });

        // 🐛 บังคับใช้ค่าวันที่แบบ ISO จาก React State (formData)
        // แทนที่จะใช้ค่าภาษาไทยที่ถูกแสดงบนหน้าจอ (DOM)
        if (formData.DateTimeInput_M) {
            transformedData.DateTimeInput_M = formData.DateTimeInput_M;
        }

        console.log('✅ Step 3: Data transformation completed');

        // Validate required fields
        if (!validateRequiredFields()) {
            console.log('❌ Validation failed - Form has errors');
            const errorMessages = Object.values(fieldErrors).filter(
                (error) => error,
            );

            if (errorMessages.length > 0) {
                warning('กรุณากรอกข้อมูลให้ครบถ้วน', errorMessages[0]);
            }
            return;
        }
        console.log('✅ Step 5: All required fields validated successfully');

        // Make API call
        try {
            const processedData = { ...transformedData };
            console.log('🚀 Step 6: Sending API request...');

            const responseData = await ApiService.createForm(processedData);

            if (responseData.data) {
                console.log('✅ Step 7: API response successful');

                // Extract IDs from response
                let id = null;
                let idNumber = null;

                if (responseData.data.documentId) {
                    id = responseData.data.documentId;
                } else if (responseData.data.id) {
                    id = responseData.data.id;
                }

                if (responseData.data.id) {
                    idNumber = responseData.data.id;
                } else if (responseData.data.documentId) {
                    idNumber = responseData.data.documentId;
                }

                if (id && idNumber) {
                    // Update form ID state
                    setFormId({ id: String(id), idNumber: idNumber });

                    // Update form data state
                    setFormData((prev: FormData) => {
                        const updatedFormData = { ...prev, ...transformedData } as FormData;
                        return updatedFormData;
                    });

                    success('บันทึกข้อมูลสำเร็จ', 'ข้อมูลถูกบันทึกเรียบร้อย');
                    setCurrentStep(2);

                    // Load questions and forms data
                    console.log('📡 Loading questions and forms data...');
                    try {
                        const [questionsData, formsData] = await Promise.all([
                            ApiService.getQuestions(),
                            ApiService.getForms(),
                        ]);
                        setQuestions(questionsData.data || []);
                        setCurrentQuestionIndex(0);
                        console.log('✅ Questions loaded successfully');
                    } catch (err) {
                        console.error('❌ Failed to load questions:', err);
                    }

                    console.log('✅ === GENERAL FORM SUBMISSION COMPLETED SUCCESSFULLY ===');
                } else {
                    console.log('❌ Could not extract valid IDs from response');
                    error('เกิดข้อผิดพลาด', 'ไม่สามารถดึง ID ได้');
                }
            } else {
                console.log('❌ Unexpected response structure');
                error('เกิดข้อผิดพลาด', 'ไม่สามารถตอบสนองจากเซิร์ฟเวอร์');
            }
        } catch (err) {
            console.log('💥 === FORM SUBMISSION ERROR ===');
            console.error('❌ API Error:', err);

            if (err instanceof Error) {
                if (err.message.includes('401')) {
                    error('กรุณาเข้าสู่ระบบใหม่', 'Session หมดอายุ');
                } else if (err.message.includes('403')) {
                    error('ไม่มีสิทธิ์ในการเข้าถึง', 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
                } else {
                    error('เกิดข้อผิดพลาด', err.message);
                }
            } else {
                error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
            }
        }
    };

    // Handle question answers
    const handleQuestionChange = (
        questionNo: number,
        value: string,
        memo = '',
    ) => {
        setFormData((prev: FormData) => ({
            ...prev,
            [`Q${questionNo}`]: value,
            [`Q${questionNo}_Memo`]: memo,
        }));
    };

    // Navigate between steps and questions with incremental save
    const nextStep = async () => {
        console.log('🔘 NextStep button clicked');

        if (currentStep === 1) {
            setCurrentStep(2);
            setCurrentQuestionIndex(0);
        } else if (currentStep === 2) {
            const currentQuestion = questions[currentQuestionIndex];

            if (currentQuestion && !(formData as any)[`Q${currentQuestion.No}`]) {
                warning('กรุณาเลือก 1 รายการ', 'กรุณาเลือกคำตอบสำหรับคำถามนี้');
                return;
            }

            // Save current form data after answering each question
            if (formId && formId.id) {
                console.log('💾 Saving current form data incrementally...');
                try {
                    const updateResponse = await ApiService.updateForm(
                        formId.id,
                        formData,
                    );
                    if (updateResponse.error) {
                        console.error('❌ Incremental save failed:', updateResponse.error);
                        error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
                        return;
                    }
                    console.log('✅ Incremental save successful');
                } catch (err) {
                    console.error('❌ Incremental save error:', err);
                    error('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
                    return;
                }
            }

            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                // Last question - process evaluation
                submitEvaluation();
            }
        }
    };

    const prevStep = () => {
        if (currentStep === 2 && currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        } else if (currentStep === 2 && currentQuestionIndex === 0) {
            setCurrentStep(1);
        }
    };

    // Process evaluation (analysis only - data already saved incrementally)
    const submitEvaluation = async () => {
        console.log('🎯 ProcessEvaluation function called (analysis only)');

        if (!formId) {
            error('ไม่พบรหัสฟอร์ม', 'กรุณาบันทึกข้อมูลทั่วไปก่อน');
            return;
        }

        try {
            setProcessStatus({
                step: 1,
                message: 'กำลังประมวลผลการประเมิน...',
                isLoading: true,
            });

            await getResults();
        } catch (err) {
            console.error('💥 === ANALYSIS PROCESS FAILED ===');
            setProcessStatus({
                step: 0,
                message: '',
                isLoading: false,
                error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการประมวลผล',
            });

            const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการประมวลผล';
            error('เกิดข้อผิดพลาด', errorMsg);
        }
    };

    // Get evaluation results
    const getResults = async () => {
        if (!formId) {
            console.log('❌ getResults: No formId available');
            return;
        }

        try {
            console.log('🔍 === ANALYSIS STEP STARTED ===');
            const data = await ApiService.analyzeForm(formId.id);

            if (data.error) {
                console.log('❌ Analysis API returned error:', data.error);
                throw new Error('เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล');
            }

            setProcessStatus({
                step: 3,
                message: 'แสดงผลการประเมิน',
                isLoading: false,
            });

            setResultData(data);
            setShowResult(true);

            console.log('🎉 === EVALUATION PROCESS COMPLETED SUCCESSFULLY ===');
        } catch (err) {
            console.error('💥 Failed to analyze form:', err);
            setProcessStatus({
                step: 0,
                message: '',
                isLoading: false,
                error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงผลการประเมิน',
            });
            throw err;
        }
    };

    // Reset form
    const resetForm = () => {
        setShowResult(false);
        setCurrentStep(1);
        setCurrentQuestionIndex(0);
        setFormData({
            TypePos: '',
            Name_Pos: '',
            Num_Pos_M: '',
            Affiliation: '',
            EducationalInstitution: '',
            DateTimeInput_M: getTodayIso(),
        });
        setFormId(null);
        setResultData(null);
        setFieldErrors({});
        setShowValidation(false);
        setProcessStatus({
            step: 0,
            message: '',
            isLoading: false,
        });
    };

    const contextValue: EvalFormContextType = {
        // Form state
        currentStep,
        currentQuestionIndex,
        questions,
        positionTypes,
        formId,
        showResult,
        resultData,
        processStatus,

        // Form validation
        formData,
        fieldErrors,
        showValidation,

        // Actions
        handleInputChange,
        handleDateChange,
        handleQuestionChange,
        saveGeneralForm,
        nextStep,
        prevStep,
        submitEvaluation,
        resetForm,

        // Setters
        setCurrentStep,
        setCurrentQuestionIndex,
        setQuestions,
        setFormData,
        setShowResult,
        setResultData,
    };

    return (
        <EvalFormContext.Provider value={contextValue}>
            {children}
        </EvalFormContext.Provider>
    );
}

export function useEvalForm() {
    const context = useContext(EvalFormContext);
    if (context === undefined) {
        throw new Error('useEvalForm must be used within an EvalFormProvider');
    }
    return context;
}