'use client';

import React, { forwardRef } from 'react';

interface PDFReportProps {
    resultData: any;
    getPositionTypeName: (typeId: string) => string;
}

export const PDFReport = forwardRef<HTMLDivElement, PDFReportProps>(
    ({ resultData, getPositionTypeName }, ref) => {
        const currentDate = new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        if (!resultData) {
            return null;
        }

        return (
            <>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
                    
                    .print-container {
                        font-family: 'Sarabun', sans-serif;
                        background: white;
                        padding: 10%;
                        min-height: 100vh;
                        width: 210mm; /* A4 width */
                        margin: 0 auto;
                        font-size: 14px;
                        line-height: 1.4;
                        color: #000;
                    }
                    
                    .title {
                        font-size: 24px;
                        font-weight: 700;
                        text-align: center;
                        margin-bottom: 12px;
                    }
                    
                    .subtitle {
                        font-size: 16px;
                        font-weight: 500;
                        text-align: center;
                        margin-bottom: 32px;
                    }
                    
                    .header-container {
                        display: flex;
                        margin-bottom: 24px;
                        gap: 20px;
                    }
                    
                    .logo-section {
                        width: 40%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    
                    .logo-image {
                        max-width: 150px;
                        height: auto;
                    }
                    
                    .info-section {
                        width: 60%;
                        line-height: 2;
                        font-size: 12px;
                    }
                    
                    .info-line {
                        margin-bottom: 8px;
                        display: flex;
                        align-items: baseline;
                        gap: 8px;
                    }
                    
                    .info-label {
                        white-space: nowrap;
                        flex-shrink: 0;
                    }
                    
                    .dotted-line {
                        flex: 1;
                        border-bottom: 1px dotted #000;
                        min-height: 1em;
                        margin-right: 10px;
                        padding: 0 4px;
                    }
                    
                    .table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 24px;
                        font-size: 12px;
                    }
                    
                    .table th,
                    .table td {
                        border: 1px solid #000;
                        padding: 16px 8px;
                        text-align: left;
                        vertical-align: middle;
                        height: auto;
                        min-height: 50px;
                        line-height: 1.4;
                        display: table-cell;
                    }
                    
                    .table th {
                        background-color: #f5f5f5;
                        font-weight: 700;
                        font-size: 15px;
                        text-align: center;
                    }
                    
                    .table .center {
                        text-align: center;
                    }
                    
                    .table .bold {
                        font-weight: 600;
                    }
                    
                    .table th > *,
                    .table td > * {
                        margin: auto 0;
                        display: inline-block;
                        vertical-align: middle;
                    }
                    
                    .table tr {
                        height: auto;
                        min-height: 50px;
                    }
                    
                    .signature-section {
                        margin-top: 120px;
                        margin-bottom: 60px;
                        text-align: right;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        height: 120px;
                    }
                    
                    .signature-container {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-end;
                    }
                    
                    .signature-text {
                        margin-bottom: 2px;
                    }
                    
                    .signature-line {
                        display: inline-block;
                        border-bottom: 1px dotted #000;
                        width: 300px;
                        height: 1px;
                        margin-top: 2px;
                    }
                    
                    .date-section {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        flex: 1;
                        margin-top: 20px;
                    }
                    
                    @media print {
                        .print-container {
                            padding: 10mm;
                            margin: 0;
                            box-shadow: none;
                        }
                        
                        @page {
                            size: A4;
                            margin: 10mm;
                        }
                    }
                `}</style>

                <div ref={ref} className="print-container">
                    <div className="title">ผลการประเมินค่างาน</div>

                    <div className="subtitle">
                        ระบบประเมินค่างาน
                        เพื่อกำหนดตำแหน่งบุคลากรทางการศึกษาอื่น ตามมาตรา 38 ค.
                        (2)
                    </div>

                    <div className="header-container">
                        <div className="logo-section">
                            <img
                                src="/images/otepc-logo-002.png"
                                alt="OTEPC Logo"
                                className="logo-image"
                            />
                        </div>

                        <div className="info-section">
                            <div className="info-line">
                                <span className="info-label">
                                    ประเภทตำแหน่ง
                                </span>
                                <span className="dotted-line">
                                    {getPositionTypeName(
                                        String(resultData.formData?.TypePos),
                                    ) || ''}
                                </span>
                            </div>
                            <div className="info-line">
                                <span className="info-label">ชื่อตำแหน่ง</span>
                                <span className="dotted-line">
                                    {String(
                                        resultData.formData?.Name_Pos || '',
                                    )}
                                </span>
                            </div>
                            <div className="info-line">
                                <span className="info-label">
                                    เลขที่ตำแหน่ง
                                </span>
                                <span className="dotted-line">
                                    {String(
                                        resultData.formData?.Num_Pos_M || '',
                                    )}
                                </span>
                                <span className="info-label">สังกัด</span>
                                <span className="dotted-line">
                                    {String(
                                        resultData.formData?.Affiliation || '',
                                    )}
                                </span>
                            </div>
                            <div className="info-line">
                                <span className="info-label">
                                    หน่วยงานการศึกษา
                                </span>
                                <span className="dotted-line">
                                    {String(
                                        resultData.formData
                                            ?.EducationalInstitution || '',
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ตารางที่ 1 */}
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '75%' }}>
                                    รายการประเมินค่างาน
                                </th>
                                <th style={{ width: '25%' }}>
                                    ค่าคะแนน
                                    <br />
                                    (OTEPC POINT)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    1.
                                    องค์ประกอบหลักด้านความรู้และทักษะที่จำเป็นในงาน
                                </td>
                                <td className="center bold">
                                    {resultData.khScoreConvt}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    2. องค์ประกอบหลักด้านความสามารถในการแก้ปัญหา
                                </td>
                                <td className="center bold">
                                    {resultData.psScoreConvt}
                                </td>
                            </tr>
                            <tr>
                                <td>3. องค์ประกอบหลักด้านการตัดสินใจ</td>
                                <td className="center bold">
                                    {resultData.acScoreConvt}
                                </td>
                            </tr>
                            <tr style={{ backgroundColor: '#f0f9f0' }}>
                                <td className="center bold">รวม</td>
                                <td
                                    className="center bold"
                                    style={{ fontSize: '16px' }}
                                >
                                    {resultData.totalScore?.toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* ตารางที่ 2 */}
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '75%' }}>ผลการประเมิน</th>
                                <th style={{ width: '25%' }}>
                                    ระดับการประเมิน
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1. การประเมินค่างาน</td>
                                <td className="center bold">
                                    {resultData.totalScore &&
                                    resultData.totalScore >= 650
                                        ? 'ผ่าน'
                                        : 'ไม่ผ่าน'}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    2. การประเมินความสอดคล้องกับวัตถุประสงค์
                                </td>
                                <td className="center bold">ผ่าน</td>
                            </tr>
                            <tr>
                                <td>
                                    3.
                                    การประเมินความสอดคล้องขององค์ประกอบของการประเมินค่างาน
                                </td>
                                <td className="center bold">ผ่าน</td>
                            </tr>
                            <tr style={{ backgroundColor: '#f0f9f0' }}>
                                <td className="center bold">
                                    สรุปผลการประเมิน
                                </td>
                                <td
                                    className="center bold"
                                    style={{
                                        fontSize: '16px',
                                        color: resultData.ResultSummary
                                            ? '#059669'
                                            : '#dc2626',
                                    }}
                                >
                                    {resultData.ResultSummary
                                        ? 'ผ่าน'
                                        : 'ไม่ผ่าน'}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="signature-section">
                        <div className="signature-container">
                            <div className="signature-text">ลงลายมือชื่อ</div>
                            <div className="signature-line"></div>
                        </div>
                        <div className="date-section">วันที่ {currentDate}</div>
                    </div>
                </div>
            </>
        );
    },
);

PDFReport.displayName = 'PDFReport';
