'use client';

/** Canonical footer text — the single source of truth used everywhere. */
export const FOOTER_TEXT =
    '© Copyright 2026 OTEPC All Rights Reserved | จัดทำโดยกลุ่มเทคโนโลยีและสารสนเทศการบริหารงานบุคคล สำนักงาน ก.ค.ศ.';

export function Footer() {
    return (
        <footer className="bg-gray-100 border-t border-gray-200 py-4 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-sm text-gray-600">{FOOTER_TEXT}</p>
            </div>
        </footer>
    );
}