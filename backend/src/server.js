const app = require('./app');
const cron = require('node-cron');
const { pool, testConnection } = require('./config/database');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

// Resolve uploads dir relative to repo root regardless of where server.js is called from
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const publishScheduledPosts = async () => {
  try {
    const [posts] = await pool.query(
      "SELECT id FROM posts WHERE status = 'scheduled' AND scheduled_at <= NOW()"
    );
    if (!posts.length) return;

    for (const post of posts) {
      const now = new Date();
      await pool.query(
        "UPDATE posts SET status = 'published', published_at = ? WHERE id = ?",
        [now, post.id]
      );
      await pool.query(
        "UPDATE post_accounts SET status = 'published', published_at = ? WHERE post_id = ? AND status = 'pending'",
        [now, post.id]
      );
      console.log(`📤 Published post #${post.id}`);
    }
  } catch (err) {
    console.error('Scheduler error:', err.message);
  }
};

const start = async () => {
  await testConnection();
  cron.schedule('* * * * *', publishScheduledPosts);
  console.log('⏰ Post scheduler running (checks every minute)');

  app.listen(PORT, () => {
    console.log(`🚀 PlainChat API running on http://localhost:${PORT}`);
  });
};

start();
