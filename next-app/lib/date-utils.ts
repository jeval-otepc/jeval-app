// Thai Date Utility Functions

// Thai month names
export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

// Thai short month names  
export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

// Thai day names
export const THAI_DAYS = [
  'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'
];

/**
 * Convert Gregorian year to Buddhist Era (BE) year
 * @param year - Gregorian year (CE)
 * @returns Buddhist Era year (BE)
 */
export function toBuddhistYear(year: number): number {
  return year + 543;
}

/**
 * Convert Buddhist Era year to Gregorian year
 * @param buddhistYear - Buddhist Era year (BE)
 * @returns Gregorian year (CE)
 */
export function fromBuddhistYear(buddhistYear: number): number {
  return buddhistYear - 543;
}

/**
 * Format date to Thai display format (d MMMM yyyy)
 * Example: "4 กันยายน 2568"
 * @param date - Date object or ISO string
 * @returns Thai formatted date string
 */
export function formatThaiDate(date: string | Date | null): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '';
  }

  const day = d.getDate();
  const month = THAI_MONTHS[d.getMonth()];
  const year = toBuddhistYear(d.getFullYear());

  return `${day} ${month} ${year}`;
}

/**
 * Format date to Thai short display format (d MMM yyyy)
 * Example: "4 ก.ย. 2568"
 * @param date - Date object or ISO string
 * @returns Thai formatted short date string
 */
export function formatThaiDateShort(date: string | Date | null): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '';
  }

  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  const year = toBuddhistYear(d.getFullYear());

  return `${day} ${month} ${year}`;
}

/**
 * Format date to database format (yyyy-mm-dd HH:mm:ss)
 * @param date - Date object or ISO string
 * @returns Database formatted string
 */
export function formatDatabaseDateTime(date: string | Date | null): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format date to database date only format (yyyy-mm-dd)
 * @param date - Date object or ISO string
 * @returns Database formatted date string
 */
export function formatDatabaseDate(date: string | Date | null): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Parse Thai date input and return ISO date string
 * @param thaiDateStr - Thai date string or ISO date string
 * @returns ISO date string for input[type="date"]
 */
export function parseThaiDateToISO(thaiDateStr: string): string {
  if (!thaiDateStr) return '';
  
  // If it's already in ISO format (yyyy-mm-dd), return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(thaiDateStr)) {
    return thaiDateStr;
  }

  // Try to parse various Thai formats
  // This is a simplified parser - you might need to enhance based on actual input formats
  const date = new Date(thaiDateStr);
  if (!isNaN(date.getTime())) {
    return formatDatabaseDate(date);
  }

  return '';
}

/**
 * Get current date in Thai format
 * @returns Current date in Thai format
 */
export function getCurrentThaiDate(): string {
  return formatThaiDate(new Date());
}

/**
 * Get current date in database format
 * @returns Current date in database format
 */
export function getCurrentDatabaseDateTime(): string {
  return formatDatabaseDateTime(new Date());
}

/**
 * Create a date display component helper
 * @param value - Current form value (ISO format)
 * @param onChange - Change handler function
 * @returns Object with display value and handlers
 */
export function createThaiDatePickerHelper(
  value: string,
  onChange: (value: string) => void
) {
  return {
    // Value for input[type="date"] (always ISO format)
    inputValue: value,
    
    // Display value in Thai format
    displayValue: value ? formatThaiDate(value) : '',
    
    // Handler for input change
    handleChange: (newValue: string) => {
      // Store as database format but input gives us ISO format already
      onChange(newValue);
    },
    
    // Get database format for submission
    getDatabaseValue: () => {
      if (!value) return getCurrentDatabaseDateTime();
      
      // Convert date to datetime with current time
      const date = new Date(value);
      const now = new Date();
      
      date.setHours(now.getHours());
      date.setMinutes(now.getMinutes());
      date.setSeconds(now.getSeconds());
      
      return formatDatabaseDateTime(date);
    }
  };
}