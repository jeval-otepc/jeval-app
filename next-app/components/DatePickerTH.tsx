'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { 
    THAI_MONTHS, 
    THAI_DAYS,
    toBuddhistYear, 
    toGregorianYear,
    getDaysInMonth,
    formatThaiDateDisplay,
    getTodayThai
} from '@/lib/utils/thai-date';

interface ThaiDatePickerProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    name?: string;
    id?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
}

const ThaiDatePicker: React.FC<ThaiDatePickerProps> = ({
    value = '',
    onChange = () => {},
    placeholder = 'เลือกวันที่',
    name,
    id,
    className = '',
    disabled = false,
    required = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(toBuddhistYear(new Date().getFullYear()));
    const [inputValue, setInputValue] = useState('');
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showYearPicker, setShowYearPicker] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // วันที่ปัจจุบัน
    const today = new Date();
    const todayThai = getTodayThai();
    const todayYear = todayThai.year;
    const todayMonth = todayThai.month;
    const todayDate = todayThai.day;
    const thaiMonths = THAI_MONTHS;
    const thaiDaysShort = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    
    // Helper functions
    const formatThaiDate = (dateStr: string): string => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return formatThaiDateDisplay(date);
    };

    const buddhistToChristian = (buddhistYear: number): number => {
        return toGregorianYear(buddhistYear);
    };

    const christianToBuddhist = (christianYear: number): number => {
        return toBuddhistYear(christianYear);
    };

    const getLocalIsoDate = (date: Date): string => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // ตรวจสอบว่าวันที่เป็นอนาคตหรือไม่
    const isFutureDate = (day: number, month: number, year: number): boolean => {
        const checkDate = new Date(toGregorianYear(year), month, day);
        const todayMidnight = new Date();
        todayMidnight.setHours(23, 59, 59, 999);
        return checkDate > todayMidnight;
    };

    // สร้างวันที่ในเดือน
    const getCalendarDays = (month: number, year: number): (number | null)[] => {
        const christianYear = toGregorianYear(year);
        const firstDay = new Date(christianYear, month, 1);
        const lastDay = new Date(christianYear, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (number | null)[] = [];

        // เพิ่มวันที่ว่างสำหรับวันแรกของเดือน
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // เพิ่มวันที่ในเดือน
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    // จัดการการเลือกวันที่
    const handleDateSelect = (day: number | null): void => {
        if (!day) return;

        // ตรวจสอบว่าเป็นวันที่อนาคตหรือไม่
        if (isFutureDate(day, currentMonth, currentYear)) {
            return; // ไม่อนุญาตให้เลือกวันที่อนาคต
        }

        const christianYear = buddhistToChristian(currentYear);
        const selectedDate = new Date(christianYear, currentMonth, day);
        const isoString = getLocalIsoDate(selectedDate); // yyyy-mm-dd format

        onChange(isoString);
        const formattedDate = formatThaiDate(isoString);
        setInputValue(formattedDate);
        setIsOpen(false);
        setShowMonthPicker(false);
        setShowYearPicker(false);
        
        // คืนการ focus กลับไปที่ input
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    // จัดการการพิมพ์ในช่อง input
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ): void => {
        const val = e.target.value;
        setInputValue(val);

        // ตรวจสอบรูปแบบวันที่ไทย เช่น "15 มกราคม 2567" หรือ "15/1/2567"
        const thaiDatePattern1 = /^(\d{1,2})\s*(\S+)\s*(\d{4})$/;
        const thaiDatePattern2 = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

        let match = val.match(thaiDatePattern1);
        if (match) {
            const [, day, monthStr, yearStr] = match;
            const monthIndex = thaiMonths.findIndex((m) =>
                m.includes(monthStr),
            );
            if (monthIndex !== -1) {
                const buddhistYear = parseInt(yearStr);
                const christianYear = buddhistToChristian(buddhistYear);
                const date = new Date(christianYear, monthIndex, parseInt(day));

                // ตรวจสอบว่าไม่ใช่วันที่อนาคต
                if (
                    !isNaN(date.getTime()) &&
                    !isFutureDate(parseInt(day), monthIndex, buddhistYear)
                ) {
                    const isoString = getLocalIsoDate(date);
                    onChange(isoString);
                    const formattedDate = formatThaiDate(isoString);
                    setInputValue(formattedDate);
                    setCurrentMonth(monthIndex);
                    setCurrentYear(buddhistYear);
                }
            }
        }

        match = val.match(thaiDatePattern2);
        if (match) {
            const [, day, month, yearStr] = match;
            const buddhistYear = parseInt(yearStr);
            const christianYear = buddhistToChristian(buddhistYear);
            const date = new Date(
                christianYear,
                parseInt(month) - 1,
                parseInt(day),
            );

            // ตรวจสอบว่าไม่ใช่วันที่อนาคต
            if (
                !isNaN(date.getTime()) &&
                !isFutureDate(parseInt(day), parseInt(month) - 1, buddhistYear)
            ) {
                const isoString = getLocalIsoDate(date);
                onChange(isoString);
                const formattedDate = formatThaiDate(isoString);
                setInputValue(formattedDate);
                setCurrentMonth(parseInt(month) - 1);
                setCurrentYear(buddhistYear);
            }
        }
    };

    // จัดการการคลิกนอก modal และ keyboard events
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (isOpen) {
                const target = event.target as Element;
                // ตรวจสอบว่าคลิกที่ backdrop (ไม่ใช่ modal content)
                if (target.classList.contains('fixed') && target.classList.contains('inset-0')) {
                    setIsOpen(false);
                    setShowMonthPicker(false);
                    setShowYearPicker(false);
                }
            }
        };

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (isOpen && event.key === 'Escape') {
                setIsOpen(false);
                setShowMonthPicker(false);
                setShowYearPicker(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
            // ป้องกันการ scroll ของ body เมื่อ modal เปิด
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // อัพเดต display date เมื่อ value เปลี่ยน
    useEffect(() => {
        if (value) {
            const formatted = formatThaiDate(value);
            setInputValue(formatted);

            // อัพเดต current month และ year สำหรับ calendar
            const date = new Date(value);
            setCurrentMonth(date.getMonth());
            setCurrentYear(christianToBuddhist(date.getFullYear()));
        } else {
            setInputValue('');
        }
    }, [value]);

    const days = getDaysInMonth(currentMonth, currentYear);

    return (
        <>
            <div className={`relative w-full ${className}`} ref={dropdownRef}>
                {/* Input Field */}
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        name={name}
                        id={id}
                        value={inputValue}
                        onChange={handleInputChange}
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        placeholder={placeholder}
                        disabled={disabled}
                        required={required}
                        className="w-full px-4 py-3 pr-12 text-gray-700 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    />
                    <button
                        type="button"
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        disabled={disabled}
                        title="เปิดปฏิทิน"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200 disabled:cursor-not-allowed"
                    >
                        <Calendar size={20} />
                    </button>
                </div>
            </div>

            {/* Modal Backdrop */}
            {isOpen && !disabled && (
                <div 
                    className="fixed inset-0 bg-transparent flex items-center justify-center z-[9999] p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsOpen(false);
                            setShowMonthPicker(false);
                            setShowYearPicker(false);
                        }
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25),0_8px_32px_-8px_rgba(0,0,0,0.15)] max-w-sm w-full max-h-[90vh] overflow-hidden animate-in zoom-in duration-200 border border-gray-100" role="dialog" aria-modal="true" aria-labelledby="datepicker-title">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                            <h3 id="datepicker-title" className="text-lg font-semibold text-gray-800">เลือกวันที่</h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowMonthPicker(false);
                                    setShowYearPicker(false);
                                    inputRef.current?.focus();
                                }}
                                className="p-2 hover:bg-white hover:bg-opacity-60 rounded-lg transition-colors duration-200"
                                title="ปิด"
                                aria-label="ปิด modal เลือกวันที่"
                            >
                                <X size={20} className="text-gray-600" />
                            </button>
                        </div>

                        {/* Calendar Content */}
                        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                            {/* Navigation Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                <button
                                    type="button"
                                    title="เดือนก่อนหน้า"
                                    onClick={() => {
                                        if (currentMonth === 0) {
                                            setCurrentMonth(11);
                                            setCurrentYear(currentYear - 1);
                                        } else {
                                            setCurrentMonth(currentMonth - 1);
                                        }
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                >
                                    <ChevronLeft size={18} className="text-gray-600" />
                                </button>

                                <div className="flex items-center space-x-2">
                                    <button
                                        type="button"
                                        title="เลือกเดือน"
                                        onClick={() => {
                                            setShowMonthPicker(!showMonthPicker);
                                            setShowYearPicker(false);
                                        }}
                                        className="font-semibold text-gray-800 text-lg hover:text-blue-600 transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-gray-100"
                                    >
                                        {thaiMonths[currentMonth]}
                                    </button>
                                    <button
                                        type="button"
                                        title="เลือกปี"
                                        onClick={() => {
                                            setShowYearPicker(!showYearPicker);
                                            setShowMonthPicker(false);
                                        }}
                                        className="font-semibold text-blue-600 text-lg hover:text-blue-800 transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-gray-100"
                                    >
                                        {currentYear}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    title="เดือนถัดไป"
                                    onClick={() => {
                                        if (currentMonth === 11) {
                                            setCurrentMonth(0);
                                            setCurrentYear(currentYear + 1);
                                        } else {
                                            setCurrentMonth(currentMonth + 1);
                                        }
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                >
                                    <ChevronRight size={18} className="text-gray-600" />
                                </button>
                            </div>

                            {/* Month Picker */}
                            {showMonthPicker && (
                                <div className="p-4 border-b border-gray-100 bg-gray-50">
                                    <div className="grid grid-cols-3 gap-2">
                                        {thaiMonths.map((month, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => {
                                                    setCurrentMonth(index);
                                                    setShowMonthPicker(false);
                                                }}
                                                className={`p-3 text-sm rounded-lg transition-colors duration-200 ${
                                                    index === currentMonth
                                                        ? 'bg-blue-500 text-white'
                                                        : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                                                }`}
                                            >
                                                {month}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Year Picker */}
                            {showYearPicker && (
                                <div className="p-4 border-b border-gray-100 bg-gray-50">
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                        {Array.from({ length: 50 }, (_, i) => {
                                            const year = todayYear - i; // เริ่มจากปีปัจจุบันย้อนหลัง
                                            return (
                                                <button
                                                    key={year}
                                                    type="button"
                                                    onClick={() => {
                                                        setCurrentYear(year);
                                                        setShowYearPicker(false);
                                                    }}
                                                    className={`p-3 text-sm rounded-lg transition-colors duration-200 ${
                                                        year === currentYear
                                                            ? 'bg-blue-500 text-white'
                                                            : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                                                    }`}
                                                >
                                                    {year}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Days of Week Header */}
                            {!showMonthPicker && !showYearPicker && (
                                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                                    {thaiDaysShort.map((day) => (
                                        <div
                                            key={day}
                                            className="p-3 text-center text-sm font-medium text-gray-600"
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Calendar Grid */}
                            {!showMonthPicker && !showYearPicker && (
                                <div className="grid grid-cols-7 p-3">
                                    {getCalendarDays(currentMonth, currentYear).map((day, index) => {
                                        const isToday =
                                            day &&
                                            currentMonth === todayMonth &&
                                            currentYear === todayYear &&
                                            day === todayDate;

                                        const isSelected =
                                            day &&
                                            value &&
                                            new Date(value).getDate() === day &&
                                            new Date(value).getMonth() ===
                                                currentMonth &&
                                            christianToBuddhist(
                                                new Date(value).getFullYear(),
                                            ) === currentYear;

                                        const isFuture =
                                            day &&
                                            isFutureDate(
                                                day,
                                                currentMonth,
                                                currentYear,
                                            );

                                        return (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => handleDateSelect(day)}
                                                disabled={!day || !!isFuture}
                                                className={`
                          w-11 h-11 m-1 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center
                          ${!day ? 'invisible' : ''}
                          ${
                              isFuture
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                                  : isToday
                                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100'
                          }
                        `}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Today Button */}
                            {!showMonthPicker && !showYearPicker && (
                                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const todayIso = getLocalIsoDate(today);
                                            onChange(todayIso);
                                            const formattedToday = formatThaiDate(todayIso);
                                            setInputValue(formattedToday);
                                            setCurrentMonth(todayMonth);
                                            setCurrentYear(todayYear);
                                            setIsOpen(false);
                                        }}
                                        className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm"
                                    >
                                        📅 เลือกวันนี้
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                                    >
                                        ยกเลิก
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ThaiDatePicker;
