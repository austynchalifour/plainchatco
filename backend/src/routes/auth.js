const router = require('express').Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `avatar_${req.user?.id}_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], authController.register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
], authController.login);

router.get('/me', authMiddleware, authController.me);
router.put('/profile', authMiddleware, upload.single('avatar'), authController.updateProfile);
router.put('/password', authMiddleware, authController.changePassword);
router.get('/settings', authMiddleware, authController.getSettings);
router.put('/settings', authMiddleware, authController.updateSettings);

module.exports = router;
