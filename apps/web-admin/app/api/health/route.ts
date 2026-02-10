import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log('Health check started...');
    try {
        const connection = await pool.getConnection();
        console.log('Database connection successful');
        connection.release();
        return NextResponse.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json({
            status: 'error',
            database: 'disconnected',
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
