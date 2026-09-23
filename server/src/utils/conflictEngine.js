const Session = require('../models/Session');

const checkSessionConflicts = async ({ eventId, roomName, speakers = [], startTime, endTime, excludeSessionId = null }) => {
  const newStart = new Date(startTime);
  const newEnd = new Date(endTime);

  if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
    const err = new Error('Choose a valid session start and end date/time.');
    err.statusCode = 400;
    throw err;
  }

  if (newStart >= newEnd) {
    const err = new Error('Session start time must be before end time.');
    err.statusCode = 400;
    throw err;
  }
  if (!roomName || !roomName.trim()) {
    const err = new Error('Session room is required.');
    err.statusCode = 400;
    throw err;
  }

  // 1. Room Conflict Query: Same event + same room + overlapping time range
  const roomQuery = {
    event: eventId,
    roomName: roomName.trim(),
    $or: [
      { startTime: { $lt: newEnd }, endTime: { $gt: newStart } }
    ]
  };

  if (excludeSessionId) {
    roomQuery._id = { $ne: excludeSessionId };
  }

  const roomConflict = await Session.findOne(roomQuery);
  if (roomConflict) {
    return {
      hasConflict: true,
      type: 'ROOM_OVERLAP',
      message: `Room Conflict: Room '${roomName}' is already booked by session '${roomConflict.title}' during this time window (${new Date(roomConflict.startTime).toLocaleTimeString()} - ${new Date(roomConflict.endTime).toLocaleTimeString()}).`
    };
  }

  // 2. Speaker Conflict Query: Same speaker booked in any overlapping session at the same time
  if (speakers && speakers.length > 0) {
    const speakerQuery = {
      speakers: { $in: speakers },
      $or: [
        { startTime: { $lt: newEnd }, endTime: { $gt: newStart } }
      ]
    };

    if (excludeSessionId) {
      speakerQuery._id = { $ne: excludeSessionId };
    }

    const speakerConflict = await Session.findOne(speakerQuery).populate('speakers', 'name');
    if (speakerConflict) {
      const conflictedSpeaker = speakerConflict.speakers.find(s => speakers.includes(s._id.toString()));
      const speakerName = conflictedSpeaker ? conflictedSpeaker.name : 'One of the speakers';
      return {
        hasConflict: true,
        type: 'SPEAKER_OVERLAP',
        message: `Speaker Conflict: ${speakerName} is already assigned to session '${speakerConflict.title}' at another location/room during this time window.`
      };
    }
  }

  return { hasConflict: false };
};

module.exports = { checkSessionConflicts };
