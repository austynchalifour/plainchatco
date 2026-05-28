const { pool } = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  const userId = req.user.id;
  try {
    const [[{ total_posts }]] = await pool.query('SELECT COUNT(*) as total_posts FROM posts WHERE user_id = ?', [userId]);
    const [[{ scheduled }]] = await pool.query("SELECT COUNT(*) as scheduled FROM posts WHERE user_id = ? AND status = 'scheduled'", [userId]);
    const [[{ published }]] = await pool.query("SELECT COUNT(*) as published FROM posts WHERE user_id = ? AND status = 'published'", [userId]);
    const [[{ drafts }]] = await pool.query("SELECT COUNT(*) as drafts FROM posts WHERE user_id = ? AND status = 'draft'", [userId]);
    const [[{ total_accounts }]] = await pool.query('SELECT COUNT(*) as total_accounts FROM social_accounts WHERE user_id = ? AND is_active = 1', [userId]);

    const [recentPosts] = await pool.query(
      `SELECT p.id, p.content, p.status, p.scheduled_at, p.published_at, p.created_at,
        GROUP_CONCAT(sa.platform ORDER BY sa.platform SEPARATOR ',') as platforms
       FROM posts p
       LEFT JOIN post_accounts pa ON pa.post_id = p.id
       LEFT JOIN social_accounts sa ON sa.id = pa.social_account_id
       WHERE p.user_id = ?
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT 5`,
      [userId]
    );

    const [upcomingPosts] = await pool.query(
      `SELECT p.id, p.content, p.status, p.scheduled_at,
        GROUP_CONCAT(sa.platform ORDER BY sa.platform SEPARATOR ',') as platforms
       FROM posts p
       LEFT JOIN post_accounts pa ON pa.post_id = p.id
       LEFT JOIN social_accounts sa ON sa.id = pa.social_account_id
       WHERE p.user_id = ? AND p.status = 'scheduled' AND p.scheduled_at > NOW()
       GROUP BY p.id
       ORDER BY p.scheduled_at ASC
       LIMIT 5`,
      [userId]
    );

    const [platformBreakdown] = await pool.query(
      `SELECT sa.platform, COUNT(pa.id) as post_count
       FROM post_accounts pa
       JOIN posts p ON p.id = pa.post_id
       JOIN social_accounts sa ON sa.id = pa.social_account_id
       WHERE p.user_id = ?
       GROUP BY sa.platform`,
      [userId]
    );

    const [weeklyActivity] = await pool.query(
      `SELECT DATE(COALESCE(published_at, created_at)) as date, COUNT(*) as count
       FROM posts
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(COALESCE(published_at, created_at))
       ORDER BY date ASC`,
      [userId]
    );

    res.json({
      stats: { total_posts, scheduled, published, drafts, total_accounts },
      recentPosts,
      upcomingPosts,
      platformBreakdown,
      weeklyActivity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPostsOverTime = async (req, res) => {
  const { days = 30 } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT DATE(created_at) as date, status, COUNT(*) as count
       FROM posts
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at), status
       ORDER BY date ASC`,
      [req.user.id, parseInt(days)]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPlatformStats = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT sa.platform,
        COUNT(pa.id) as total_posts,
        SUM(CASE WHEN pa.status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN pa.status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN pa.status = 'failed' THEN 1 ELSE 0 END) as failed
       FROM social_accounts sa
       LEFT JOIN post_accounts pa ON pa.social_account_id = sa.id
       WHERE sa.user_id = ?
       GROUP BY sa.id, sa.platform
       ORDER BY total_posts DESC`,
      [req.user.id]
    );
    res.json({ platforms: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getEngagementStats = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        SUM(pana.likes) as total_likes,
        SUM(pana.comments) as total_comments,
        SUM(pana.shares) as total_shares,
        SUM(pana.impressions) as total_impressions,
        SUM(pana.reach) as total_reach,
        SUM(pana.clicks) as total_clicks
       FROM post_analytics pana
       JOIN post_accounts pa ON pa.id = pana.post_account_id
       JOIN posts p ON p.id = pa.post_id
       WHERE p.user_id = ?`,
      [req.user.id]
    );
    res.json({ engagement: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
