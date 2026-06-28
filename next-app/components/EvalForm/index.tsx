'use client';

import React from 'react';
import { EvalFormProvider, useEvalForm } from './EvalFormProvider';
import { GeneralInfoStep } from './GeneralInfoStep';
import { QuestionStep } from './QuestionStep';
import { ResultDisplay } from './ResultDisplay';
import { EvalStepper } from './EvalStepper';
import { EvalHero } from './EvalHero';

function EvalFormContent() {
    const { currentStep, currentQuestionIndex, questions, showResult } = useEvalForm();

    if (showResult) {
        return <ResultDisplay />;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {/* Hero Section */}
            <EvalHero
                title="ระบบประเมินค่างาน"
                subtitles={[
                    'เพื่อกำหนดตำแหน่งบุคลากรทางการศึกษาอื่นตามมาตรา 38 ค.(2)',
                    'ประเภทวิชาการ ระดับเชี่ยวชาญ และประเภทอำนวยการ ระดับสูง',
                ]}
                showLogo
            />

            {/* Stepper Header */}
            <EvalStepper
                currentStep={currentStep === 1 ? 1 : 2}
                questionProgress={
                    currentStep === 2 && questions.length > 0
                        ? `(${currentQuestionIndex + 1}/${questions.length})`
                        : undefined
                }
            />

            {/* Form Content */}
            <div className="p-8">
                {currentStep === 1 && <GeneralInfoStep />}
                {currentStep === 2 && <QuestionStep />}
            </div>
        </div>
    );
}

export interface EvalFormProps {
    /**
     * Whether to show the eval form automatically
     * @default true
     */
    autoShow?: boolean;
    
    /**
     * Custom className for the container
     */
    className?: string;

    /**
     * Callback when form is completed
     */
    onComplete?: (result: any) => void;
}

export function EvalForm({ 
    autoShow = true, 
    className = "",
    onComplete 
}: EvalFormProps = {}) {
    return (
        <div className={`w-full ${className}`}>
            <EvalFormProvider>
                <EvalFormContent />
            </EvalFormProvider>
        </div>
    );
}

// Named exports for individual components if needed
export { EvalFormProvider, useEvalForm } from './EvalFormProvider';
export { GeneralInfoStep } from './GeneralInfoStep';
export { QuestionStep } from './QuestionStep';
export { ResultDisplay } from './ResultDisplay';