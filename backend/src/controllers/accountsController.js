const { pool } = require('../config/database');

const PLATFORM_INFO = {
  twitter: { label: 'Twitter / X', color: '#1DA1F2' },
  instagram: { label: 'Instagram', color: '#E1306C' },
  facebook: { label: 'Facebook', color: '#1877F2' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2' },
  tiktok: { label: 'TikTok', color: '#000000' },
  youtube: { label: 'YouTube', color: '#FF0000' },
};

exports.getAccounts = async (req, res) => {
  try {
    const [accounts] = await pool.query(
      'SELECT id, platform, account_name, account_handle, avatar_url, followers_count, is_active, connected_at FROM social_accounts WHERE user_id = ? ORDER BY connected_at DESC',
      [req.user.id]
    );
    res.json({ accounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.connectAccount = async (req, res) => {
  const { platform, account_name, account_handle, followers_count, avatar_url } = req.body;
  if (!PLATFORM_INFO[platform]) return res.status(400).json({ error: 'Unsupported platform' });
  if (!account_name) return res.status(400).json({ error: 'account_name is required' });

  try {
    const fakeAccountId = `${platform}_${Date.now()}`;
    const [result] = await pool.query(
      `INSERT INTO social_accounts (user_id, platform, account_name, account_handle, account_id, avatar_url, followers_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, platform, account_name.trim(), account_handle?.trim() || null, fakeAccountId, avatar_url || null, followers_count || 0]
    );
    const [rows] = await pool.query('SELECT * FROM social_accounts WHERE id = ?', [result.insertId]);
    res.status(201).json({ account: rows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Account already connected' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.disconnectAccount = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT id FROM social_accounts WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Account not found' });
    await pool.query('DELETE FROM social_accounts WHERE id = ?', [id]);
    res.json({ message: 'Account disconnected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.toggleAccount = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT id, is_active FROM social_accounts WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Account not found' });
    const newState = !rows[0].is_active;
    await pool.query('UPDATE social_accounts SET is_active = ? WHERE id = ?', [newState, id]);
    res.json({ is_active: newState });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateFollowers = async (req, res) => {
  const { id } = req.params;
  const { followers_count } = req.body;
  try {
    await pool.query(
      'UPDATE social_accounts SET followers_count = ? WHERE id = ? AND user_id = ?',
      [followers_count, id, req.user.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
