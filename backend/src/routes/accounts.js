const router = require('express').Router();
const accountsController = require('../controllers/accountsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', accountsController.getAccounts);
router.post('/connect', accountsController.connectAccount);
router.delete('/:id', accountsController.disconnectAccount);
router.patch('/:id/toggle', accountsController.toggleAccount);
router.patch('/:id/followers', accountsController.updateFollowers);

module.exports = router;
