const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { PERMS, ADMIN, ORGANIZER } = require('../middleware/permissions');

router.use(requireAuth);

// Plans: view = Admin + Organizer; CRUD = Admin only
router.get('/plans', requireRole(...PERMS.SUBSCRIPTION_MANAGE), subscriptionController.listPlans);
router.post('/plans', requireAuth, requireRole(ADMIN), subscriptionController.createPlan);
router.put('/plans/:id', requireAuth, requireRole(ADMIN), subscriptionController.updatePlan);
router.delete('/plans/:id', requireAuth, requireRole(ADMIN), subscriptionController.deletePlan);

// Subscriptions: all + status = Admin; own + subscribe = Organizer
router.get('/', requireRole(ADMIN), subscriptionController.listSubscriptions);
router.get('/mine', requireRole(ORGANIZER), subscriptionController.getMySubscription);
router.post('/subscribe', requireRole(ORGANIZER), subscriptionController.subscribe);
router.patch('/:id/status', requireRole(ADMIN), subscriptionController.setSubscriptionStatus);

module.exports = router;
