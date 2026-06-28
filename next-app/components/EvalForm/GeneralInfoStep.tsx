'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useEvalForm } from './EvalFormProvider';
import PositionSelect from '@/components/PositionSelect';
import DatePickerTH from '@/components/DatePickerTH';

export function GeneralInfoStep() {
    const {
        formData,
        fieldErrors,
        showValidation,
        handleInputChange,
        handleDateChange,
        saveGeneralForm,
        resetForm,
    } = useEvalForm();

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    ชื่อตำแหน่ง/เลขที่ตำแหน่ง
                </h3>
            </div>

            <form id="general-info" onSubmit={saveGeneralForm}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <PositionSelect
                            name="TypePos"
                            value={formData.TypePos}
                            onChange={handleInputChange}
                            showValidation={showValidation}
                            hasError={!!fieldErrors.TypePos}
                            errorMessage={fieldErrors.TypePos}
                            required={true}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="Name_Pos"
                            className="block text-base font-medium text-gray-700 mb-2"
                        >
                            ชื่อตำแหน่ง
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            name="Name_Pos"
                            value={formData.Name_Pos}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                showValidation && fieldErrors.Name_Pos
                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                    : 'border-gray-300 focus:ring-indigo-600 focus:border-indigo-600'
                            }`}
                            placeholder="ชื่อตำแหน่ง"
                            required
                        />
                        {showValidation && fieldErrors.Name_Pos && (
                            <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                                {fieldErrors.Name_Pos}
                            </div>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="Num_Pos_M"
                            className="block text-base font-medium text-gray-700 mb-2"
                        >
                            เลขที่ตำแหน่ง
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            name="Num_Pos_M"
                            value={formData.Num_Pos_M}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                showValidation && fieldErrors.Num_Pos_M
                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                    : 'border-gray-300 focus:ring-indigo-600 focus:border-indigo-600'
                            }`}
                            placeholder="เลขที่ตำแหน่ง"
                            required
                        />
                        {showValidation && fieldErrors.Num_Pos_M && (
                            <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                                {fieldErrors.Num_Pos_M}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label
                            htmlFor="Affiliation"
                            className="block text-base font-medium text-gray-700 mb-2"
                        >
                            สังกัด ส่วนราชการ
                        </label>
                        <input
                            type="text"
                            name="Affiliation"
                            value={formData.Affiliation}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                            placeholder="สังกัด ส่วนราชการ"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="EducationalInstitution"
                            className="block text-base font-medium text-gray-700 mb-2"
                        >
                            ชื่อหน่วยงานการศึกษา
                        </label>
                        <input
                            type="text"
                            name="EducationalInstitution"
                            value={formData.EducationalInstitution}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                            placeholder="ชื่อหน่วยงานการศึกษา"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div>
                        <label
                            htmlFor="DateTimeInput_M"
                            className="block text-base font-medium text-gray-700 mb-2"
                        >
                            วัน-เวลา ที่รับเรื่อง
                        </label>
                        <DatePickerTH
                            id="DateTimeInput_M"
                            name="DateTimeInput_M"
                            value={formData.DateTimeInput_M}
                            onChange={handleDateChange}
                            placeholder="เลือกวันที่รับเรื่อง"
                        />
                    </div>
                </div>

                <div className="flex justify-between">
                    <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                        ล้างฟอร์ม
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition-colors duration-200"
                    >
                        ถัดไป
                    </button>
                </div>
            </form>
        </div>
    );
}