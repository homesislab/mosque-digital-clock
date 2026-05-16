# 🕌 Mosque Digital Clock - Comprehensive Code & Design Audit Report

**Date:** April 8, 2026  
**Reviewer:** Senior Full-stack Developer & UI/UX Specialist  
**Status:** Production-Ready (with Critical Security Issues to Fix)

---

## 📋 Executive Summary

Aplikasi Mosque Digital Clock menunjukkan **arsitektur yang solid** dengan Next.js modern stack, MongoDB-MySQL hybrid, dan fitur-fitur yang komprehensif (jadwal sholat, wabot integration, prayer notifications). Namun, terdapat **3 CRITICAL security issues**, beberapa **performance bottlenecks**, dan **UX improvements** yang perlu ditangani sebelum production.

### Score Card:
- ✅ **Code Quality:** 7/10 (Dengan perbaikan error handling)
- ✅ **UI/UX Design:** 8/10 (Konsisten, modern, butuh accessibility improvements)
- ⚠️ **Security:** 4/10 (**CRITICAL ISSUES**)
- ✅ **Performance:** 7/10 (Perlu optimization pada config fetching)

---

## 🔴 CRITICAL ISSUES (Must Fix Before Production)

### 1. **CRITICAL: Plain Text Password Storage**

**Location:** `apps/web-admin/app/api/auth/login/route.ts` (Line 15)  
**Severity:** 🔴 CRITICAL

**Problem:**
```typescript
// ❌ WRONG: Storing plain text password comparison
if (user && user.passwordHash === password) { // No hashing!
    // ...
}
```

**Impact:** 
- If database is breached, ALL admin passwords are exposed
- Credentials can be stolen easily
- Violates GDPR, PCI-DSS compliance

**Fix:**
```typescript
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
    try {
        const { email, password, rememberMe } = await request.json();
        const user = await findUserByEmail(email);

        // ✅ CORRECT: Using bcrypt for password verification
        if (user && await bcrypt.compare(password, user.passwordHash)) {
            const cookieStore = await cookies();
            
            // Set secure cookies with proper options
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict' as const,
                path: '/',
                maxAge: rememberMe 
                    ? 60 * 60 * 24 * 30  // 30 days
                    : 60 * 60 * 24       // 1 day
            };

            cookieStore.set('admin-session', user.id, cookieOptions);
            return NextResponse.json({ success: true, mosqueKey: user.mosqueKeys[0] });
        }

        return NextResponse.json(
            { success: false, message: 'Email atau password salah' },
            { status: 401 }
        );
    } catch (error) {
        logger.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
```

**Also Update User Creation:**
```typescript
// apps/web-admin/lib/user-store.ts
import bcrypt from 'bcrypt';

export async function addUser(user: User) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // ✅ Hash password before storing
        const hashedPassword = await bcrypt.hash(user.passwordHash, 10);
        
        await connection.query(
            'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
            [user.id, user.email, hashedPassword]
        );
        
        // ... rest of code
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
```

**Dependencies to Add:**
```bash
npm install bcrypt types/bcrypt --save
```

---

### 2. **CRITICAL: Missing Input Validation & SQL Injection Risk**

**Location:** Multiple API endpoints (`apps/web-admin/app/api/**/*`)  
**Severity:** 🔴 CRITICAL

**Problem:** Input parameters tidak divalidasi sebelum digunakan dalam database queries.

```typescript
// ❌ WRONG: No validation
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'default'; // Bisa arbitrary string!
    
    // Direct usage tanpa validation
    const result = await getConfig(key);
}
```

**Fix:**
```typescript
import { z } from 'zod'; // Add validation library

// Define schemas
const MosqueKeySchema = z.string()
    .min(1, 'Mosque key required')
    .max(100, 'Mosque key too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid characters in mosque key');

const ConfigUpdateSchema = z.object({
    mosqueInfo: z.object({
        name: z.string().min(1).max(200),
        address: z.string().min(1).max(500),
        logoUrl: z.string().url().optional()
    }),
    // ... validate all other fields similarly
    videoStreaming: z.object({
        enabled: z.boolean(),
        url: z.string().url('Valid YouTube embed URL required'),
        showInSlideshow: z.boolean(),
        durationMinutes: z.number().min(1).max(60)
    }).optional()
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key') || 'default';
        
        // ✅ Validate input
        const validatedKey = MosqueKeySchema.parse(key);
        
        const { allowed, status } = await validateAccess(request, validatedKey);
        if (!allowed) {
            return NextResponse.json({ error: 'Unauthorized' }, { status });
        }

        const config = await getConfig(validatedKey);
        return NextResponse.json(config, { headers: corsHeaders });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400, headers: corsHeaders }
            );
        }
        logger.error('Config GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key') || 'default';
        
        const validatedKey = MosqueKeySchema.parse(key);
        const { allowed, status } = await validateAccess(request, validatedKey);
        if (!allowed) {
            return NextResponse.json({ error: 'Unauthorized' }, { status });
        }

        const body = await request.json();
        
        // ✅ Validate entire config structure
        const validatedConfig = ConfigUpdateSchema.parse(body);
        
        await saveConfig(validatedKey, validatedConfig);
        
        logger.info(`Config updated for ${validatedKey}`);
        return NextResponse.json({ success: true }, { headers: corsHeaders });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid configuration', details: error.errors },
                { status: 400, headers: corsHeaders }
            );
        }
        logger.error('Config POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
```

---

### 3. **CRITICAL: Exposed Database Credentials**

**Location:** `apps/web-admin/lib/db.ts` (Line 13-18)  
**Severity:** 🔴 CRITICAL

**Problem:**
```typescript
// ❌ WRONG: Hardcoded credentials in source code!
const pool = mysql.createPool({
    host: 'localhost',
    user: 'mosque_user',
    password: 'Moalnyaho135',  // ⚠️ EXPOSED!
    database: 'mosque-digitaldb',
    // ...
});
```

**Fix:**
```typescript
// ✅ CORRECT: Use environment variables
import mysql from 'mysql2/promise';

if (!process.env.DATABASE_URL && (!process.env.DB_HOST || !process.env.DB_PASSWORD)) {
    throw new Error('DATABASE_URL or database credentials must be set in environment variables');
}

const pool = process.env.DATABASE_URL
    ? mysql.createPool(process.env.DATABASE_URL)
    : mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'mosque_user',
        password: process.env.DB_PASSWORD, // MUST be set
        database: process.env.DB_NAME || 'mosque-digitaldb',
        waitForConnections: true,
        connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '10'),
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelayMs: 30000,
    });

// Add connection error handler
pool.on('error', (err) => {
    console.error('Database pool error:', err);
    // Alert monitoring system
});

export default pool;
```

**Update `.env.example`:**
```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/dbname
# OR individual settings:
DB_HOST=localhost
DB_PORT=3306
DB_USER=mosque_user
DB_PASSWORD=your_secure_password_here
DB_NAME=mosque-digitaldb
DB_POOL_LIMIT=10

# Session
SESSION_SECRET=your_random_secret_key_min_32_chars

# API
API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

---

## 🟡 HIGH PRIORITY ISSUES

### 4. **Missing Rate Limiting on APIs**

**Location:** All API endpoints  
**Severity:** 🟡 HIGH

**Problem:** API endpoints tidak memiliki rate limiting, vulnerable terhadap brute force dan DoS.

**Fix:**
```typescript
import { NextRequest, NextResponse } from 'next/server';

// Implement rate limiting middleware
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(maxRequests: number = 10, windowMs: number = 60000) {
    return (handler: (req: NextRequest) => Promise<NextResponse>) => {
        return async (request: NextRequest) => {
            const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
            const key = `${ip}-${request.nextUrl.pathname}`;
            
            const now = Date.now();
            const record = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
            
            if (now > record.resetTime) {
                // Window expired, reset
                record.count = 0;
                record.resetTime = now + windowMs;
            }
            
            if (record.count >= maxRequests) {
                return NextResponse.json(
                    { error: 'Too many requests' },
                    { status: 429, headers: { 'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)) } }
                );
            }
            
            record.count++;
            rateLimitStore.set(key, record);
            
            return handler(request);
        };
    };
}

// Usage in API endpoint:
export const POST = withRateLimit(5, 60000)(async (request) => {
    // Your handler logic
    return NextResponse.json({ success: true });
});

// Better option: Use external service like Redis-based rate limiting
// npm install redis ioredis
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function checkRateLimit(key: string, limit: number = 10, window: number = 60): Promise<boolean> {
    const current = await redis.incr(key);
    if (current === 1) {
        await redis.expire(key, window);
    }
    return current <= limit;
}
```

---

### 5. **Weak Error Handling & Missing Try-Catch Blocks**

**Location:** `apps/web-client/app/lib/constants.ts` and various components  
**Severity:** 🟡 HIGH

**Problem:**
```typescript
// ❌ WRONG: No error handling in fetchConfig
export async function fetchConfig(key: string): Promise<MosqueConfig> {
    const response = await fetch(`${getApiBaseUrl()}/api/config?key=${key}`, {
        headers: { 'x-clock-client': 'true', 'x-device-id': getDeviceId() }
    });
    
    if (!response.ok) throw new Error('Failed to fetch config');
    return response.json();
}
```

**Fix:**
```typescript
interface FetchConfigOptions {
    retries?: number;
    timeout?: number;
}

export async function fetchConfig(
    key: string,
    options: FetchConfigOptions = {}
): Promise<MosqueConfig> {
    const { retries = 3, timeout = 5000 } = options;
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(
                `${getApiBaseUrl()}/api/config?key=${encodeURIComponent(key)}`,
                {
                    headers: {
                        'x-clock-client': 'true',
                        'x-device-id': getDeviceId(),
                        'Cache-Control': 'no-cache'
                    },
                    signal: controller.signal,
                }
            );
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Configuration not found');
                } else if (response.status === 401) {
                    throw new Error('Unauthorized access');
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }
            
            const data = await response.json();
            validateConfig(data); // Validate response structure
            
            return data;
            
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            
            if (attempt < retries) {
                const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff
                console.warn(
                    `[fetchConfig] Attempt ${attempt}/${retries} failed. Retrying in ${delayMs}ms...`,
                    lastError.message
                );
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    
    // All retries failed
    console.error('[fetchConfig] All retries exhausted:', lastError?.message);
    logger.error('Failed to fetch config after retries', { key, error: lastError?.message });
    
    // Return fallback config with warning
    return {
        ...DEFAULT_CONFIG,
        _fetchError: lastError?.message
    };
}

// Add config validation
function validateConfig(config: any): asserts config is MosqueConfig {
    if (!config || typeof config !== 'object') {
        throw new Error('Invalid config: not an object');
    }
    
    if (!config.mosqueInfo || typeof config.mosqueInfo !== 'object') {
        throw new Error('Invalid config: missing mosqueInfo');
    }
    
    if (!config.prayerTimes || !config.prayerTimes.coordinates) {
        throw new Error('Invalid config: missing prayer times coordinates');
    }
    
    // Validate videoStreaming if present
    if (config.videoStreaming) {
        if (!config.videoStreaming.url || typeof config.videoStreaming.url !== 'string') {
            throw new Error('Invalid config: invalid videoStreaming URL');
        }
    }
}
```

---

## 🟠 MEDIUM PRIORITY Issues

### 6. **Performance: Inefficient Config Fetching & Caching**

**Location:** `apps/web-client/app/page.tsx` (Line 50+)  
**Severity:** 🟠 MEDIUM

**Problem:** Config di-fetch setiap kali component mount tanpa caching, sehingga banyak request redundant.

**Current Code:**
```typescript
// ❌ WRONG: No caching strategy
const [config, setConfig] = useState<MosqueConfig>(DEFAULT_CONFIG);

useEffect(() => {
    if (!mosqueKey) return;
    
    fetchConfig(mosqueKey).then(setConfig);
    
    // Every minute, re-fetch (inefficient!)
    const interval = setInterval(() => {
        fetchConfig(mosqueKey).then(setConfig);
    }, 60000);
    
    return () => clearInterval(interval);
}, [mosqueKey]);
```

**Fix:**
```typescript
import { useCallback, useRef } from 'react';

// Create a config cache with TTL (Time To Live)
class ConfigCache {
    private cache = new Map<string, { data: MosqueConfig; timestamp: number }>();
    private ttlMs = 5 * 60 * 1000; // 5 minutes
    
    set(key: string, data: MosqueConfig): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }
    
    get(key: string): MosqueConfig | null {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }
    
    clear(key?: string): void {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
}

const configCache = new ConfigCache();

// Use React Query or SWR for better caching
// Or implement custom hook:
function useConfig(mosqueKey: string | null) {
    const [config, setConfig] = useState<MosqueConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const refreshTimeoutRef = useRef<NodeJS.Timeout>();
    
    const loadConfig = useCallback(async () => {
        if (!mosqueKey) return;
        
        try {
            setLoading(true);
            setError(null);
            
            // Check cache first
            const cached = configCache.get(mosqueKey);
            if (cached) {
                setConfig(cached);
                setLoading(false);
                return;
            }
            
            const data = await fetchConfig(mosqueKey);
            configCache.set(mosqueKey, data);
            setConfig(data);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMsg);
            logger.error('Failed to load config', { mosqueKey, error: errorMsg });
        } finally {
            setLoading(false);
        }
    }, [mosqueKey]);
    
    useEffect(() => {
        loadConfig();
        
        // Set up periodic refresh (less frequently)
        const interval = setInterval(loadConfig, 10 * 60 * 1000); // Every 10 minutes
        
        return () => {
            clearInterval(interval);
            clearTimeout(refreshTimeoutRef.current);
        };
    }, [mosqueKey, loadConfig]);
    
    return { config, loading, error, refetch: loadConfig };
}

// Usage in component:
export default function Home() {
    const [mosqueKey, setMosqueKey] = useState<string | null>(null);
    const { config, loading, error } = useConfig(mosqueKey);
    
    if (error) {
        return <ErrorOverlay message={error} />;
    }
    
    // ... rest of component
}
```

---

### 7. **Prayer Times Logic: Edge Case Handling**

**Location:** `apps/web-client/app/lib/logic.ts`  
**Severity:** 🟠 MEDIUM

**Problem:** Logic untuk menghitung next prayer tidak handle edge case dengan sempurna (midnight boundary, Friday logic).

**Current Code Issues:**
```typescript
// ❌ POTENTIAL BUG: Friday handling bisa salah jika timezone offset besar
const isFriday = date.getDay() === 5;
const dhuhrAdjusted = addMin(prayerTimes.dhuhr, 
    isFriday ? (adj.jumat ?? adj.dzuhur) : adj.dzuhur
);
```

**Fix:**
```typescript
// ✅ IMPROVED: More robust prayer time calculation
export function getPrayerTimes(config: MosqueConfig, date: Date = new Date()) {
    if (!config.prayerTimes?.coordinates) {
        console.error('[getPrayerTimes] Missing coordinates');
        return null;
    }
    
    try {
        const { lat, lng } = config.prayerTimes.coordinates;
        
        // Validate coordinates
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new Error(`Invalid coordinates: ${lat}, ${lng}`);
        }
        
        const coordinates = new Coordinates(lat, lng);
        
        let method = CalculationMethod.Singapore();
        if (config.prayerTimes.calculationMethod === 'Kemenag') {
            method = CalculationMethod.Singapore();
        } else if (config.prayerTimes.calculationMethod === 'ISNA') {
            method = CalculationMethod.NorthAmerica();
        }
        
        const prayerTimes = new AdhanPrayerTimes(coordinates, date, method);
        
        const addMin = (d: Date, m: number = 0) => 
            new Date(d.getTime() + (m || 0) * 60000);
        
        const adj = config.prayerTimes.adjustments || {};
        
        // Apply adjustments
        const subuhAdjusted = addMin(prayerTimes.fajr, adj.subuh);
        
        // Calculate Imsak safely
        const imsakOffset = Math.max(0, config.ramadhan?.imsakOffset || 10);
        const imsakTime = addMin(subuhAdjusted, -imsakOffset);
        
        // Determine if Friday based on date AND time
        const isFriday = date.getDay() === 5;
        const jummahAdjustment = adj.jumat ?? adj.dzuhur ?? 0;
        const standardDhuhrAdjustment = adj.dzuhur ?? 0;
        
        const dhuhrAdjusted = addMin(
            prayerTimes.dhuhr,
            isFriday ? jummahAdjustment : standardDhuhrAdjustment
        );
        
        return {
            imsak: imsakTime,
            subuh: subuhAdjusted,
            syuruq: prayerTimes.sunrise,
            [isFriday ? 'jumat' : 'dzuhur']: dhuhrAdjusted,
            ashar: addMin(prayerTimes.asr, adj.ashar ?? 0),
            maghrib: addMin(prayerTimes.maghrib, adj.maghrib ?? 0),
            isya: addMin(prayerTimes.isha, adj.isya ?? 0),
        };
    } catch (error) {
        console.error('[getPrayerTimes] Calculation error:', error);
        logger.error('Prayer times calculation failed', {
            coordinates: config.prayerTimes?.coordinates,
            error: error instanceof Error ? error.message : String(error)
        });
        return null;
    }
}
```

---

### 8. **Memory Leaks in useEffect Hooks**

**Location:** `apps/web-client/app/page.tsx` (Multiple useEffect)  
**Severity:** 🟠 MEDIUM

**Problem:**
```typescript
// ❌ WRONG: Missing cleanup or dependencies
useEffect(() => {
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
}, [config, mosqueKey]); // ✐ `config` object changes frequently, causing re-creates

// ❌ WRONG: EventListener not cleaned up properly
window.addEventListener('keydown', handleKeyDown);
// Missing return () => window.removeEventListener(...)
```

**Fix:**
```typescript
// ✅ CORRECT: Better dependency management
useEffect(() => {
    if (!mosqueKey || !config) return;
    
    const tick = () => {
        let now = new Date();
        if (config.display.timeOffset) {
            now = new Date(now.getTime() + config.display.timeOffset * 1000);
        }
        
        const prayerTimes = getPrayerTimes(config, now);
        const result = calculateAppState(config, prayerTimes, now);
        
        setCurrentTime(now);
        setAppState(result.state);
        setNextEvent({
            name: result.nextPrayerName,
            seconds: result.secondsRemaining,
            activeAudioUrl: result.activeAudioUrl,
            activePlaylistId: result.activePlaylistId || '',
            shouldPlayAudio: result.shouldPlayAudio,
            eventTime: result.eventTime
        });
    };
    
    tick(); // Run immediately
    const timer = setInterval(tick, 1000);
    
    return () => {
        clearInterval(timer);
    };
}, [mosqueKey]); // Only depend on mosqueKey, not entire config

// ✅ CORRECT: Proper event listener cleanup
useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
            e.preventDefault();
            setShowLogoutConfirm(true);
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
}, []); // No dependencies needed
```

---

## 🟢 UI/UX Improvements

### 9. **UI Consistency & Design System Issues**

**Severity:** 🟠 MEDIUM  
**Impact:** User Trust & Accessibility

**Current Issues:**
1. **Missing Loading States** - Some async operations don't show loading indicators
2. **Inconsistent Button Styling** - Mix of styled-components and Tailwind
3. **Poor Accessibility** - Missing ARIA labels, insufficient color contrast
4. **No Error Boundaries** - App crashes without graceful error handling

**Fix - Create Shared Component Library:**

```typescript
// apps/web-client/app/components/LoadingSpinner.tsx
'use client';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'white' | 'emerald' | 'primary';
    message?: string;
}

export function LoadingSpinner({
    size = 'md',
    color = 'primary',
    message
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };
    
    const colorClasses = {
        white: 'text-white',
        emerald: 'text-emerald-500',
        primary: 'text-blue-500'
    };
    
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}>
                <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            </div>
            {message && (
                <p className={`text-sm font-medium ${colorClasses[color]}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
```

```typescript
// apps/web-client/app/components/ErrorBoundary.tsx
'use client';

import { ReactNode, Component, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }
    
    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        // Send to error tracking service
    }
    
    retry = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };
    
    render() {
        if (this.state.hasError && this.state.error) {
            return this.props.fallback ? (
                this.props.fallback(this.state.error, this.retry)
            ) : (
                <div className="w-screen h-screen flex flex-col items-center justify-center bg-red-50 p-4">
                    <AlertTriangle size={48} className="text-red-600 mb-4" />
                    <h1 className="text-2xl font-bold text-red-900 mb-2">
                        Terjadi Kesalahan
                    </h1>
                    <p className="text-red-700 text-center mb-4 max-w-md">
                        {this.state.error.message}
                    </p>
                    <button
                        onClick={this.retry}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        Coba Lagi
                    </button>
                </div>
            );
        }
        
        return this.props.children;
    }
}
```

```typescript
// apps/web-client/app/layout.tsx
'use client';

import { ErrorBoundary } from './components/ErrorBoundary';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id">
            <body>
                <ErrorBoundary>
                    {children}
                </ErrorBoundary>
            </body>
        </html>
    );
}
```

---

### 10. **Accessibility (a11y) Improvements**

**Severity:** 🟠 MEDIUM

**Fix:**
```typescript
// apps/web-client/app/components/TimeDisplay.tsx - Add ARIA labels
export const TimeDisplay = ({ className = '', style, time: externalTime }: TimeDisplayProps) => {
    // ... existing code ...
    
    return (
        <time
            className={className}
            style={style}
            dateTime={displayTime?.toISOString()}
            // ✅ Add accessibility attributes
            role="status"
            aria-live="polite"
            aria-label={`Waktu saat ini: ${formatTime(displayTime)}`}
        >
            {timeStr}
        </time>
    );
};

// apps/web-client/app/components/PrayerTimes.tsx - Add ARIA labels
export const PrayerTimes = ({ config, nextPrayer, secondsRemaining }: PrayerTimesProps) => {
    return (
        <div
            className="grid grid-cols-4 lg:flex lg:flex-row w-full h-full"
            role="region"
            aria-label="Jadwal waktu sholat hari ini"
            aria-live="polite"
        >
            {prayers.map((prayer) => (
                <div
                    key={prayer.name}
                    role="article"
                    aria-current={isActive ? 'time' : undefined}
                    aria-label={`${prayer.name}: ${prayer.time}${isActive ? ` (${secondsRemaining} detik lagi)` : ''}`}
                >
                    {/* ... */}
                </div>
            ))}
        </div>
    );
};
```

---

## 🚀 BEST PRACTICE RECOMMENDATIONS

### 11. **Must-Have Features for Modern Mosque Apps**

#### A. **Push Notifications for Adzan (Native & Web)**

```typescript
// Enable Service Worker push notifications
// apps/web-client/public/sw.js
self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};
    const title = data.title || 'Adzan';
    const options = {
        body: data.body,
        icon: '/icon-512x512.png',
        badge: '/badge-72x72.png',
        sound: '/adzan-notification.mp3',
        tag: `adzan-${data.prayer}`,
        requireInteraction: true,
        actions: [
            { action: 'open', title: 'Buka Aplikasi' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// apps/web-admin/lib/notification-worker.ts - Improvement
export async function sendPushNotification(
    mosqueKey: string,
    prayerName: string,
    subscribers: string[] // Web push subscriptions
) {
    try {
        const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
        const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
        
        if (!vapidPublicKey || !vapidPrivateKey) {
            console.warn('[Notification] VAPID keys not configured');
            return;
        }
        
        for (const subscription of subscribers) {
            try {
                const payload = JSON.stringify({
                    title: `Adzan ${prayerName}`,
                    body: `Waktu sholat ${prayerName} telah tiba`,
                    prayer: prayerName,
                    timestamp: new Date().toISOString()
                });
                
                // Send using web-push library
                // const webpush = require('web-push');
                // await webpush.sendNotification(subscription, payload);
                
            } catch (error) {
                console.error(`Failed to send notification to ${subscription}:`, error);
            }
        }
    } catch (error) {
        logger.error('Push notification failed', { mosqueKey, prayerName, error });
    }
}
```

#### B. **Smart Device Integration (MQTT)**

```typescript
// apps/web-admin/lib/smart-device-controller.ts - NEW FILE
import mqtt from 'mqtt';

interface SmartDevice {
    id: string;
    type: 'lamp' | 'speaker' | 'display' | 'door-lock';
    topic: string;
    mosqueKey: string;
}

class SmartDeviceController {
    private client: mqtt.MqttClient | null = null;
    private devices: Map<string, SmartDevice> = new Map();
    
    constructor() {
        this.connect();
    }
    
    private connect() {
        const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
        
        this.client = mqtt.connect(brokerUrl, {
            username: process.env.MQTT_USER,
            password: process.env.MQTT_PASSWORD,
            reconnectPeriod: 10000,
        });
        
        this.client.on('connect', () => {
            console.log('[MQTT] Connected to broker');
        });
        
        this.client.on('error', (error) => {
            console.error('[MQTT] Connection error:', error);
        });
    }
    
    // Send command to turn on mosque lights during Adzan
    async turnOnLights(mosqueKey: string) {
        const devices = Array.from(this.devices.values())
            .filter(d => d.mosqueKey === mosqueKey && d.type === 'lamp');
        
        for (const device of devices) {
            this.client?.publish(device.topic, JSON.stringify({
                action: 'on',
                brightness: 100,
                color: '#FFFFFF'
            }));
        }
    }
    
    // Play Adzan audio through mosque speakers
    async playAdzan(mosqueKey: string, audioUrl: string) {
        const devices = Array.from(this.devices.values())
            .filter(d => d.mosqueKey === mosqueKey && d.type === 'speaker');
        
        for (const device of devices) {
            this.client?.publish(device.topic, JSON.stringify({
                action: 'play',
                url: audioUrl,
                volume: 85
            }));
        }
    }
    
    registerDevice(device: SmartDevice) {
        this.devices.set(device.id, device);
    }
}

export const smartDeviceController = new SmartDeviceController();
```

#### C. **Real-time Analytics Dashboard**

```typescript
// apps/web-admin/app/components/AnalyticsDashboard.tsx - NEW COMPONENT
'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
    date: string;
    visitors: number;
    prayers_completed: number;
    donations: number;
}

export function AnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/analytics?period=week');
                const json = await res.json();
                setData(json.data);
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 60000); // Refresh every minute
        
        return () => clearInterval(interval);
    }, []);
    
    if (loading) return <div>Loading...</div>;
    
    return (
        <div className="w-full h-96 bg-white rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Statistik Mingguan</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="visitors" fill="#3b82f6" name="Pengunjung" />
                    <Bar dataKey="prayers_completed" fill="#10b981" name="Sholat Dilaksanakan" />
                    <Bar dataKey="donations" fill="#f59e0b" name="Donasi (×100k)" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
```

---

### 12. **Database Schema Optimization**

```sql
-- apps/web-admin/schema.sql - IMPROVEMENTS

-- Add indexes for faster queries
ALTER TABLE mosque_configs ADD INDEX idx_mosque_key (mosque_key);
ALTER TABLE users ADD INDEX idx_email (email);
ALTER TABLE audio_tracks ADD INDEX idx_playlist_id (playlist_id);

-- Add audit logging table
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mosque_key VARCHAR(100) NOT NULL,
    user_id VARCHAR(100),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mosque_key (mosque_key),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add activity tracking for prayer times
CREATE TABLE prayer_activity (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mosque_key VARCHAR(100) NOT NULL,
    prayer_name VARCHAR(20),
    date DATE,
    actual_adzan_time TIME,
    actual_iqamah_time TIME,
    participants_count INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mosque_key (mosque_key),
    INDEX idx_date (date),
    UNIQUE KEY unique_prayer (mosque_key, prayer_name, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 13. **Testing Strategy**

```typescript
// apps/web-client/app/lib/__tests__/prayer-times.test.ts
import { getPrayerTimes } from '../prayer-times';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';

describe('getPrayerTimes', () => {
    const mockConfig: MosqueConfig = {
        mosqueInfo: { name: 'Test Mosque', address: 'Test Address' },
        display: { theme: 'dark', showSeconds: true, showHijriDate: true },
        prayerTimes: {
            calculationMethod: 'Kemenag',
            coordinates: { lat: -6.2088, lng: 106.8456 }, // Jakarta
            adjustments: { subuh: 2, dzuhur: 2, jumat: 2, ashar: 2, maghrib: 2, isya: 2 }
        },
        // ... other required fields
    };
    
    it('should calculate prayer times correctly', () => {
        const testDate = new Date('2024-04-10'); // Wednesday
        const times = getPrayerTimes(mockConfig, testDate);
        
        expect(times).toBeDefined();
        expect(times?.subuh).toBeDefined();
        expect(times?.dzuhur).toBeDefined();
        expect(times?.ashar).toBeDefined();
    });
    
    it('should handle Friday (Jumat) correctly', () => {
        const fridayDate = new Date('2024-04-12'); // Friday
        const times = getPrayerTimes(mockConfig, fridayDate);
        
        expect(times?.jumat).toBeDefined();
        expect(times?.dzuhur).toBeUndefined();
    });
    
    it('should return null for invalid coordinates', () => {
        const invalidConfig = { ...mockConfig, prayerTimes: { ...mockConfig.prayerTimes, coordinates: { lat: 200, lng: 200 } } };
        const times = getPrayerTimes(invalidConfig);
        
        expect(times).toBeNull();
    });
});
```

---

## 📊 Action Items Priority Matrix

| Priority | Issue | Effort | Impact | Timeline |
|----------|-------|--------|--------|----------|
| 🔴 CRITICAL | Plain text passwords | 2h | CRITICAL | Immediate |
| 🔴 CRITICAL | Input validation | 4h | CRITICAL | Immediate |
| 🔴 CRITICAL | Database credentials exposure | 1h | CRITICAL | Immediate |
| 🟡 HIGH | Rate limiting | 3h | HIGH | Week 1 |
| 🟡 HIGH | Error handling | 5h | HIGH | Week 1 |
| 🟠 MEDIUM | Config caching | 3h | MEDIUM | Week 2 |
| 🟠 MEDIUM | Memory leaks | 2h | MEDIUM | Week 2 |
| 🟠 MEDIUM | UI/UX improvements | 8h | MEDIUM | Week 2-3 |
| 🟢 LOW | Push notifications | 6h | HIGH | Week 3 |
| 🟢 LOW | Smart device integration | 8h | MEDIUM | Week 4 |

---

## ✅ Summary & Recommendations

### What's Working Well ✨
✅ Modern tech stack (Next.js 14+, TypeScript, Tailwind)  
✅ Multi-mosque architecture with flexible configuration  
✅ Comprehensive prayer time calculations (using Adhan library)  
✅ Beautiful, responsive UI design  
✅ Wabot integration for WhatsApp notifications  
✅ Live streaming integration (newly added)

### Critical Fixes Needed 🔧
1. **Password Security** → Implement bcrypt hashing
2. **Input Validation** → Use Zod for all API inputs
3. **Environment Secrets** → Move all credentials to env variables
4. **Rate Limiting** → Add Redis-based rate limiting
5. **Error Handling** → Add try-catch with proper logging

### Quick Wins (< 1 day dev time)
- [ ] Add bcrypt to auth endpoints
- [ ] Move hardcoded credentials to `.env`
- [ ] Add basic input validation with Zod
- [ ] Implement error boundary component
- [ ] Add loading spinners to async operations

### Next Phase (Week 2-3)
- [ ] Implement config caching strategy
- [ ] Add push notification system
- [ ] Improve test coverage
- [ ] Add analytics dashboard
- [ ] Implement audit logging

---

## Document Control

- **Version:** 1.0
- **Last Updated:** April 8, 2026
- **Next Review:** After implementing CRITICAL fixes
- **Owner:** Security & Architecture Team

