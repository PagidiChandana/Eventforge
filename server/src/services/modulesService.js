const Speaker = require('../models/Speaker');
const Session = require('../models/Session');
const PresentationMaterial = require('../models/PresentationMaterial');
const Sponsor = require('../models/Sponsor');
const { Deliverable } = require('../models/Deliverable');
const BrandAsset = require('../models/BrandAsset');
const { User, ROLES } = require('../models/User');
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');

class ModulesService {
  // ================= SPEAKER MODULE =================
  async getSpeakerProfile(userId) {
    let speaker = await Speaker.findOne({ user: userId });
    const user = await require('../models/User').User.findById(userId);

    if (!speaker && user) {
      // Look for a speaker profile created by an organizer matching this user's email that hasn't been claimed yet
      speaker = await Speaker.findOne({ 
        contactEmail: { $regex: new RegExp(`^${user.email}$`, 'i') },
        $or: [{ user: null }, { user: { $exists: false } }]
      });

      if (speaker) {
        // Claim the profile
        speaker.user = userId;
        await speaker.save();
      } else {
        // If speaker profile record doesn't exist yet, create default profile linked to user
        speaker = await Speaker.create({
          user: userId,
          name: user.name,
          contactEmail: user.email,
          company: user.organization || '',
          createdBy: userId
        });
      }
    }
    return speaker;
  }

  async updateSpeakerProfile(speakerId, updateData, user) {
    const speaker = await Speaker.findById(speakerId);
    if (!speaker) {
      const err = new Error('Speaker profile not found');
      err.statusCode = 404;
      throw err;
    }

    // Strict separation: ONLY the owning speaker edits their personal profile.
    // Organizers manage assignments via /organizer/* endpoints (never personal fields).
    const userId = typeof user === 'object' ? user.id || user._id : user;
    const isOwner = speaker.user && speaker.user.toString() === userId.toString();

    if (!isOwner) {
      const err = new Error('Access Denied: You can only edit your own speaker profile.');
      err.statusCode = 403;
      throw err;
    }

    return await Speaker.findByIdAndUpdate(speakerId, updateData, { new: true, runValidators: true });
  }

  async getSpeakerSessions(userId) {
    const speaker = await this.getSpeakerProfile(userId);
    if (!speaker) return [];

    const user = await User.findById(userId).select('email').lean();
    const matchingProfiles = user?.email
      ? await Speaker.find({ contactEmail: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).select('_id').lean()
      : [];
    const speakerIds = [...new Set([speaker._id, ...matchingProfiles.map((profile) => profile._id)].map((id) => id.toString()))];

    return await Session.find({ speakers: { $in: speakerIds } })
      .populate('event', 'name startDate endDate venue status')
      .populate('speakers', 'name designation company profileImage')
      .sort({ startTime: 1 });
  }

  async uploadPresentationMaterial(materialData, userId, uploadedFile) {
    const speaker = await this.getSpeakerProfile(userId);
    if (!speaker) {
      const err = new Error('Speaker profile required to upload material.');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findById(userId).select('email').lean();
    const aliases = user?.email
      ? await Speaker.find({ contactEmail: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).select('_id').lean()
      : [];
    const speakerIds = [...new Set([speaker._id, ...aliases.map((profile) => profile._id)].map((id) => id.toString()))];
    const session = await Session.findOne({ _id: materialData.session, speakers: { $in: speakerIds } });
    if (!session) {
      const err = new Error('You can only upload materials to your assigned sessions.');
      err.statusCode = 403;
      throw err;
    }

    if (!uploadedFile && (materialData.fileType !== 'Link' || !materialData.fileUrl)) {
      const err = new Error('Choose a file to upload, or provide a URL when the file type is Link.');
      err.statusCode = 400;
      throw err;
    }

    let fileId = null;
    let fileUrl = materialData.fileUrl || '';
    if (uploadedFile) {
      const allowedExtensions = new Set(['.pdf', '.ppt', '.pptx', '.key', '.mp4', '.mov', '.doc', '.docx', '.txt']);
      const extension = path.extname(uploadedFile.originalname).toLowerCase();
      if (materialData.fileType !== 'Other' && !allowedExtensions.has(extension)) {
        const err = new Error('This file type is not supported. Upload a PDF, presentation, video, or document.');
        err.statusCode = 400;
        throw err;
      }

      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'presentationMaterials' });
      fileId = new mongoose.Types.ObjectId();
      const safeName = path.basename(uploadedFile.originalname).replace(/[^a-zA-Z0-9._ -]/g, '_');
      const uploadStream = bucket.openUploadStreamWithId(fileId, `${crypto.randomUUID()}-${safeName}`, {
        contentType: uploadedFile.mimetype || 'application/octet-stream',
        metadata: { originalName: safeName, uploadedBy: userId.toString() }
      });
      await new Promise((resolve, reject) => {
        uploadStream.once('error', reject);
        uploadStream.once('finish', resolve);
        uploadStream.end(uploadedFile.buffer);
      });
      fileUrl = `/api/modules/materials/files/${fileId}`;
    }

    try {
      return await PresentationMaterial.create({
        session: materialData.session,
        fileName: materialData.fileName || uploadedFile?.originalname,
        fileUrl,
        fileId,
        fileType: materialData.fileType || 'Other',
        speaker: speaker._id,
        uploadedBy: userId
      });
    } catch (err) {
      if (fileId) await new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'presentationMaterials' }).delete(fileId).catch(() => {});
      throw err;
    }
  }

  async getPresentationMaterialFile(fileId) {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      const err = new Error('Presentation file not found.');
      err.statusCode = 404;
      throw err;
    }
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'presentationMaterials' });
    const file = await mongoose.connection.db.collection('presentationMaterials.files').findOne({ _id: new mongoose.Types.ObjectId(fileId) });
    if (!file) {
      const err = new Error('Presentation file not found.');
      err.statusCode = 404;
      throw err;
    }
    return { file, stream: bucket.openDownloadStream(file._id) };
  }

  async getMaterialsBySession(sessionId) {
    return await PresentationMaterial.find({ session: sessionId })
      .populate('speaker', 'name company')
      .populate('uploadedBy', 'name email');
  }

  // Speaker's own session feedback (their assigned sessions only)
  async getSpeakerFeedback(userId) {
    const { Feedback } = require('../models/Feedback');
    const speaker = await this.getSpeakerProfile(userId);
    if (!speaker) return [];
    const sessions = await Session.find({ speakers: speaker._id }).select('_id title').lean();
    const sessionIds = sessions.map((s) => s._id);
    if (sessionIds.length === 0) return [];
    const titleById = Object.fromEntries(sessions.map((s) => [s._id.toString(), s.title]));
    const feedback = await Feedback.find({ session: { $in: sessionIds } })
      .populate('attendee', 'name')
      .populate('event', 'name')
      .sort({ createdAt: -1 })
      .lean();
    return feedback.map((f) => ({
      ...f,
      sessionTitle: f.session && titleById[f.session.toString()]
    }));
  }

  // ================= SPONSOR MODULE =================
  async getSponsorProfile(userId) {
    // Primary lookup: sponsor.user === userId (reliable)
    let sponsor = await Sponsor.findOne({ user: userId });
    if (!sponsor) {
      // Fallback: match by contact email for legacy seeded records without user ref
      const user = await require('../models/User').User.findById(userId);
      if (user) {
        sponsor = await Sponsor.findOne({ contactEmail: user.email });
        // Backfill the user ref so future lookups are fast
        if (sponsor && !sponsor.user) {
          sponsor.user = userId;
          await sponsor.save();
        }
      }
    }
    return sponsor;
  }

  async updateSponsorProfile(sponsorId, updateData, user) {
    const sponsor = await Sponsor.findById(sponsorId);
    if (!sponsor) {
      const err = new Error('Sponsor profile not found');
      err.statusCode = 404;
      throw err;
    }

    // Strict separation: ONLY the owning sponsor edits their sponsor profile.
    const userId = typeof user === 'object' ? user.id || user._id : user;
    const userEmail = typeof user === 'object' ? user.email : null;
    const isOwner = (sponsor.user && sponsor.user.toString() === userId.toString()) || (userEmail && sponsor.contactEmail === userEmail);

    if (!isOwner) {
      const err = new Error('Access Denied: You can only edit your own sponsor profile.');
      err.statusCode = 403;
      throw err;
    }

    return await Sponsor.findByIdAndUpdate(sponsorId, updateData, { new: true, runValidators: true });
  }

  async getDeliverablesBySponsor(sponsorId) {
    return await Deliverable.find({ sponsor: sponsorId })
      .populate('event', 'name startDate endDate')
      .populate('package', 'name price')
      .sort({ dueDate: 1 });
  }

  async getDeliverablesByEvent(eventId) {
    return await Deliverable.find({ event: eventId })
      .populate('sponsor', 'companyName contactEmail logoUrl website')
      .populate('package', 'name price')
      .sort({ dueDate: 1 });
  }

  async createDeliverable(deliverableData) {
    return await Deliverable.create(deliverableData);
  }

  async updateDeliverableStatus(deliverableId, updateData) {
    return await Deliverable.findByIdAndUpdate(deliverableId, updateData, { new: true, runValidators: true });
  }

  async uploadBrandAsset(assetData, userId) {
    return await BrandAsset.create({ ...assetData, uploadedBy: userId });
  }

  async getBrandAssetsBySponsor(sponsorId) {
    return await BrandAsset.find({ sponsor: sponsorId }).sort({ createdAt: -1 });
  }

  // ================= ORGANIZER SPEAKER MANAGEMENT =================
  // Assignment-level management only (sessions ↔ speakers).
  // NEVER touches personal Speaker profile fields (bio, contact, socials).
  async getOrganizerSpeakers(organizerId) {
    const { Event } = require('../models/Event');
    const ownEvents = await Event.find({ organizer: organizerId }).select('_id name').lean();
    const eventIds = ownEvents.map((e) => e._id);
    const roster = await Speaker.find({ $or: [{ createdBy: organizerId }, { organizers: organizerId }] }).sort({ name: 1 }).lean();
    if (eventIds.length === 0) return { speakers: roster, assignments: [] };

    const sessions = await Session.find({ event: { $in: eventIds } })
      .populate('speakers')
      .populate('event', 'name startDate endDate status')
      .sort({ startTime: 1 })
      .lean();

    // Keep the complete organizer-managed speaker roster, including speakers
    // who have not been assigned to a session yet.
    const speakerById = new Map(roster.map((speaker) => [speaker._id.toString(), speaker]));
    const assignments = [];
    sessions.forEach((s) => {
      (s.speakers || []).forEach((sp) => {
        if (!sp) return;
        const speaker = {
          _id: sp._id,
          name: sp.name,
          designation: sp.designation,
          company: sp.company,
          contactEmail: sp.contactEmail,
          expertise: sp.expertise,
          profileImage: sp.profileImage
        };
        speakerById.set(sp._id.toString(), speaker);
        assignments.push({
          speaker: { _id: sp._id },
          session: { _id: s._id, title: s.title, startTime: s.startTime, endTime: s.endTime, roomName: s.roomName },
          event: s.event
        });
      });
    });
    return { speakers: [...speakerById.values()].sort((a, b) => a.name.localeCompare(b.name)), assignments };
  }

  async createSpeakerForOrganizer(speakerData, organizerId) {
    // Creates a speaker record owned by the organizer (unlinked user account).
    // Personal profile completion happens when/if the speaker claims the account.
    const contactEmail = speakerData.contactEmail?.trim().toLowerCase();
    if (contactEmail) {
      const existing = await Speaker.findOne({ contactEmail: new RegExp(`^${contactEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
      if (existing) {
        await Speaker.updateOne({ _id: existing._id }, { $addToSet: { organizers: organizerId } });
        existing.organizers = [...new Set([...(existing.organizers || []).map((id) => id.toString()), organizerId.toString()])];
        return existing;
      }
      const user = await User.findOne({ email: contactEmail, role: ROLES.SPEAKER }).select('_id');
      return await Speaker.create({ ...speakerData, contactEmail, user: user?._id, createdBy: organizerId, organizers: [organizerId] });
    }
    return await Speaker.create({ ...speakerData, createdBy: organizerId, organizers: [organizerId] });
  }

  async assignSpeakerToSession(sessionId, speakerId, organizerId) {
    const { Event } = require('../models/Event');
    const session = await Session.findById(sessionId);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }
    const event = await Event.findById(session.event);
    if (!event || event.organizer.toString() !== organizerId.toString()) {
      const err = new Error('Access Denied: You can only assign speakers to your own events.');
      err.statusCode = 403;
      throw err;
    }
    const speaker = await Speaker.findById(speakerId);
    if (!speaker) {
      const err = new Error('Speaker not found');
      err.statusCode = 404;
      throw err;
    }
    const speakerIsInOrganizerRoster = speaker.createdBy?.toString() === organizerId.toString()
      || (speaker.organizers || []).some((id) => id.toString() === organizerId.toString())
      || await Session.exists({ event: { $in: await Event.find({ organizer: organizerId }).distinct('_id') }, speakers: speakerId });
    if (!speakerIsInOrganizerRoster) {
      const err = new Error('This speaker is not in your speaker directory. Add the speaker to your directory before assigning them.');
      err.statusCode = 403;
      throw err;
    }
    const currentSpeakerIds = (session.speakers || []).map((id) => id.toString());
    if (!currentSpeakerIds.includes(speakerId.toString())) {
      const conflict = await Session.findOne({
        _id: { $ne: session._id },
        speakers: speakerId,
        startTime: { $lt: session.endTime },
        endTime: { $gt: session.startTime }
      }).select('title startTime endTime').lean();
      if (conflict) {
        const err = new Error(`${speaker.name} is already assigned to "${conflict.title}" during this time.`);
        err.statusCode = 409;
        throw err;
      }
      session.speakers.push(speakerId);
      await session.save();
    }
    return await session.populate('speakers', 'name designation company');
  }

  async removeSpeakerFromSession(sessionId, speakerId, organizerId) {
    const { Event } = require('../models/Event');
    const session = await Session.findById(sessionId);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }
    const event = await Event.findById(session.event);
    if (!event || event.organizer.toString() !== organizerId.toString()) {
      const err = new Error('Access Denied: You can only modify your own events.');
      err.statusCode = 403;
      throw err;
    }
    session.speakers = (session.speakers || []).filter((id) => id.toString() !== speakerId.toString());
    await session.save();
    return await session.populate('speakers', 'name designation company');
  }
}

module.exports = new ModulesService();
