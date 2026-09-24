const modulesService = require('../services/modulesService');

// --- SPEAKER API CONTROLLERS ---
const getSpeakerProfile = async (req, res, next) => {
  try {
    const profile = await modulesService.getSpeakerProfile(req.user.id);
    res.status(200).json({ success: true, data: profile });
  } catch (err) { next(err); }
};

const updateSpeakerProfile = async (req, res, next) => {
  try {
    const profile = await modulesService.updateSpeakerProfile(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: 'Profile updated', data: profile });
  } catch (err) { next(err); }
};

const getSpeakerSessions = async (req, res, next) => {
  try {
    const sessions = await modulesService.getSpeakerSessions(req.user.id);
    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (err) { next(err); }
};

const uploadPresentationMaterial = async (req, res, next) => {
  try {
    const material = await modulesService.uploadPresentationMaterial(req.body, req.user.id, req.file);
    res.status(201).json({ success: true, message: 'Material uploaded successfully', data: material });
  } catch (err) { next(err); }
};

const downloadPresentationMaterial = async (req, res, next) => {
  try {
    const { file, stream } = await modulesService.getPresentationMaterialFile(req.params.fileId);
    const fileName = file.metadata?.originalName || file.filename || 'presentation-material';
    res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    stream.on('error', next);
    stream.pipe(res);
  } catch (err) { next(err); }
};

const getMaterialsBySession = async (req, res, next) => {
  try {
    const materials = await modulesService.getMaterialsBySession(req.params.sessionId);
    res.status(200).json({ success: true, count: materials.length, data: materials });
  } catch (err) { next(err); }
};

const getSpeakerFeedback = async (req, res, next) => {
  try {
    const feedback = await modulesService.getSpeakerFeedback(req.user.id);
    res.status(200).json({ success: true, count: feedback.length, data: feedback });
  } catch (err) { next(err); }
};

// --- SPONSOR API CONTROLLERS ---
const getSponsorProfile = async (req, res, next) => {
  try {
    const profile = await modulesService.getSponsorProfile(req.user.id);
    res.status(200).json({ success: true, data: profile });
  } catch (err) { next(err); }
};

const updateSponsorProfile = async (req, res, next) => {
  try {
    const profile = await modulesService.updateSponsorProfile(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: 'Sponsor profile updated', data: profile });
  } catch (err) { next(err); }
};

const getDeliverablesBySponsor = async (req, res, next) => {
  try {
    const deliverables = await modulesService.getDeliverablesBySponsor(req.params.sponsorId, req.user.id);
    res.status(200).json({ success: true, count: deliverables.length, data: deliverables });
  } catch (err) { next(err); }
};

const getDeliverablesByEvent = async (req, res, next) => {
  try {
    const deliverables = await modulesService.getDeliverablesByEvent(req.params.eventId, req.user.id);
    res.status(200).json({ success: true, count: deliverables.length, data: deliverables });
  } catch (err) { next(err); }
};

const createDeliverable = async (req, res, next) => {
  try {
    const deliverable = await modulesService.createDeliverable(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Deliverable created', data: deliverable });
  } catch (err) { next(err); }
};

const updateDeliverableStatus = async (req, res, next) => {
  try {
    const deliverable = await modulesService.updateDeliverableStatus(req.params.id, req.body, req.user, req.params.eventId || null);
    res.status(200).json({ success: true, message: 'Deliverable status updated', data: deliverable });
  } catch (err) { next(err); }
};

const uploadBrandAsset = async (req, res, next) => {
  try {
    const asset = await modulesService.uploadBrandAsset(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Brand asset uploaded', data: asset });
  } catch (err) { next(err); }
};

const getBrandAssetsBySponsor = async (req, res, next) => {
  try {
    const assets = await modulesService.getBrandAssetsBySponsor(req.params.sponsorId, req.user.id);
    res.status(200).json({ success: true, count: assets.length, data: assets });
  } catch (err) { next(err); }
};

// --- ORGANIZER SPEAKER MANAGEMENT (assignment-level only; never personal profiles) ---
const getOrganizerSpeakers = async (req, res, next) => {
  try {
    const result = await modulesService.getOrganizerSpeakers(req.user.id);
    res.status(200).json({ success: true, count: result.speakers.length, data: result });
  } catch (err) { next(err); }
};

const createSpeakerForOrganizer = async (req, res, next) => {
  try {
    const speaker = await modulesService.createSpeakerForOrganizer(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Speaker added', data: speaker });
  } catch (err) { next(err); }
};

const assignSpeakerToSession = async (req, res, next) => {
  try {
    const session = await modulesService.assignSpeakerToSession(req.params.sessionId, req.body.speakerId, req.user.id);
    res.status(200).json({ success: true, message: 'Speaker assigned to session', data: session });
  } catch (err) { next(err); }
};

const removeSpeakerFromSession = async (req, res, next) => {
  try {
    const session = await modulesService.removeSpeakerFromSession(req.params.sessionId, req.params.speakerId, req.user.id);
    res.status(200).json({ success: true, message: 'Speaker removed from session', data: session });
  } catch (err) { next(err); }
};

module.exports = {
  getSpeakerProfile, updateSpeakerProfile, getSpeakerSessions, getSpeakerFeedback, uploadPresentationMaterial, downloadPresentationMaterial, getMaterialsBySession,
  getSponsorProfile, updateSponsorProfile, getDeliverablesBySponsor, getDeliverablesByEvent, createDeliverable, updateDeliverableStatus, uploadBrandAsset, getBrandAssetsBySponsor,
  getOrganizerSpeakers, createSpeakerForOrganizer, assignSpeakerToSession, removeSpeakerFromSession
};
