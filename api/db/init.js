const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

// Default admin credentials from environment variables
const DEFAULT_ADMIN = {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: process.env.ADMIN_ROLE || 'admin'
};

// Database schema version
const SCHEMA_VERSION = 1;

// Create and initialize the database
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const dbPath = path.join(__dirname, '../../', process.env.DB_PATH || 'data/imagencali.db');
        const db = new sqlite3.Database(dbPath, async (err) => {
            if (err) {
                console.error('Database connection error:', err);
                reject(err);
                return;
            }

            try {
                await runMigrations(db);
                await createAdminUser(db);
                console.log('Database initialization completed successfully');
                resolve(db);
            } catch (error) {
                console.error('Database initialization failed:', error);
                reject(error);
            }
        });
    });
}

// Run database migrations
function runMigrations(db) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create schema_version table
            db.run(`
                CREATE TABLE IF NOT EXISTS schema_version (
                    version INTEGER PRIMARY KEY,
                    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `).run(`
                INSERT OR IGNORE INTO schema_version (version) VALUES (0)
            `);

            // Get current schema version
            db.get('SELECT version FROM schema_version LIMIT 1', [], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                const currentVersion = row ? row.version : 0;
                if (currentVersion < SCHEMA_VERSION) {
                    console.log(`Upgrading database from version ${currentVersion} to ${SCHEMA_VERSION}`);
                    runUpgrades(db, currentVersion, SCHEMA_VERSION)
                        .then(resolve)
                        .catch(reject);
                } else {
                    resolve();
                }
            });
        });
    });
}

// Run database upgrades
function runUpgrades(db, currentVersion, targetVersion) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Enable foreign keys
            db.run('PRAGMA foreign_keys = ON');

            // Create users table with better structure
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user',
                    status TEXT NOT NULL DEFAULT 'active',
                    last_login DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create refresh_tokens table
            db.run(`
                CREATE TABLE IF NOT EXISTS refresh_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    token TEXT NOT NULL,
                    expires_at DATETIME NOT NULL,
                    revoked BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);

            // Create login_attempts table for rate limiting
            db.run(`
                CREATE TABLE IF NOT EXISTS login_attempts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ip_address TEXT,
                    success BOOLEAN DEFAULT 0
                )
            `);

            // Create audit_log table
            db.run(`
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    action TEXT NOT NULL,
                    details TEXT,
                    ip_address TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                )
            `);

            // Create indexes for better performance
            db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
            db.run('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_token ON refresh_tokens(user_id, token)');
            db.run('CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON login_attempts(email, attempt_time)');
            db.run('CREATE INDEX IF NOT EXISTS idx_audit_log_user_action ON audit_log(user_id, action)');

            // Update schema version
            db.run('UPDATE schema_version SET version = ?', [targetVersion], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    });
}

// Create admin user if it doesn't exist
function createAdminUser(db) {
    return new Promise((resolve, reject) => {
        if (!DEFAULT_ADMIN.email || !DEFAULT_ADMIN.password) {
            console.warn('Admin credentials not properly configured in environment variables');
            resolve();
            return;
        }

        db.get('SELECT * FROM users WHERE email = ?', [DEFAULT_ADMIN.email], async (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (!row) {
                try {
                    const hash = await bcrypt.hash(DEFAULT_ADMIN.password, 12);
                    db.run(
                        `INSERT INTO users (email, password, role, status) 
                         VALUES (?, ?, ?, 'active')`,
                        [DEFAULT_ADMIN.email, hash, DEFAULT_ADMIN.role],
                        (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                console.log('Default admin user created successfully');
                                resolve();
                            }
                        }
                    );
                } catch (error) {
                    reject(error);
                }
            } else {
                resolve();
            }
        });
    });
}

// Helper function to log audit events
function logAudit(db, userId, action, details, ipAddress) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO audit_log (user_id, action, details, ip_address) 
             VALUES (?, ?, ?, ?)`,
            [userId, action, JSON.stringify(details), ipAddress],
            (err) => {
                if (err) {
                    console.error('Error logging audit event:', err);
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

// Clean up old records periodically
function cleanupOldRecords(db) {
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
    
    setInterval(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        
        db.run('DELETE FROM login_attempts WHERE attempt_time < ?', [thirtyDaysAgo]);
        db.run('DELETE FROM refresh_tokens WHERE expires_at < ? OR revoked = 1', [now]);
        
        console.log('Cleaned up old records');
    }, CLEANUP_INTERVAL);
}

module.exports = {
    initializeDatabase,
    logAudit,
    cleanupOldRecords,
    DEFAULT_ADMIN  // Exported for testing purposes
};
