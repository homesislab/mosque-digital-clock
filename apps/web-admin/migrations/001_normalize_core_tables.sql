-- Migration: 001_normalize_core_tables
-- Purpose: introduce normalized tables for high-churn config sections while keeping mosque_configs.config_json as source of truth for backward compatibility.
--
-- Requires: MySQL 8.0+

-- Running text items
CREATE TABLE IF NOT EXISTS running_text_items (
	id BIGINT AUTO_INCREMENT PRIMARY KEY,
	mosque_key VARCHAR(255) NOT NULL,
	position INT NOT NULL,
	text TEXT NOT NULL,
	is_active TINYINT(1) NOT NULL DEFAULT 1,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_running_text_mosque_key
		FOREIGN KEY (mosque_key) REFERENCES mosque_configs (mosque_key) ON DELETE CASCADE,
	UNIQUE KEY uq_running_text_item (mosque_key, position)
);

-- Slider images
CREATE TABLE IF NOT EXISTS slider_images (
	id BIGINT AUTO_INCREMENT PRIMARY KEY,
	mosque_key VARCHAR(255) NOT NULL,
	position INT NOT NULL,
	image_url TEXT NOT NULL,
	is_active TINYINT(1) NOT NULL DEFAULT 1,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_slider_images_mosque_key
		FOREIGN KEY (mosque_key) REFERENCES mosque_configs (mosque_key) ON DELETE CASCADE,
	UNIQUE KEY uq_slider_image (mosque_key, position)
);

-- Gallery images
CREATE TABLE IF NOT EXISTS gallery_images (
	id BIGINT AUTO_INCREMENT PRIMARY KEY,
	mosque_key VARCHAR(255) NOT NULL,
	position INT NOT NULL,
	image_url TEXT NOT NULL,
	is_active TINYINT(1) NOT NULL DEFAULT 1,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_gallery_images_mosque_key
		FOREIGN KEY (mosque_key) REFERENCES mosque_configs (mosque_key) ON DELETE CASCADE,
	UNIQUE KEY uq_gallery_image (mosque_key, position)
);

-- Finance accounts (basic normalization; safe starting point)
CREATE TABLE IF NOT EXISTS finance_accounts (
	id BIGINT AUTO_INCREMENT PRIMARY KEY,
	mosque_key VARCHAR(255) NOT NULL,
	name VARCHAR(255) NOT NULL,
	balance DECIMAL(18,2) NOT NULL DEFAULT 0,
	income DECIMAL(18,2) NOT NULL DEFAULT 0,
	expense DECIMAL(18,2) NOT NULL DEFAULT 0,
	is_active TINYINT(1) NOT NULL DEFAULT 1,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_finance_accounts_mosque_key
		FOREIGN KEY (mosque_key) REFERENCES mosque_configs (mosque_key) ON DELETE CASCADE,
	UNIQUE KEY uq_finance_account_name (mosque_key, name)
);
