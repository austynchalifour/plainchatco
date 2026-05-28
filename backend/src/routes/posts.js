const router = require('express').Router();
const postsController = require('../controllers/postsController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve(__dirname, '../../../uploads')),
  filename: (req, file, cb) => cb(null, `media_${Date.now()}_${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.use(authMiddleware);

router.get('/', postsController.getPosts);
router.get('/calendar', postsController.getCalendarPosts);
router.get('/:id', postsController.getPost);
router.post('/', upload.array('media', 10), postsController.createPost);
router.put('/:id', upload.array('media', 10), postsController.updatePost);
router.delete('/:id', postsController.deletePost);
router.post('/:id/duplicate', postsController.duplicatePost);
router.post('/:id/publish', postsController.publishNow);

module.exports = router;
