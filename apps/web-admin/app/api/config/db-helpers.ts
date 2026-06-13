import pool from '../../../lib/db';
import { MosqueConfig } from '@mosque-digital-clock/shared-types';

export async function hydrateConfigWithNormalizedData(key: string, baseConfig: MosqueConfig): Promise<MosqueConfig> {
    try {
        const config = { ...baseConfig };
        
        // Fetch running text
        const [rtRows]: any = await pool.query(
            'SELECT text FROM running_text_items WHERE mosque_key = ? AND is_active = 1 ORDER BY position ASC',
            [key]
        );
        if (rtRows.length > 0) {
            config.runningText = rtRows.map((r: any) => r.text);
        }

        // Fetch slider images
        const [sliderRows]: any = await pool.query(
            'SELECT image_url FROM slider_images WHERE mosque_key = ? AND is_active = 1 ORDER BY position ASC',
            [key]
        );
        if (sliderRows.length > 0) {
            config.sliderImages = sliderRows.map((r: any) => r.image_url);
        }

        // Fetch gallery images
        const [galleryRows]: any = await pool.query(
            'SELECT image_url FROM gallery_images WHERE mosque_key = ? AND is_active = 1 ORDER BY position ASC',
            [key]
        );
        if (galleryRows.length > 0) {
            config.gallery = galleryRows.map((r: any) => r.image_url);
        }

        // Fetch finance accounts
        const [financeRows]: any = await pool.query(
            'SELECT name, balance, income, expense FROM finance_accounts WHERE mosque_key = ? AND is_active = 1 ORDER BY id ASC',
            [key]
        );
        if (financeRows.length > 0) {
            config.finance = config.finance || { accounts: [], totalBalance: 0, lastUpdated: new Date().toISOString() };
            config.finance.accounts = financeRows.map((r: any) => ({
                name: r.name,
                balance: Number(r.balance),
                income: Number(r.income),
                expense: Number(r.expense)
            }));
            config.finance.totalBalance = config.finance.accounts.reduce((acc: number, val: any) => acc + val.balance, 0);
        }

        return config;
    } catch (error) {
        console.error('Error hydrating config for ' + key, error);
        return baseConfig;
    }
}

export async function persistNormalizedData(key: string, config: MosqueConfig, connection: any) {
    // Finance accounts
    await connection.query('DELETE FROM finance_accounts WHERE mosque_key = ?', [key]);
    if (config.finance && config.finance.accounts && config.finance.accounts.length > 0) {
        for (const account of config.finance.accounts) {
            await connection.query(
                'INSERT INTO finance_accounts (mosque_key, name, balance, income, expense) VALUES (?, ?, ?, ?, ?)',
                [key, account.name, account.balance || 0, account.income || 0, account.expense || 0]
            );
        }
    }

    // Running text
    await connection.query('DELETE FROM running_text_items WHERE mosque_key = ?', [key]);
    if (config.runningText && config.runningText.length > 0) {
        let pos = 0;
        for (const txt of config.runningText) {
            if (!txt) continue;
            await connection.query(
                'INSERT INTO running_text_items (mosque_key, position, text) VALUES (?, ?, ?)',
                [key, pos++, txt]
            );
        }
    }

    // Slider images
    await connection.query('DELETE FROM slider_images WHERE mosque_key = ?', [key]);
    if (config.sliderImages && config.sliderImages.length > 0) {
        let pos = 0;
        for (const img of config.sliderImages) {
            if (!img) continue;
            await connection.query(
                'INSERT INTO slider_images (mosque_key, position, image_url) VALUES (?, ?, ?)',
                [key, pos++, img]
            );
        }
    }

    // Gallery images
    await connection.query('DELETE FROM gallery_images WHERE mosque_key = ?', [key]);
    if (config.gallery && config.gallery.length > 0) {
        let pos = 0;
        for (const img of config.gallery) {
            if (!img) continue;
            await connection.query(
                'INSERT INTO gallery_images (mosque_key, position, image_url) VALUES (?, ?, ?)',
                [key, pos++, img]
            );
        }
    }
}
