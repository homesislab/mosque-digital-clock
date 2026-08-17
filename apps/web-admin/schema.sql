CREATE DATABASE IF NOT EXISTS `mosque-digitaldb`;

USE `mosque-digitaldb`;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    google_name VARCHAR(255),
    google_picture VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mosque_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    mosque_key VARCHAR(255) UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    token_hash CHAR(64) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    idle_expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_sessions_token_hash (token_hash),
    KEY idx_admin_sessions_user_id (user_id),
    KEY idx_admin_sessions_expiry (expires_at, idle_expires_at, revoked_at),
    CONSTRAINT fk_admin_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mosque_configs (
    mosque_key VARCHAR(255) PRIMARY KEY,
    config_json LONGTEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
    device_id VARCHAR(255) PRIMARY KEY,
    mosque_key VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mosque_key) REFERENCES mosque_configs (mosque_key) ON DELETE CASCADE
);

-- Initial Admin Data
-- password: admin123 (bcrypt, 12 rounds) — change on first login
INSERT IGNORE INTO
    users (id, email, password_hash)
VALUES (
        'admin-id',
        'admin@mosque.id',
        '$2b$12$cWUZ.2/xarKJbcmIOUpcXuNBWaa4ea1LU3nOn1OD9xslODOHxaKv.'
    );

INSERT IGNORE INTO
    mosque_keys (user_id, mosque_key)
VALUES ('admin-id', 'default');

CREATE TABLE IF NOT EXISTS running_text_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mosque_key VARCHAR(255) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    text TEXT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rt_mosque_key (mosque_key),
    FOREIGN KEY (mosque_key) REFERENCES mosque_configs(mosque_key) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS slider_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mosque_key VARCHAR(255) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    image_url VARCHAR(1024) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_si_mosque_key (mosque_key),
    FOREIGN KEY (mosque_key) REFERENCES mosque_configs(mosque_key) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS gallery_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mosque_key VARCHAR(255) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    image_url VARCHAR(1024) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_gi_mosque_key (mosque_key),
    FOREIGN KEY (mosque_key) REFERENCES mosque_configs(mosque_key) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS finance_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mosque_key VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    income DECIMAL(15,2) NOT NULL DEFAULT 0,
    expense DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fa_mosque_key (mosque_key),
    FOREIGN KEY (mosque_key) REFERENCES mosque_configs(mosque_key) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;