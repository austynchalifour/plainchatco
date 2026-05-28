const { pool } = require('../config/database');

exports.getPosts = async (req, res) => {
  const { status, platform, from, to, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let where = ['p.user_id = ?'];
    let params = [req.user.id];

    if (status) { where.push('p.status = ?'); params.push(status); }
    if (from) { where.push('p.scheduled_at >= ?'); params.push(from); }
    if (to) { where.push('p.scheduled_at <= ?'); params.push(to); }

    const whereClause = where.join(' AND ');

    let query = `
      SELECT p.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', pa.id,
            'social_account_id', pa.social_account_id,
            'status', pa.status,
            'platform', sa.platform,
            'account_name', sa.account_name,
            'published_at', pa.published_at
          )
        ) as post_accounts
      FROM posts p
      LEFT JOIN post_accounts pa ON pa.post_id = p.id
      LEFT JOIN social_accounts sa ON sa.id = pa.social_account_id
      WHERE ${whereClause}
      GROUP BY p.id
      ORDER BY COALESCE(p.scheduled_at, p.created_at) DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);

    const [posts] = await pool.query(query, params);
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT p.id) as total FROM posts p WHERE ${whereClause}`,
      params.slice(0, params.length - 2)
    );

    const formatted = posts.map((p) => ({
      ...p,
      media_urls: p.media_urls ? JSON.parse(p.media_urls) : [],
      hashtags: p.hashtags ? JSON.parse(p.hashtags) : [],
      post_accounts: p.post_accounts ? JSON.parse(p.post_accounts).filter((pa) => pa.id !== null) : [],
    }));

    res.json({ posts: formatted, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPost = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', pa.id,
            'social_account_id', pa.social_account_id,
            'status', pa.status,
            'platform', sa.platform,
            'account_name', sa.account_name,
            'account_handle', sa.account_handle,
            'published_at', pa.published_at,
            'error_message', pa.error_message
          )
        ) as post_accounts
      FROM posts p
      LEFT JOIN post_accounts pa ON pa.post_id = p.id
      LEFT JOIN social_accounts sa ON sa.id = pa.social_account_id
      WHERE p.id = ? AND p.user_id = ?
      GROUP BY p.id`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Post not found' });
    const p = rows[0];
    res.json({
      post: {
        ...p,
        media_urls: p.media_urls ? JSON.parse(p.media_urls) : [],
        hashtags: p.hashtags ? JSON.parse(p.hashtags) : [],
        post_accounts: p.post_accounts ? JSON.parse(p.post_accounts).filter((pa) => pa.id !== null) : [],
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createPost = async (req, res) => {
  const { content, account_ids, scheduled_at, status = 'draft', hashtags } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

  const mediaUrls = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

  try {
    const postStatus = scheduled_at ? 'scheduled' : status;
    const [result] = await pool.query(
      'INSERT INTO posts (user_id, content, media_urls, hashtags, status, scheduled_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        content.trim(),
        mediaUrls.length ? JSON.stringify(mediaUrls) : null,
        hashtags?.length ? JSON.stringify(hashtags) : null,
        postStatus,
        scheduled_at || null,
      ]
    );
    const postId = result.insertId;

    if (account_ids?.length) {
      const accountRows = account_ids.map((aid) => [postId, aid]);
      await pool.query('INSERT INTO post_accounts (post_id, social_account_id) VALUES ?', [accountRows]);
    }

    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [postId]);
    res.status(201).json({ post: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updatePost = async (req, res) => {
  const { content, account_ids, scheduled_at, status, hashtags } = req.body;
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Post not found' });
    if (rows[0].status === 'published') return res.status(400).json({ error: 'Cannot edit a published post' });

    const updates = [];
    const values = [];
    if (content !== undefined) { updates.push('content = ?'); values.push(content.trim()); }
    if (scheduled_at !== undefined) { updates.push('scheduled_at = ?'); values.push(scheduled_at || null); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (hashtags !== undefined) { updates.push('hashtags = ?'); values.push(JSON.stringify(hashtags)); }
    if (req.files?.length) { updates.push('media_urls = ?'); values.push(JSON.stringify(req.files.map((f) => `/uploads/${f.filename}`))); }

    if (updates.length) {
      values.push(id);
      await pool.query(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    if (account_ids !== undefined) {
      await pool.query('DELETE FROM post_accounts WHERE post_id = ?', [id]);
      if (account_ids.length) {
        await pool.query('INSERT INTO post_accounts (post_id, social_account_id) VALUES ?', [account_ids.map((aid) => [id, aid])]);
      }
    }

    const [updated] = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
    res.json({ post: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id FROM posts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Post not found' });
    await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.duplicatePost = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Post not found' });
    const original = rows[0];
    const [result] = await pool.query(
      'INSERT INTO posts (user_id, content, media_urls, hashtags, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, original.content, original.media_urls, original.hashtags, 'draft']
    );
    const [newPost] = await pool.query('SELECT * FROM posts WHERE id = ?', [result.insertId]);
    res.status(201).json({ post: newPost[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getCalendarPosts = async (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) return res.status(400).json({ error: 'year and month are required' });

  const start = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;
  const endDate = new Date(parseInt(year), parseInt(month), 0);
  const end = `${year}-${String(month).padStart(2, '0')}-${endDate.getDate()} 23:59:59`;

  try {
    const [posts] = await pool.query(
      `SELECT p.id, p.content, p.status, p.scheduled_at, p.media_urls,
        GROUP_CONCAT(sa.platform) as platforms
       FROM posts p
       LEFT JOIN post_accounts pa ON pa.post_id = p.id
       LEFT JOIN social_accounts sa ON sa.id = pa.social_account_id
       WHERE p.user_id = ? AND p.scheduled_at BETWEEN ? AND ?
       GROUP BY p.id
       ORDER BY p.scheduled_at ASC`,
      [req.user.id, start, end]
    );
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.publishNow = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Post not found' });

    const now = new Date();
    await pool.query(
      'UPDATE posts SET status = ?, published_at = ?, scheduled_at = NULL WHERE id = ?',
      ['published', now, id]
    );
    await pool.query(
      'UPDATE post_accounts SET status = ?, published_at = ? WHERE post_id = ?',
      ['published', now, id]
    );
    res.json({ message: 'Post published successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
