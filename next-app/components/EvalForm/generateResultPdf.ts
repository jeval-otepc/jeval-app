import type { ResultData } from '@/types/eval-form';

/**
 * Build the evaluation result PDF by DRAWING it from the data with jsPDF's
 * native vector primitives — no html2canvas / DOM rasterization.
 *
 * Why this approach:
 *  - Output is a few tens of KB (jsPDF subsets the embedded Thai font) instead
 *    of a multi-MB full-page screenshot.
 *  - Text stays selectable / searchable / copyable and prints crisp at any zoom.
 *  - jsPDF itself and this module are dynamically imported, so none of it ships
 *    in the initial bundle — it loads only when the user actually exports.
 *
 * jsPDF has no Thai glyphs built in, so we fetch the Sarabun TTF (the standard
 * Thai government document font) at call time (browser-cached) and embed it —
 * Regular + Bold. The font bytes are NOT bundled into JS.
 */

const FONT_NAME = 'Sarabun';
const FONT_FILES: Record<'normal' | 'bold', string> = {
    normal: '/fonts/Sarabun-Regular.ttf',
    bold: '/fonts/Sarabun-Bold.ttf',
};

// Cache base64 fonts across exports so we fetch + encode each at most once.
const cachedFonts: Partial<Record<'normal' | 'bold', string>> = {};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
}

async function loadFontBase64(style: 'normal' | 'bold'): Promise<string> {
    const cached = cachedFonts[style];
    if (cached) return cached;
    const res = await fetch(FONT_FILES[style]);
    if (!res.ok) throw new Error(`โหลดฟอนต์ไม่สำเร็จ (HTTP ${res.status})`);
    const base64 = arrayBufferToBase64(await res.arrayBuffer());
    cachedFonts[style] = base64;
    return base64;
}

type RGB = readonly [number, number, number];

// Brand + neutral palette (mirrors the on-screen report)
const C = {
    brand: [67, 56, 202] as RGB, // indigo-700 — header band & table headers
    brandTint: [238, 242, 255] as RGB, // indigo-50 — total row highlight
    white: [255, 255, 255] as RGB,
    zebra: [248, 250, 252] as RGB, // slate-50 — alternating rows
    border: [209, 213, 219] as RGB, // gray-300
    text: [17, 24, 39] as RGB, // gray-900
    textSoft: [55, 65, 81] as RGB, // gray-700
    brandText: [49, 46, 129] as RGB, // indigo-900 — text on brandTint
    passPill: [220, 252, 231] as RGB, // green-100
    passText: [22, 101, 52] as RGB, // green-800
    failPill: [254, 226, 226] as RGB, // red-100
    failText: [153, 27, 27] as RGB, // red-800
};

interface Cell {
    text: string;
    align?: 'left' | 'center';
    color?: RGB;
    /** Render the value as a colored rounded "pill" highlight. */
    pill?: 'pass' | 'fail';
}

export async function generateResultPdf(
    resultData: ResultData,
    getPositionTypeName: (typeId: string) => string,
): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const [regular, bold] = await Promise.all([
        loadFontBase64('normal'),
        loadFontBase64('bold'),
    ]);

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.addFileToVFS(`${FONT_NAME}-Regular.ttf`, regular);
    doc.addFont(`${FONT_NAME}-Regular.ttf`, FONT_NAME, 'normal');
    doc.addFileToVFS(`${FONT_NAME}-Bold.ttf`, bold);
    doc.addFont(`${FONT_NAME}-Bold.ttf`, FONT_NAME, 'bold');
    doc.setFont(FONT_NAME, 'normal');

    const pageW = doc.internal.pageSize.getWidth();
    const margin = 18;
    const contentW = pageW - margin * 2;
    const f = resultData.formData as Record<string, unknown>;
    const str = (v: unknown) => (v == null ? '' : String(v));

    // ---- Header band -------------------------------------------------------
    doc.setFillColor(...C.brand);
    doc.rect(0, 0, pageW, 30, 'F');
    doc.setTextColor(...C.white);
    doc.setFontSize(18);
    doc.text('ผลการประเมินค่างาน', pageW / 2, 14, { align: 'center' });
    doc.setFontSize(10);
    doc.text(
        'ระบบประเมินค่างาน เพื่อกำหนดตำแหน่งบุคลากรทางการศึกษาอื่น',
        pageW / 2,
        22,
        { align: 'center' },
    );

    let y = 42;

    // ---- Position information ----------------------------------------------
    doc.setTextColor(...C.textSoft);
    doc.setFontSize(11);
    const infoLines = [
        `ประเภทตำแหน่ง ${getPositionTypeName(str(f.TypePos))}   ชื่อตำแหน่ง ${str(f.Name_Pos)}   เลขที่ตำแหน่ง ${str(f.Num_Pos_M)}`,
        `สังกัด ${str(f.Affiliation)}   หน่วยงานการศึกษา ${str(f.EducationalInstitution)}`,
        `วันที่ยื่นการประเมิน ${str(f.DateTimeInput_M)}`,
    ];
    for (const line of infoLines) {
        const wrapped = doc.splitTextToSize(line, contentW) as string[];
        doc.text(wrapped, margin, y);
        y += wrapped.length * 5.5 + 1.5;
    }

    y += 4;

    // ---- Generic 2-column table renderer -----------------------------------
    const lineH = 5; // mm per wrapped line
    const padX = 3;
    const padY = 3;

    const drawTable = (
        startY: number,
        col1W: number,
        header: [string, string],
        rows: Array<[Cell, Cell]>,
    ): number => {
        const col2W = contentW - col1W;
        const colW = [col1W, col2W];
        const colX = [margin, margin + col1W];

        const renderRow = (
            cells: [Cell, Cell],
            rowY: number,
            opts: { fill?: RGB; bold?: boolean; textColor?: RGB },
        ): number => {
            const bold = !!opts.bold;
            doc.setFont(FONT_NAME, bold ? 'bold' : 'normal');
            doc.setFontSize(bold ? 11.5 : 10.5);

            // Pre-wrap to compute the row height
            const wrapped = cells.map((c, i) =>
                doc.splitTextToSize(c.text, colW[i] - padX * 2) as string[],
            );
            const rowH = Math.max(...wrapped.map((w) => w.length)) * lineH + padY * 2;

            // Row background
            if (opts.fill) {
                doc.setFillColor(...opts.fill);
                doc.rect(margin, rowY, contentW, rowH, 'F');
            }
            doc.setDrawColor(...C.border);
            doc.setLineWidth(0.2);

            cells.forEach((c, i) => {
                doc.rect(colX[i], rowY, colW[i], rowH, 'S');
                const cx = colX[i] + colW[i] / 2;

                // Verdict pill: a colored rounded highlight around the value
                if (c.pill) {
                    const isPass = c.pill === 'pass';
                    const tw = doc.getTextWidth(c.text);
                    const pillW = tw + 9;
                    const pillH = 7;
                    const px = cx - pillW / 2;
                    const py = rowY + (rowH - pillH) / 2;
                    doc.setFillColor(...(isPass ? C.passPill : C.failPill));
                    doc.roundedRect(px, py, pillW, pillH, 1.6, 1.6, 'F');
                    doc.setTextColor(...(isPass ? C.passText : C.failText));
                    doc.text(c.text, cx, py + pillH / 2, {
                        align: 'center',
                        baseline: 'middle',
                    });
                    return;
                }

                doc.setTextColor(...(c.color ?? opts.textColor ?? C.textSoft));
                const tx = c.align === 'center' ? cx : colX[i] + padX;
                doc.text(wrapped[i], tx, rowY + padY + lineH - 1.5, {
                    align: c.align === 'center' ? 'center' : 'left',
                    baseline: 'alphabetic',
                });
            });
            return rowY + rowH;
        };

        let cy = startY;
        // Header: brand band, white bold text
        cy = renderRow(
            [
                { text: header[0], align: 'left' },
                { text: header[1], align: 'center' },
            ],
            cy,
            { fill: C.brand, bold: true, textColor: C.white },
        );
        rows.forEach((r, idx) => {
            const isLast = idx === rows.length - 1;
            if (isLast) {
                // Total / summary row: brand-tinted highlight, bold
                cy = renderRow(r, cy, {
                    fill: C.brandTint,
                    bold: true,
                    textColor: C.brandText,
                });
            } else {
                // Zebra striping on data rows
                cy = renderRow(r, cy, idx % 2 === 1 ? { fill: C.zebra } : {});
            }
        });
        return cy;
    };

    // ---- Table 1: score breakdown ------------------------------------------
    y = drawTable(y, contentW * 0.72, ['รายการประเมินค่างาน', 'ค่าคะแนน (OTEPC POINT)'], [
        [
            { text: '1. องค์ประกอบหลักด้านความรู้และทักษะที่จำเป็นในงาน' },
            { text: str(resultData.khScoreConvt), align: 'center', color: C.text },
        ],
        [
            { text: '2. องค์ประกอบหลักด้านความสามารถในการแก้ปัญหา' },
            { text: str(resultData.psScoreConvt), align: 'center', color: C.text },
        ],
        [
            { text: '3. องค์ประกอบหลักด้านการตัดสินใจ' },
            { text: str(resultData.acScoreConvt), align: 'center', color: C.text },
        ],
        [
            { text: 'รวม', align: 'center' },
            { text: resultData.totalScore?.toFixed(2) ?? '-', align: 'center' },
        ],
    ]);

    y += 6;

    // ---- Table 2: verdicts -------------------------------------------------
    // ผ่าน/ไม่ผ่านค่าคะแนน = ResultScore จาก backend (คิดจากช่วง min–max ตาม TypePos)
    const passed = !!resultData.ResultScore;
    const summaryPass = !!resultData.ResultSummary;
    y = drawTable(y, contentW * 0.72, ['ผลการประเมิน', 'ระดับการประเมิน'], [
        [
            { text: '1. การประเมินค่างาน' },
            {
                text: passed ? 'ผ่าน' : 'ไม่ผ่าน',
                align: 'center',
                pill: passed ? 'pass' : 'fail',
            },
        ],
        [
            { text: '2. การประเมินความสอดคล้องกับวัตถุประสงค์' },
            { text: 'ผ่าน', align: 'center', pill: 'pass' },
        ],
        [
            { text: '3. การประเมินความสอดคล้องขององค์ประกอบของการประเมินค่างาน' },
            { text: 'ผ่าน', align: 'center', pill: 'pass' },
        ],
        [
            { text: 'สรุปผลการประเมิน', align: 'center' },
            {
                text: summaryPass ? 'ผ่าน' : 'ไม่ผ่าน',
                align: 'center',
                pill: summaryPass ? 'pass' : 'fail',
            },
        ],
    ]);

    // ---- Footer ------------------------------------------------------------
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFont(FONT_NAME, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.textSoft);
    doc.text(
        '© Copyright 2026 OTEPC All Rights Reserved | จัดทำโดยกลุ่มเทคโนโลยีและสารสนเทศการบริหารงานบุคคล สำนักงาน ก.ค.ศ.',
        pageW / 2,
        pageH - 10,
        { align: 'center', maxWidth: contentW },
    );

    doc.save('ผลการประเมินค่างาน.pdf');
}
