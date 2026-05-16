/**
 * Shared validation schemas using Zod
 * Used across API endpoints for input validation
 */

import { z } from 'zod';

// ============================================
// Authentication Validators
// ============================================

export const LoginSchema = z.object({
    email: z
        .string({ message: 'Email is required' })
        .email({ message: 'Invalid email format' })
        .toLowerCase(),
    password: z
        .string({ message: 'Password is required' })
        .min(8, { message: 'Password must be at least 8 characters' })
        .max(128, { message: 'Password must not exceed 128 characters' }),
    rememberMe: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
    email: z
        .string({ message: 'Email is required' })
        .email({ message: 'Invalid email format' })
        .toLowerCase(),
    password: z
        .string({ message: 'Password is required' })
        .min(8, { message: 'Password must be at least 8 characters' })
        .max(128, { message: 'Password must not exceed 128 characters' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
        .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
        .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
    name: z
        .string({ message: 'Name is required' })
        .min(2, { message: 'Name must be at least 2 characters' })
        .max(100, { message: 'Name must not exceed 100 characters' }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const PasswordResetSchema = z.object({
    email: z
        .string({ message: 'Email is required' })
        .email({ message: 'Invalid email format' })
        .toLowerCase(),
});

export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;

// ============================================
// Configuration Validators
// ============================================

export const MosqueConfigSchema = z.object({
    mosqueName: z
        .string({ message: 'Mosque name is required' })
        .min(2, { message: 'Mosque name must be at least 2 characters' })
        .max(100, { message: 'Mosque name must not exceed 100 characters' }),
    
    location: z.object({
        latitude: z
            .number({ message: 'Latitude must be a number' })
            .min(-90, { message: 'Latitude must be between -90 and 90' })
            .max(90, { message: 'Latitude must be between -90 and 90' }),
        longitude: z
            .number({ message: 'Longitude must be a number' })
            .min(-180, { message: 'Longitude must be between -180 and 180' })
            .max(180, { message: 'Longitude must be between -180 and 180' }),
    }).optional(),
    
    calculation: z.enum(['ISNA', 'MWL', 'DIYANET', 'ISLAMIC_RELIEF', 'KARACHI']).optional(),
    
    videoStreaming: z.object({
        enabled: z.boolean(),
        url: z
            .string()
            .url({ message: 'Invalid URL for video streaming' })
            .optional()
            .nullable(),
        showInSlideshow: z.boolean().optional(),
        durationMinutes: z
            .number()
            .min(1, { message: 'Duration must be at least 1 minute' })
            .max(120, { message: 'Duration must not exceed 120 minutes' })
            .optional(),
    }).optional(),
    
    adhanAudio: z.object({
        enabled: z.boolean(),
        customUrl: z
            .string()
            .url({ message: 'Invalid URL for custom adhan' })
            .optional()
            .nullable(),
    }).optional(),
});

export type MosqueConfigInput = z.infer<typeof MosqueConfigSchema>;

export const UpdateConfigSchema = MosqueConfigSchema.partial();

export type UpdateConfigInput = z.infer<typeof UpdateConfigSchema>;

// ============================================
// File Upload Validators
// ============================================

export const FileUploadSchema = z.object({
    fileName: z
        .string({ message: 'File name is required' })
        .min(1, { message: 'File name cannot be empty' })
        .max(255, { message: 'File name too long' })
        .regex(/^[a-zA-Z0-9._-]+$/, { message: 'File name contains invalid characters' }),
    fileType: z
        .enum(['audio', 'image', 'video'], { message: 'Invalid file type' }),
    fileSize: z
        .number({ message: 'File size must be a number' })
        .positive({ message: 'File size must be positive' })
        .max(104857600, { message: 'File size must not exceed 100MB' }),
});

export type FileUploadInput = z.infer<typeof FileUploadSchema>;

// ============================================
// Prayer Times Validators
// ============================================

export const PrayerTimesConfigSchema = z.object({
    athan: z.object({
        enabled: z.boolean(),
        useCustom: z.boolean(),
        customUrl: z.string().url().optional().nullable(),
    }).optional(),
    
    calculation: z.enum(['ISNA', 'MWL', 'DIYANET']).optional(),
    
    adjustments: z.object({
        fajr: z.number().int().min(-120).max(120).optional(),
        dhuhr: z.number().int().min(-120).max(120).optional(),
        asr: z.number().int().min(-120).max(120).optional(),
        maghrib: z.number().int().min(-120).max(120).optional(),
        isha: z.number().int().min(-120).max(120).optional(),
    }).optional(),
});

export type PrayerTimesConfigInput = z.infer<typeof PrayerTimesConfigSchema>;

// ============================================
// Utility Functions
// ============================================

/**
 * Safely validate data with Zod schema
 * Returns object with success status and data or errors
 */
export function validateData<T>(
    schema: z.Schema<T>,
    data: unknown
): { success: boolean; data?: T; errors?: Array<{ code: string; message: string; path: (string | number)[] }> } {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { 
                success: false, 
                errors: error.issues.map((err: z.ZodIssue) => ({
                    code: err.code,
                    message: err.message,
                    path: err.path as (string | number)[]
                }))
            };
        }
        return { 
            success: false, 
            errors: [{ 
                code: 'unknown_error', 
                message: 'Unknown validation error', 
                path: [] 
            }] 
        };
    }
}

/**
 * Format Zod errors into readable message
 */
export function formatZodErrors(
    errors: Array<{ code: string; message: string; path: (string | number)[] }>
): string {
    return errors
        .map((err: { code: string; message: string; path: (string | number)[] }) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
}
