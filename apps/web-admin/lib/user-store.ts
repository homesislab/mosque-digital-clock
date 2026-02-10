import pool from './db';
import { databaseErrorsTotal } from './metrics';

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    mosqueKeys: string[];
}

export async function getUsers(): Promise<User[]> {
    try {
        const [rows]: any = await pool.query(`
            SELECT u.id, u.email, u.password_hash as passwordHash, 
                   GROUP_CONCAT(mk.mosque_key) as mosqueKeys
            FROM users u
            LEFT JOIN mosque_keys mk ON u.id = mk.user_id
            GROUP BY u.id
        `);
        return rows.map((row: any) => ({
            ...row,
            mosqueKeys: row.mosqueKeys ? row.mosqueKeys.split(',') : []
        }));
    } catch (error) {
        console.error('Error in getUsers:', error);
        databaseErrorsTotal.inc({ operation: 'getUsers' });
        throw error;
    }
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
    try {
        const [rows]: any = await pool.query(`
            SELECT u.id, u.email, u.password_hash as passwordHash, 
                   GROUP_CONCAT(mk.mosque_key) as mosqueKeys
            FROM users u
            LEFT JOIN mosque_keys mk ON u.id = mk.user_id
            WHERE u.email = ?
            GROUP BY u.id
        `, [email]);
        if (rows.length === 0) return undefined;
        return {
            ...rows[0],
            mosqueKeys: rows[0].mosqueKeys ? rows[0].mosqueKeys.split(',') : []
        };
    } catch (error) {
        console.error(`Error in findUserByEmail for ${email}:`, error);
        databaseErrorsTotal.inc({ operation: 'findUserByEmail' });
        throw error;
    }
}

export async function findUserById(id: string): Promise<User | undefined> {
    try {
        const [rows]: any = await pool.query(`
            SELECT u.id, u.email, u.password_hash as passwordHash, 
                   GROUP_CONCAT(mk.mosque_key) as mosqueKeys
            FROM users u
            LEFT JOIN mosque_keys mk ON u.id = mk.user_id
            WHERE u.id = ?
            GROUP BY u.id
        `, [id]);
        if (rows.length === 0) return undefined;
        return {
            ...rows[0],
            mosqueKeys: rows[0].mosqueKeys ? rows[0].mosqueKeys.split(',') : []
        };
    } catch (error) {
        console.error(`Error in findUserById for ${id}:`, error);
        databaseErrorsTotal.inc({ operation: 'findUserById' });
        throw error;
    }
}

export async function addUser(user: User) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(
            'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
            [user.id, user.email, user.passwordHash]
        );
        for (const key of user.mosqueKeys) {
            await connection.query(
                'INSERT INTO mosque_keys (user_id, mosque_key) VALUES (?, ?)',
                [user.id, key]
            );
        }
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        databaseErrorsTotal.inc({ operation: 'addUser' });
        throw error;
    } finally {
        connection.release();
    }
}
