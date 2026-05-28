-- PlainChat Database Schema
CREATE DATABASE IF NOT EXISTS plainchat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE plainchat;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  platform ENUM('twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube') NOT NULL,
  account_name VARCHAR(150) NOT NULL,
  account_handle VARCHAR(150),
  account_id VARCHAR(150),
  access_token TEXT,
  refresh_token TEXT,
  avatar_url VARCHAR(500),
  followers_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_account (user_id, platform, account_id)
);

CREATE TABLE IF NOT EXISTS posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  media_urls JSON DEFAULT NULL,
  hashtags JSON DEFAULT NULL,
  status ENUM('draft', 'scheduled', 'published', 'failed') DEFAULT 'draft',
  scheduled_at TIMESTAMP NULL DEFAULT NULL,
  published_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  social_account_id INT NOT NULL,
  status ENUM('pending', 'published', 'failed') DEFAULT 'pending',
  platform_post_id VARCHAR(200) DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  published_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (social_account_id) REFERENCES social_accounts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_post_account (post_id, social_account_id)
);

CREATE TABLE IF NOT EXISTS post_analytics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_account_id INT NOT NULL,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  impressions INT DEFAULT 0,
  reach INT DEFAULT 0,
  clicks INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_account_id) REFERENCES post_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  post_reminders BOOLEAN DEFAULT TRUE,
  weekly_report BOOLEAN DEFAULT FALSE,
  default_timezone VARCHAR(50) DEFAULT 'UTC',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
