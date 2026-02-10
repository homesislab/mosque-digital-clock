CREATE DATABASE IF NOT EXISTS `mosque-digitaldb`;

USE `mosque-digitaldb`;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mosque_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    mosque_key VARCHAR(255) UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

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
INSERT IGNORE INTO
    users (id, email, password_hash)
VALUES (
        'admin-id',
        'admin@mosque.id',
        'admin123'
    );

INSERT IGNORE INTO
    mosque_keys (user_id, mosque_key)
VALUES ('admin-id', 'default');