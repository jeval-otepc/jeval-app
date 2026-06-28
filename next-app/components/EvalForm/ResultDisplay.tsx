'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Printer, Download, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useEvalForm } from './EvalFormProvider';
import { ApiService } from '@/lib/api';
import { PositionType } from '@/components/PositionSelect';
import { PDFReport } from './PDFReport';
import { EvalStepper } from './EvalStepper';
import { EvalHero } from './EvalHero';

/**
 * คะแนนรวมขั้นต่ำที่ถือว่า "ผ่าน" การประเมินค่างาน ตามเกณฑ์ ก.ค.ศ.
 * แยกเป็นค่าคงที่ที่มีชื่อเพื่อไม่ให้เป็นเลขลอยในเทมเพลต และแก้ได้ที่จุดเดียว
 * TODO: ในระยะถัดไปควรรับเกณฑ์นี้มาจาก backend/config แทนการกำหนดในหน้าจอ
 */
const PASS_SCORE_THRESHOLD = 650;

export function ResultDisplay() {
    const { resultData, resetForm } = useEvalForm();
    const [positionTypes, setPositionTypes] = useState<PositionType[]>([]);
    const pdfComponentRef = useRef<HTMLDivElement>(null);

    // Load position types for result display
    useEffect(() => {
        const loadPositionTypes = async () => {
            try {
                const response = await ApiService.getPositionTypes();
                setPositionTypes(response.data || []);
            } catch (err) {
                console.error('Error loading position types:', err);
            }
        };

        loadPositionTypes();
    }, []);

    // Helper function to get position type name
    const getPositionTypeName = (typeId: string) => {
        const positionType = positionTypes.find(
            (type) => type.PositionTypeID === typeId,
        );
        return positionType ? positionType.PositionTypeName : typeId;
    };

    // Print function using react-to-print
    const handlePrint = useReactToPrint({
        contentRef: pdfComponentRef,
        documentTitle: 'ผลการประเมินค่างาน',
    });

    const [isDownloading, setIsDownloading] = useState(false);

    // PDF download — draws a vector PDF directly from the result data.
    // The generator and jsPDF are loaded on demand so they stay out of the
    // initial bundle (see generateResultPdf.ts).
    const handleDownloadPDF = async () => {
        if (!resultData) return;
        setIsDownloading(true);
        try {
            const { generateResultPdf } = await import('./generateResultPdf');
            await generateResultPdf(
                resultData,
                getPositionTypeName,
                PASS_SCORE_THRESHOLD,
            );
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองอีกครั้ง');
        } finally {
            setIsDownloading(false);
        }
    };

    if (!resultData) {
        return (
            <div className="text-center py-8">
                <div className="text-sm text-gray-600">ไม่พบข้อมูลผลลัพธ์</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {/* Header */}
            <EvalHero
                title="ผลการประเมินค่างาน"
                subtitles={[
                    'ระบบประเมินค่างาน เพื่อกำหนดตำแหน่งบุคลากรทางการศึกษาอื่น',
                ]}
                centered
                as="h2"
            />

            {/* Stepper — keeps the user oriented: all steps done, now viewing results */}
            <EvalStepper currentStep={3} />

            <div className="p-8">
                {/* Position Information */}
                <div className="mb-8 text-center space-y-2">
                    <p className="text-gray-700">
                        ประเภทตำแหน่ง{' '}
                        <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2">
                            {getPositionTypeName(
                                String(resultData.formData?.TypePos),
                            )}
                        </span>{' '}
                        ชื่อตำแหน่ง{' '}
                        <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2">
                            {String(resultData.formData?.Name_Pos || '')}
                        </span>{' '}
                        เลขที่ตำแหน่ง{' '}
                        <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2">
                            {String(resultData.formData?.Num_Pos_M || '')}
                        </span>
                    </p>
                    <p className="text-gray-700">
                        สังกัด{' '}
                        <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2">
                            {String(resultData.formData?.Affiliation || '')}
                        </span>{' '}
                        หน่วยงานการศึกษา{' '}
                        <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2">
                            {String(
                                resultData.formData?.EducationalInstitution ||
                                    '',
                            )}
                        </span>
                    </p>
                    <p className="text-gray-700">
                        วันที่ยื่นการประเมิน{' '}
                        <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2">
                            {String(resultData.formData?.DateTimeInput_M || '')}

                            {/* {resultData.formData?.DateTimeInput_M
                                ? new Date(
                                      String(
                                          resultData.formData.DateTimeInput_M,
                                      ),
                                  ).toLocaleDateString('th-TH')
                                : ''} */}
                        </span>
                    </p>
                </div>

                {/* Evaluation Results Table 1 */}
                <div className="mb-8">
                    <table className="w-full border-collapse border border-gray-300">
                        <colgroup>
                            <col className="w-3/4" />
                            <col className="w-1/4" />
                        </colgroup>
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">
                                    รายการประเมินค่างาน
                                </th>
                                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                                    ค่าคะแนน <br />
                                    (OTEPC POINT)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 px-4 py-3 text-gray-700">
                                    1.
                                    องค์ประกอบหลักด้านความรู้และทักษะที่จำเป็นในงาน
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                                    {resultData.khScoreConvt}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-4 py-3 text-gray-700">
                                    2. องค์ประกอบหลักด้านความสามารถในการแก้ปัญหา
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                                    {resultData.psScoreConvt}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-4 py-3 text-gray-700">
                                    3. องค์ประกอบหลักด้านการตัดสินใจ
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                                    {resultData.acScoreConvt}
                                </td>
                            </tr>
                            <tr className="bg-green-50">
                                <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">
                                    รวม
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900 text-lg">
                                    {resultData.totalScore?.toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Evaluation Results Table 2 */}
                <div className="mb-8">
                    <table className="w-full border-collapse border border-gray-300">
                        <colgroup>
                            <col className="w-3/4" />
                            <col className="w-1/4" />
                        </colgroup>
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">
                                    ผลการประเมิน
                                </th>
                                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                                    ระดับการประเมิน
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 px-4 py-3 text-gray-700">
                                    1. การประเมินค่างาน
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                                    {resultData.totalScore &&
                                    resultData.totalScore >= PASS_SCORE_THRESHOLD
                                        ? 'ผ่าน'
                                        : 'ไม่ผ่าน'}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-4 py-3 text-gray-700">
                                    2. การประเมินความสอดคล้องกับวัตถุประสงค์
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                                    ผ่าน
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-4 py-3 text-gray-700">
                                    3.
                                    การประเมินความสอดคล้องขององค์ประกอบของการประเมินค่างาน
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                                    ผ่าน
                                </td>
                            </tr>
                            <tr className="bg-green-50">
                                <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900">
                                    สรุปผลการประเมิน
                                </td>
                                <td
                                    className={`border border-gray-300 px-4 py-3 text-center font-bold text-lg ${
                                        resultData.ResultSummary
                                            ? 'text-green-700'
                                            : 'text-red-700'
                                    }`}
                                >
                                    <span className="inline-flex items-center justify-center gap-1.5">
                                        {resultData.ResultSummary ? (
                                            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                                        ) : (
                                            <XCircle className="h-5 w-5" aria-hidden="true" />
                                        )}
                                        {resultData.ResultSummary ? 'ผ่าน' : 'ไม่ผ่าน'}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Action Buttons — exporting the report is the primary intent,
                    so print + download are the brand-colored actions; starting
                    over is a quieter secondary action. */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition-colors duration-200"
                    >
                        <Printer className="h-5 w-5" aria-hidden="true" />
                        พิมพ์รายงาน
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition-colors duration-200 disabled:opacity-60"
                    >
                        <Download className="h-5 w-5" aria-hidden="true" />
                        {isDownloading ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF'}
                    </button>
                    <button
                        onClick={resetForm}
                        className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                        <RotateCcw className="h-5 w-5" aria-hidden="true" />
                        ประเมินใหม่
                    </button>
                </div>
            </div>

            {/* Hidden PDF Report Component for printing/PDF generation */}
            <div
                style={{
                    position: 'absolute',
                    left: '-9999px',
                    top: '-9999px',
                }}
            >
                <PDFReport
                    ref={pdfComponentRef}
                    resultData={resultData}
                    getPositionTypeName={getPositionTypeName}
                />
            </div>
        </div>
    );
}
