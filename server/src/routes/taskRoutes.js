const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.use(requireAuth);

// Staff/Organizer/Admin can view and update their own tasks
router.get('/my-tasks', requireRole('Event Staff', 'Event Organizer', 'Platform Admin'), taskController.getMyTasks);
router.patch('/:id/status', requireRole('Event Staff', 'Event Organizer', 'Platform Admin'), taskController.updateTaskStatus);

module.exports = router;
