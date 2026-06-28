'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface EvalStepperProps {
    /** Active step: 1 = ข้อมูลทั่วไป, 2 = แบบประเมิน, 3 = ผลการประเมิน */
    currentStep: 1 | 2 | 3;
    /** Optional "(3/12)" badge shown next to step 2 while answering */
    questionProgress?: string;
}

const STEPS = [
    { n: 1, label: 'ข้อมูลทั่วไป' },
    { n: 2, label: 'แบบประเมิน' },
    { n: 3, label: 'ผลการประเมิน' },
] as const;

export function EvalStepper({ currentStep, questionProgress }: EvalStepperProps) {
    return (
        <div className="px-8 py-6 border-b">
            <ol className="flex items-center justify-center">
                {STEPS.map((step, i) => {
                    const isDone = currentStep > step.n;
                    const isCurrent = currentStep === step.n;
                    return (
                        <React.Fragment key={step.n}>
                            <li className="flex items-center" aria-current={isCurrent ? 'step' : undefined}>
                                <span
                                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                                        isCurrent
                                            ? 'bg-indigo-700 text-white'
                                            : isDone
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                    }`}
                                >
                                    {isDone ? <Check className="h-5 w-5" aria-label="เสร็จแล้ว" /> : step.n}
                                </span>
                                <span
                                    className={`ml-3 text-base font-medium ${
                                        isCurrent ? 'text-indigo-700' : isDone ? 'text-gray-700' : 'text-gray-500'
                                    }`}
                                >
                                    {step.label}
                                </span>
                                {step.n === 2 && isCurrent && questionProgress && (
                                    <span className="ml-2 text-sm text-gray-500">{questionProgress}</span>
                                )}
                            </li>
                            {i < STEPS.length - 1 && (
                                <div
                                    className={`mx-4 h-0.5 w-12 ${
                                        currentStep > step.n ? 'bg-green-600' : 'bg-gray-200'
                                    }`}
                                    aria-hidden="true"
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </ol>
        </div>
    );
}
