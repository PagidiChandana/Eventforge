const Task = require('../models/Task');
const Event = require('../models/Event');
const StaffAssignment = require('../models/StaffAssignment');

// Get tasks for a specific user (staff) across all events they are assigned to
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('event', 'name startDate endDate')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, assignedTo: req.user.id },
      { status },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found or not assigned to you' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};
