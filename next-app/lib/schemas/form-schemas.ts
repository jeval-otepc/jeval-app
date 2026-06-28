import { z } from 'zod';

// General Information Form Schema
export const generalFormSchema = z.object({
    TypePos: z
        .string()
        .min(1, 'กรุณาเลือกประเภทตำแหน่ง')
        .max(50, 'ประเภทตำแหน่งต้องไม่เกิน 50 ตัวอักษร'),
    
    Name_Pos: z
        .string()
        .min(1, 'กรุณาระบุชื่อตำแหน่ง')
        .max(200, 'ชื่อตำแหน่งต้องไม่เกิน 200 ตัวอักษร'),
    
    Num_Pos_M: z
        .string()
        .min(1, 'กรุณาระบุเลขที่ตำแหน่ง')
        .max(50, 'เลขที่ตำแหน่งต้องไม่เกิน 50 ตัวอักษร')
        .regex(/^[A-Z0-9\-]+$/, 'เลขที่ตำแหน่งต้องประกอบด้วยตัวอักษรภาษาอังกฤษใหญ่ ตัวเลข และเครื่องหมายขีด'),
    
    Affiliation: z
        .string()
        .min(1, 'กรุณาระบุสังกัด')
        .max(300, 'สังกัดต้องไม่เกิน 300 ตัวอักษร'),
    
    EducationalInstitution: z
        .string()
        .min(1, 'กรุณาระบุสถานศึกษา')
        .max(300, 'สถานศึกษาต้องไม่เกิน 300 ตัวอักษร'),
    
    DateTimeInput_M: z
        .string()
        .min(1, 'กรุณาเลือกวันที่')
        .refine((val) => {
            // Validate Thai date format (DD/MM/YYYY) or ISO date
            const thaiDateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
            return thaiDateRegex.test(val) || isoDateRegex.test(val) || !isNaN(Date.parse(val));
        }, 'รูปแบบวันที่ไม่ถูกต้อง'),
});

// Question Response Schema
export const questionResponseSchema = z.object({
    questionId: z
        .number()
        .int()
        .positive('รหัสคำถามต้องเป็นจำนวนเต็มบวก'),
    
    questionNo: z
        .number()
        .int()
        .positive('หมายเลขคำถามต้องเป็นจำนวนเต็มบวก'),
    
    value: z
        .string()
        .min(1, 'กรุณาเลือกคำตอบ')
        .max(10, 'คำตอบต้องไม่เกิน 10 ตัวอักษร'),
    
    memo: z
        .string()
        .max(1000, 'หมายเหตุต้องไม่เกิน 1000 ตัวอักษร')
        .optional()
        .or(z.literal('')),
});

// Multiple Question Responses Schema
export const questionsSubmissionSchema = z.object({
    formId: z
        .string()
        .min(1, 'รหัสแบบฟอร์มไม่ถูกต้อง'),
    
    responses: z
        .array(questionResponseSchema)
        .min(1, 'ต้องมีคำตอบอย่างน้อย 1 ข้อ')
        .max(100, 'คำตอบต้องไม่เกิน 100 ข้อ'),
});

// Login Schema
export const loginSchema = z.object({
    identifier: z
        .string()
        .min(1, 'กรุณาระบุชื่อผู้ใช้หรืออีเมล')
        .max(255, 'ชื่อผู้ใช้หรืออีเมลต้องไม่เกิน 255 ตัวอักษร'),
    
    password: z
        .string()
        .min(1, 'กรุณาระบุรหัสผ่าน')
        .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
        .max(128, 'รหัสผ่านต้องไม่เกิน 128 ตัวอักษร'),
    
    remember: z
        .boolean()
        .optional()
        .default(false),
});

// User Profile Update Schema
export const userProfileSchema = z.object({
    username: z
        .string()
        .min(3, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร')
        .max(50, 'ชื่อผู้ใช้ต้องไม่เกิน 50 ตัวอักษร')
        .regex(/^[a-zA-Z0-9_-]+$/, 'ชื่อผู้ใช้สามารถประกอบด้วยตัวอักษร ตัวเลข เครื่องหมายขีด และขีดใต้เท่านั้น'),
    
    email: z
        .string()
        .email('รูปแบบอีเมลไม่ถูกต้อง')
        .max(255, 'อีเมลต้องไม่เกิน 255 ตัวอักษร'),
    
    firstName: z
        .string()
        .min(1, 'กรุณาระบุชื่อจริง')
        .max(100, 'ชื่อจริงต้องไม่เกิน 100 ตัวอักษร')
        .optional(),
    
    lastName: z
        .string()
        .min(1, 'กรุณาระบุนามสกุล')
        .max(100, 'นามสกุลต้องไม่เกิน 100 ตัวอักษร')
        .optional(),
});

// Change Password Schema
export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, 'กรุณาระบุรหัสผ่านปัจจุบัน'),
    
    newPassword: z
        .string()
        .min(6, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร')
        .max(128, 'รหัสผ่านใหม่ต้องไม่เกิน 128 ตัวอักษร')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'รหัสผ่านใหม่ต้องประกอบด้วยตัวอักษรเล็ก ใหญ่ และตัวเลข'
        ),
    
    confirmPassword: z
        .string()
        .min(1, 'กรุณายืนยันรหัสผ่านใหม่'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
});

// Search/Filter Schema
export const searchFiltersSchema = z.object({
    query: z
        .string()
        .max(200, 'คำค้นหาต้องไม่เกิน 200 ตัวอักษร')
        .optional(),
    
    category: z
        .string()
        .max(50, 'หมวดหมู่ต้องไม่เกิน 50 ตัวอักษร')
        .optional(),
    
    status: z
        .enum(['active', 'inactive', 'pending', 'archived'])
        .optional(),
    
    dateFrom: z
        .string()
        .refine((val) => !val || !isNaN(Date.parse(val)), 'รูปแบบวันที่เริ่มต้นไม่ถูกต้อง')
        .optional(),
    
    dateTo: z
        .string()
        .refine((val) => !val || !isNaN(Date.parse(val)), 'รูปแบบวันที่สิ้นสุดไม่ถูกต้อง')
        .optional(),
    
    sortBy: z
        .string()
        .max(50, 'เงื่อนไขการเรียงลำดับต้องไม่เกิน 50 ตัวอักษร')
        .optional(),
    
    sortOrder: z
        .enum(['asc', 'desc'])
        .optional()
        .default('desc'),
    
    page: z
        .number()
        .int()
        .positive()
        .optional()
        .default(1),
    
    limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(20),
}).refine((data) => {
    if (data.dateFrom && data.dateTo) {
        return new Date(data.dateFrom) <= new Date(data.dateTo);
    }
    return true;
}, {
    message: 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด',
    path: ['dateTo'],
});

// Export inferred types
export type GeneralFormData = z.infer<typeof generalFormSchema>;
export type QuestionResponseData = z.infer<typeof questionResponseSchema>;
export type QuestionsSubmissionData = z.infer<typeof questionsSubmissionSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UserProfileData = z.infer<typeof userProfileSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type SearchFiltersData = z.infer<typeof searchFiltersSchema>;