const router = require('express').Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/posts-over-time', analyticsController.getPostsOverTime);
router.get('/platforms', analyticsController.getPlatformStats);
router.get('/engagement', analyticsController.getEngagementStats);

module.exports = router;
