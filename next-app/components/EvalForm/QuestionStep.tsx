'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useEvalForm } from './EvalFormProvider';

export function QuestionStep() {
    const {
        questions,
        currentQuestionIndex,
        formData,
        processStatus,
        handleQuestionChange,
        nextStep,
        prevStep,
    } = useEvalForm();

    if (questions.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <div className="text-sm text-gray-600">กำลังโหลดคำถาม...</div>
            </div>
        );
    }

    const question = questions[currentQuestionIndex];
    
    if (!question) {
        return (
            <div className="text-center py-8">
                <div className="text-sm text-gray-600">ไม่พบคำถาม</div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    ข้อที่ {currentQuestionIndex + 1}
                </h3>
                <p className="text-lg text-gray-700 mb-4">{question?.Title}</p>
            </div>

            <div className="space-y-3 mb-8">
                {[...(question?.answers || [])]
                    .sort((a, b) => {
                        const codeA = a.Code || '';
                        const codeB = b.Code || '';
                        return codeA.localeCompare(codeB, undefined, { numeric: true });
                    })
                    .map((answer) => {
                        const selected =
                            (formData as any)[`Q${question.No}`] === String(answer.No);
                        return (
                            <label
                                key={answer.id}
                                htmlFor={`ans${answer.id}`}
                                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors duration-200 ${
                                    selected
                                        ? 'border-indigo-700 bg-indigo-50'
                                        : 'border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <input
                                    type="radio"
                                    id={`ans${answer.id}`}
                                    name={`Q${question.No}`}
                                    value={answer.No}
                                    checked={selected}
                                    onChange={(e) =>
                                        handleQuestionChange(
                                            question.No,
                                            e.target.value,
                                        )
                                    }
                                    className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700 focus:ring-indigo-600 border-gray-300"
                                />
                                <span className="text-base text-gray-800">
                                    {answer.Title}
                                </span>
                            </label>
                        );
                    })}
            </div>

            <div className="mb-8">
                <label
                    htmlFor={`Q${question?.No}_Memo`}
                    className="block text-base font-medium text-gray-700 mb-2"
                >
                    เหตุผล
                </label>
                <textarea
                    id={`Q${question?.No}_Memo`}
                    name={`Q${question?.No}_Memo`}
                    value={(formData as any)[`Q${question?.No}_Memo`] || ''}
                    onChange={(e) =>
                        handleQuestionChange(
                            question?.No,
                            (formData as any)[`Q${question?.No}`],
                            e.target.value,
                        )
                    }
                    rows={4}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="กรอกเหตุผล (ถ้ามี)"
                />
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                    ก่อนหน้า
                </button>
                <button
                    type="button"
                    onClick={nextStep}
                    disabled={processStatus.isLoading}
                    className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
                        processStatus.isLoading
                            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                            : 'bg-indigo-700 text-white hover:bg-indigo-800'
                    }`}
                >
                    {processStatus.isLoading ? (
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {processStatus.message}
                        </div>
                    ) : currentQuestionIndex === questions.length - 1 ? (
                        'บันทึกและประมวลผล'
                    ) : (
                        'ถัดไป'
                    )}
                </button>
            </div>

            {/* Process Status */}
            {processStatus.step > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                        สถานะการประมวลผล
                    </h4>
                    <div className="space-y-2">
                        <div
                            className={`flex items-center text-sm ${
                                processStatus.step >= 1
                                    ? 'text-green-600'
                                    : 'text-gray-400'
                            }`}
                        >
                            <div
                                className={`w-4 h-4 rounded-full mr-2 ${
                                    processStatus.step >= 1
                                        ? 'bg-green-500'
                                        : 'bg-gray-300'
                                }`}
                            ></div>
                            ขั้นตอนที่ 1: กำลังบันทึกข้อมูลการประเมิน
                        </div>
                        <div
                            className={`flex items-center text-sm ${
                                processStatus.step >= 2
                                    ? 'text-green-600'
                                    : 'text-gray-400'
                            }`}
                        >
                            <div
                                className={`w-4 h-4 rounded-full mr-2 ${
                                    processStatus.step >= 2
                                        ? 'bg-green-500'
                                        : 'bg-gray-300'
                                }`}
                            ></div>
                            ขั้นตอนที่ 2: กำลังประมวลผลคะแนน
                        </div>
                        <div
                            className={`flex items-center text-sm ${
                                processStatus.step >= 3
                                    ? 'text-green-600'
                                    : 'text-gray-400'
                            }`}
                        >
                            <div
                                className={`w-4 h-4 rounded-full mr-2 ${
                                    processStatus.step >= 3
                                        ? 'bg-green-500'
                                        : 'bg-gray-300'
                                }`}
                            ></div>
                            ขั้นตอนที่ 3: แสดงผลการประเมิน
                        </div>
                    </div>
                    {processStatus.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                            {processStatus.error}
                        </div>
                    )}
                </div>
            )}

            {/* Progress — one indicator: a labelled bar */}
            <div className="mt-8">
                <div className="text-sm text-gray-600 mb-2">
                    ข้อที่ {currentQuestionIndex + 1} จาก {questions.length} ข้อ
                </div>
                <div
                    className="w-full bg-gray-200 rounded-full h-2"
                    role="progressbar"
                    aria-valuenow={currentQuestionIndex + 1}
                    aria-valuemin={1}
                    aria-valuemax={questions.length}
                >
                    <div
                        className="bg-indigo-700 h-2 rounded-full transition-all duration-300"
                        style={{
                            width: `${
                                ((currentQuestionIndex + 1) / questions.length) * 100
                            }%`,
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
}