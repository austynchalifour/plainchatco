const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password } = req.body;
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase(), hash]
    );
    const userId = result.insertId;

    await pool.query('INSERT INTO user_settings (user_id) VALUES (?)', [userId]);

    const token = signToken(userId);
    const [users] = await pool.query('SELECT id, name, email, avatar_url, timezone, created_at FROM users WHERE id = ?', [userId]);
    res.status(201).json({ token, user: users[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user.id);
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

exports.updateProfile = async (req, res) => {
  const { name, timezone } = req.body;
  try {
    const updates = [];
    const values = [];
    if (name) { updates.push('name = ?'); values.push(name.trim()); }
    if (timezone) { updates.push('timezone = ?'); values.push(timezone); }
    if (req.file) { updates.push('avatar_url = ?'); values.push(`/uploads/${req.file.filename}`); }

    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

    values.push(req.user.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.query('SELECT id, name, email, avatar_url, timezone FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
    res.json({ settings: rows[0] || {} });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateSettings = async (req, res) => {
  const { email_notifications, post_reminders, weekly_report, default_timezone } = req.body;
  try {
    await pool.query(
      `INSERT INTO user_settings (user_id, email_notifications, post_reminders, weekly_report, default_timezone)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       email_notifications = VALUES(email_notifications),
       post_reminders = VALUES(post_reminders),
       weekly_report = VALUES(weekly_report),
       default_timezone = VALUES(default_timezone)`,
      [req.user.id, email_notifications ?? true, post_reminders ?? true, weekly_report ?? false, default_timezone || 'UTC']
    );
    res.json({ message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
