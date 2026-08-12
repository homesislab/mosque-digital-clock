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

/**
 * Schema for the full MosqueConfig object.
 * Uses .passthrough() to allow extra fields while validating
 * the core structure matches the MosqueConfig TypeScript interface.
 */
export const MosqueConfigSchema = z.object({
    mosqueInfo: z.object({
        name: z.string().min(1).max(200),
        address: z.string().max(500).default(''),
        logoUrl: z.string().url().optional(),
    }),
    display: z.object({
        theme: z.enum(['dark', 'light', 'green', 'blue']).default('dark'),
        showSeconds: z.boolean().default(true),
        showHijriDate: z.boolean().default(true),
        timeOffset: z.number().int().optional(),
    }),
    prayerTimes: z.object({
        calculationMethod: z.string().min(1),
        cityId: z.string().optional(),
        cityName: z.string().optional(),
        coordinates: z.object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
        }),
        adjustments: z.object({
            subuh: z.number().int().min(-120).max(120),
            dzuhur: z.number().int().min(-120).max(120),
            jumat: z.number().int().min(-120).max(120),
            ashar: z.number().int().min(-120).max(120),
            maghrib: z.number().int().min(-120).max(120),
            isya: z.number().int().min(-120).max(120),
        }),
    }),
    iqamah: z.object({
        enabled: z.boolean(),
        waitTime: z.object({
            subuh: z.number().int().min(0),
            dzuhur: z.number().int().min(0),
            jumat: z.number().int().min(0),
            ashar: z.number().int().min(0),
            maghrib: z.number().int().min(0),
            isya: z.number().int().min(0),
        }),
        displayDuration: z.number().int().min(0),
        audioEnabled: z.boolean().optional(),
        audioUrl: z.string().optional(),
    }).optional(),
    adzan: z.object({
        duration: z.number().int().min(0),
        audioEnabled: z.boolean().optional(),
        audioUrl: z.string().optional(),
    }).optional(),
    sholat: z.object({
        duration: z.number().int().min(0),
    }).optional(),
    sliderImages: z.array(z.string()).default([]),
    runningText: z.array(z.string()).default([]),
    officers: z.array(z.object({
        role: z.string(),
        name: z.string(),
    })).default([]),
    officersEnabled: z.boolean().optional(),
    jumat: z.array(z.object({
        date: z.string().optional(),
        khotib: z.string(),
        imam: z.string(),
        muadzin: z.string(),
    })).optional(),
    jumatEnabled: z.boolean().optional(),
    ramadhan: z.object({
        enabled: z.boolean(),
        imsakOffset: z.number().int().min(0).max(60),
        imsakAudioEnabled: z.boolean().optional(),
        imsakAudioUrl: z.string().optional(),
        imsakAudioDuration: z.number().int().optional(),
    }).optional(),
    advancedDisplay: z.object({
        showLogo: z.boolean().optional(),
        showDate: z.boolean().optional(),
        showClock: z.boolean().optional(),
        showRunningText: z.boolean().optional(),
        showPrayerTimes: z.boolean().optional(),
        theme: z.enum(['light', 'dark', 'glass']).optional(),
        fontScale: z.enum(['small', 'normal', 'large']).optional(),
        customCss: z.string().optional(),
        headerOpacity: z.number().min(0).max(1).optional(),
        prayerTimesOpacity: z.number().min(0).max(1).optional(),
        headerBlur: z.number().min(0).max(50).optional(),
        prayerTimesBlur: z.number().min(0).max(50).optional(),
        runningTextSpeed: z.number().optional(),
        clockWeight: z.enum(['light', 'normal', 'bold']).optional(),
        showNextPrayerCountdown: z.boolean().optional(),
        lowEndMode: z.boolean().optional(),
        headerTextColor: z.string().optional(),
        dateTextColor: z.string().optional(),
        clockTextColor: z.string().optional(),
        glowColor: z.string().optional(),
        runningTextColor: z.string().optional(),
        runningTextBgColor: z.string().optional(),
        prayerTimesTextColor: z.string().optional(),
        prayerTimesBgColor: z.string().optional(),
        prayerTimesActiveColor: z.string().optional(),
        prayerTimesActiveBgColor: z.string().optional(),
        prayerTimesActiveTextColor: z.string().optional(),
        slideshowOverlayColor: z.string().optional(),
    }).optional(),
}).passthrough();

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
    // Diselaraskan dengan MosqueConfig.prayerTimes (lihat src/index.ts)
    calculationMethod: z.string(),
    cityId: z.string().optional(),   // sumber jadwal pusat (myQuran/Kemenag)
    cityName: z.string().optional(),
    coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    }),
    adjustments: z.object({
        subuh: z.number().int().min(-120).max(120),
        dzuhur: z.number().int().min(-120).max(120),
        jumat: z.number().int().min(-120).max(120),
        ashar: z.number().int().min(-120).max(120),
        maghrib: z.number().int().min(-120).max(120),
        isya: z.number().int().min(-120).max(120),
    }),
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
