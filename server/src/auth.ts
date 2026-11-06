import { createHash, randomBytes, randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

import { query } from "./db.js";
import { loadSettings } from "./settings.js";

export interface AuthUser {
    id: string;
    email: string;
    displayName: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
            sessionToken?: string;
        }
    }
}

function hashToken(token: string): string {
    const secret = loadSettings().sessionSecret;
    return createHash("sha256").update(`${secret}:${token}`).digest("hex");
}

export async function createUser(
    email: string,
    password: string,
    displayName: string
): Promise<AuthUser> {
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    await query(
        `INSERT INTO users (id, email, password_hash, display_name)
         VALUES ($1, $2, $3, $4)`,
        [id, email.toLowerCase(), passwordHash, displayName]
    );
    return { id, email: email.toLowerCase(), displayName };
}

export async function setUserPassword(userId: string, password: string): Promise<void> {
    const passwordHash = await bcrypt.hash(password, 10);
    await query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [userId, passwordHash]);
}

export async function setUserDisplayName(userId: string, displayName: string): Promise<void> {
    await query(`UPDATE users SET display_name = $2 WHERE id = $1`, [userId, displayName]);
}

export async function authenticate(
    login: string,
    password: string
): Promise<AuthUser | null> {
    const identifier = login.trim();
    if (!identifier) return null;

    const byEmail = await query<{
        id: string;
        email: string;
        password_hash: string;
        display_name: string;
    }>("SELECT id, email, password_hash, display_name FROM users WHERE email = $1", [
        identifier.toLowerCase(),
    ]);
    let row = byEmail.rows[0];

    if (!row) {
        const byName = await query<{
            id: string;
            email: string;
            password_hash: string;
            display_name: string;
        }>(
            `SELECT id, email, password_hash, display_name
             FROM users
             WHERE lower(display_name) = lower($1)
             ORDER BY created_at ASC
             LIMIT 2`,
            [identifier]
        );
        if (byName.rows.length === 1) {
            row = byName.rows[0];
        } else if (byName.rows.length > 1) {
            return null;
        }
    }

    if (!row) return null;
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return null;
    return { id: row.id, email: row.email, displayName: row.display_name };
}

export async function createSession(userId: string): Promise<string> {
    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await query(
        `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
        [tokenHash, userId, expiresAt.toISOString()]
    );
    return token;
}

export async function resolveSession(token: string | undefined): Promise<AuthUser | null> {
    if (!token) return null;
    const tokenHash = hashToken(token);
    const result = await query<{
        id: string;
        email: string;
        display_name: string;
    }>(
        `SELECT u.id, u.email, u.display_name
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token = $1 AND s.expires_at > NOW()`,
        [tokenHash]
    );
    const row = result.rows[0];
    if (!row) return null;
    return { id: row.id, email: row.email, displayName: row.display_name };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.header("authorization") ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    const token = match?.[1];
    const user = await resolveSession(token);
    if (!user) {
        res.status(401).json({ error: "Não autenticado." });
        return;
    }
    req.user = user;
    req.sessionToken = token;
    next();
}
