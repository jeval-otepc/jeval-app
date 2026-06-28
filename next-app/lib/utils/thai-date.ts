// Thai Date Utilities
export const THAI_MONTHS = [
    'มกราคม',
    'กุมภาพันธ์', 
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม'
];

export const THAI_DAYS = [
    'อาทิตย์',
    'จันทร์',
    'อังคาร',
    'พุธ',
    'พฤหัสบดี',
    'ศุกร์',
    'เสาร์'
];

export const THAI_MONTHS_SHORT = [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.'
];

/**
 * Convert Gregorian year to Buddhist year (พ.ศ.)
 */
export function toBuddhistYear(gregorianYear: number): number {
    return gregorianYear + 543;
}

/**
 * Convert Buddhist year to Gregorian year
 */
export function toGregorianYear(buddhistYear: number): number {
    return buddhistYear - 543;
}

/**
 * Get days in month for a given year and month
 */
export function getDaysInMonth(year: number, month: number): number {
    // Convert Buddhist year to Gregorian for calculation
    const gregorianYear = year > 2000 ? toGregorianYear(year) : year;
    return new Date(gregorianYear, month + 1, 0).getDate();
}

/**
 * Format date to Thai format (dd/mm/yyyy พ.ศ.)
 */
export function formatThaiDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const buddhistYear = toBuddhistYear(date.getFullYear());
    
    return `${day}/${month}/${buddhistYear}`;
}

/**
 * Format date to Thai display format with month name
 */
export function formatThaiDateDisplay(date: Date): string {
    const day = date.getDate();
    const monthName = THAI_MONTHS[date.getMonth()];
    const buddhistYear = toBuddhistYear(date.getFullYear());
    
    return `${day} ${monthName} ${buddhistYear}`;
}

/**
 * Parse Thai date string (dd/mm/yyyy) to Date object
 */
export function parseThaiDate(dateStr: string): Date | null {
    if (!dateStr || typeof dateStr !== 'string') return null;
    
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const buddhistYear = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(buddhistYear)) return null;
    
    const gregorianYear = buddhistYear > 2000 ? toGregorianYear(buddhistYear) : buddhistYear;
    const date = new Date(gregorianYear, month, day);
    
    // Validate the date
    if (date.getFullYear() !== gregorianYear || 
        date.getMonth() !== month || 
        date.getDate() !== day) {
        return null;
    }
    
    return date;
}

/**
 * Get today's date in Buddhist calendar
 */
export function getTodayThai(): { day: number; month: number; year: number } {
    const today = new Date();
    return {
        day: today.getDate(),
        month: today.getMonth(),
        year: toBuddhistYear(today.getFullYear())
    };
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

/**
 * Generate year options for date picker
 */
export function generateYearOptions(
    startYear?: number,
    endYear?: number,
    currentYear?: number
): number[] {
    const now = new Date();
    const currentBuddhistYear = toBuddhistYear(now.getFullYear());
    
    const start = startYear || currentBuddhistYear - 50;
    const end = endYear || currentBuddhistYear + 10;
    const current = currentYear || currentBuddhistYear;
    
    const years: number[] = [];
    for (let year = start; year <= end; year++) {
        years.push(year);
    }
    
    return years.sort((a, b) => b - a); // Sort descending
}