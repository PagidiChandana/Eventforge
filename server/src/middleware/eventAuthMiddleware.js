const { Event } = require('../models/Event');
const { ROLES } = require('../models/User');

const authorizeEventAccess = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const targetEventId = eventId || req.body.event || req.body.eventId;

    if (!targetEventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required for authorization validation.'
      });
    }

    const event = await Event.findById(targetEventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Target event does not exist.'
      });
    }

    // Platform Admin has global override permission
    if (req.user.role === ROLES.PLATFORM_ADMIN) {
      req.event = event;
      return next();
    }

    // Event Organizer must own the event
    if (
      req.user.role === ROLES.EVENT_ORGANIZER &&
      event.organizer.toString() === req.user.id.toString()
    ) {
      req.event = event;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access Denied: You do not have permission to manage this specific event.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { authorizeEventAccess };
