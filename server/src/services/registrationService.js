const crypto = require('crypto');
const { Event } = require('../models/Event');
const TicketCategory = require('../models/TicketCategory');
const Coupon = require('../models/Coupon');
const { Registration } = require('../models/Registration');
const Ticket = require('../models/Ticket');
const { ROLES } = require('../models/User');

class RegistrationService {
  // --- TICKET CATEGORIES ---
  async getCategoriesByEvent(eventId) {
    return await TicketCategory.find({ event: eventId, isActive: true }).sort({ price: 1 });
  }

  async createCategory(categoryData) {
    return await TicketCategory.create(categoryData);
  }

  async updateCategory(categoryId, categoryData) {
    return await TicketCategory.findByIdAndUpdate(categoryId, categoryData, { new: true });
  }

  async deleteCategory(categoryId) {
    return await TicketCategory.findByIdAndDelete(categoryId);
  }

  // --- COUPONS ---
  async validateCoupon(eventId, code, ticketPrice) {
    if (!code) return { valid: false, discountAmount: 0, finalPrice: ticketPrice };

    const coupon = await Coupon.findOne({ event: eventId, code: code.toUpperCase().trim(), isActive: true });
    if (!coupon) {
      const err = new Error('Invalid coupon code.');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      const err = new Error('Coupon is not yet valid.');
      err.statusCode = 400;
      throw err;
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      const err = new Error('Coupon has expired.');
      err.statusCode = 400;
      throw err;
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      const err = new Error('Coupon usage limit has been reached.');
      err.statusCode = 400;
      throw err;
    }

    let discountAmount = 0;
    if (coupon.discountType === 'Percentage') {
      discountAmount = (ticketPrice * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    const finalPrice = Math.max(0, ticketPrice - discountAmount);
    return { valid: true, coupon, discountAmount, finalPrice };
  }

  async createCoupon(couponData) {
    return await Coupon.create({ ...couponData, code: couponData.code.toUpperCase().trim() });
  }

  async getCouponsByEvent(eventId) {
    return await Coupon.find({ event: eventId });
  }

  // --- REGISTRATION LOGIC WITH ATOMIC COUNTS & WAITLIST ---
  async registerAttendee({ eventId, attendeeId, ticketCategoryId, couponCode, selectedSessions = [] }) {
    // 1. Validate Event
    const event = await Event.findById(eventId);
    if (!event) {
      const err = new Error('Event not found.');
      err.statusCode = 404;
      throw err;
    }

    if (event.status === 'Cancelled' || event.status === 'Completed') {
      const err = new Error(`Registration closed: Event is currently ${event.status}.`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Prevent Duplicate Active Registration
    const existing = await Registration.findOne({
      event: eventId,
      attendee: attendeeId,
      status: { $ne: 'Cancelled' }
    });
    if (existing) {
      const err = new Error('You are already registered for this event.');
      err.statusCode = 409;
      throw err;
    }

    // 3. Validate Ticket Category
    const category = await TicketCategory.findOne({ _id: ticketCategoryId, event: eventId, isActive: true });
    if (!category) {
      const err = new Error('Selected ticket category is invalid or unavailable.');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    if ((category.saleStart && now < category.saleStart) || (category.saleEnd && now > category.saleEnd)) {
      const err = new Error('Selected ticket category is outside its sale period.');
      err.statusCode = 400;
      throw err;
    }

    // 4. Calculate Final Price with Coupon
    let finalPrice = category.price;
    let appliedCoupon = null;
    if (couponCode) {
      const couponRes = await this.validateCoupon(eventId, couponCode, category.price);
      finalPrice = couponRes.finalPrice;
      appliedCoupon = couponRes.coupon;
    }

    // 5. Atomic Capacity & Waitlist Check
    const totalConfirmedRegistrations = await Registration.countDocuments({
      event: eventId,
      status: 'Approved'
    });

    const isCategorySoldOut = category.soldCount >= category.capacity;
    const isEventFull = totalConfirmedRegistrations >= event.capacity;

    let registrationStatus = 'Approved';
    if (isCategorySoldOut || isEventFull) {
      registrationStatus = 'Waitlisted';
    }

    // 6. Generate unique ticketCode — always, regardless of status
    const ticketCode = `EF-${eventId.toString().slice(-4).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // 7. Create Registration Record (with ticketCode embedded)
    let registration;
    try {
      registration = await Registration.create({
        event: eventId,
        attendee: attendeeId,
        ticketCategory: ticketCategoryId,
        status: registrationStatus,
        coupon: appliedCoupon ? appliedCoupon._id : null,
        finalPrice,
        selectedSessions,
        ticketCode
      });
    } catch (createErr) {
      // Handle MongoDB duplicate key errors with clear user-facing messages
      if (createErr.code === 11000) {
        if (createErr.keyPattern && (createErr.keyPattern.event || createErr.keyPattern.attendee)) {
          const dupErr = new Error('You are already registered for this event.');
          dupErr.statusCode = 409;
          throw dupErr;
        }
        if (createErr.keyPattern && createErr.keyPattern.ticketCode) {
          // Extremely rare collision — retry with new code
          const retryCode = `EF-${eventId.toString().slice(-4).toUpperCase()}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
          registration = await Registration.create({
            event: eventId,
            attendee: attendeeId,
            ticketCategory: ticketCategoryId,
            status: registrationStatus,
            coupon: appliedCoupon ? appliedCoupon._id : null,
            finalPrice,
            selectedSessions,
            ticketCode: retryCode
          });
        } else {
          throw createErr;
        }
      } else {
        throw createErr;
      }
    }

    // 8. If Approved, atomically update sold counts & generate ticket
    let ticket = null;
    if (registrationStatus === 'Approved') {
      await TicketCategory.findByIdAndUpdate(ticketCategoryId, { $inc: { soldCount: 1 } });
      if (appliedCoupon) {
        await Coupon.findByIdAndUpdate(appliedCoupon._id, { $inc: { usedCount: 1 } });
      }

      // Generate Ticket Number & Secure QR Token
      const ticketNumber = registration.ticketCode;
      const qrToken = crypto.randomBytes(24).toString('hex');

      ticket = await Ticket.create({
        registration: registration._id,
        attendee: attendeeId,
        event: eventId,
        ticketCategory: ticketCategoryId,
        ticketNumber,
        qrToken,
        status: 'Valid'
      });
    }

    return {
      registration,
      ticket,
      status: registrationStatus,
      message: registrationStatus === 'Waitlisted'
        ? 'Event/Category capacity reached. You have been added to the waitlist.'
        : 'Registration successful! Ticket issued.'
    };
  }

  // --- CANCELLATION & AUTOMATIC WAITLIST PROMOTION ---
  async cancelRegistration(registrationId, userId) {
    const reg = await Registration.findById(registrationId);
    if (!reg) {
      const err = new Error('Registration record not found.');
      err.statusCode = 404;
      throw err;
    }

    if (reg.status === 'Cancelled') {
      return { message: 'Registration is already cancelled.' };
    }

    const wasApproved = reg.status === 'Approved';
    reg.status = 'Cancelled';
    await reg.save();

    // Cancel active ticket if exists
    await Ticket.findOneAndUpdate({ registration: registrationId }, { status: 'Cancelled' });

    if (wasApproved) {
      // Decrement sold count
      await TicketCategory.findByIdAndUpdate(reg.ticketCategory, { $inc: { soldCount: -1 } });

      // AUTOMATIC WAITLIST PROMOTION: Promote earliest waitlisted registration for this category
      const nextWaitlisted = await Registration.findOne({
        event: reg.event,
        ticketCategory: reg.ticketCategory,
        status: 'Waitlisted'
      }).sort({ createdAt: 1 });

      if (nextWaitlisted) {
        nextWaitlisted.status = 'Approved';
        // If the promoted registration has no ticketCode yet (old records), assign one now
        if (!nextWaitlisted.ticketCode) {
          nextWaitlisted.ticketCode = `EF-${reg.event.toString().slice(-4).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        }
        await nextWaitlisted.save();

        await TicketCategory.findByIdAndUpdate(reg.ticketCategory, { $inc: { soldCount: 1 } });

        const ticketNumber = nextWaitlisted.ticketCode;
        const qrToken = crypto.randomBytes(24).toString('hex');

        await Ticket.create({
          registration: nextWaitlisted._id,
          attendee: nextWaitlisted.attendee,
          event: reg.event,
          ticketCategory: reg.ticketCategory,
          ticketNumber,
          qrToken,
          status: 'Valid'
        });
      }
    }

    return { message: 'Registration cancelled successfully.' };
  }

  // --- ORGANIZER REGISTRATION STATUS UPDATE ---
  async updateRegistrationStatus(registrationId, newStatus, organizerId) {
    const reg = await Registration.findById(registrationId).populate('event');
    if (!reg) {
      const err = new Error('Registration record not found.');
      err.statusCode = 404;
      throw err;
    }

    // Verify organizer owns the event
    if (reg.event.organizer.toString() !== organizerId.toString()) {
      const err = new Error('Access Denied: You do not own this event.');
      err.statusCode = 403;
      throw err;
    }

    const validStatuses = ['Pending', 'Approved', 'Rejected', 'Waitlisted', 'Cancelled'];
    if (!validStatuses.includes(newStatus)) {
      const err = new Error('Invalid status.');
      err.statusCode = 400;
      throw err;
    }

    if (reg.status === newStatus) {
      return reg;
    }

    const oldStatus = reg.status;
    reg.status = newStatus;

    if (newStatus === 'Approved') {
      // Create ticket if it doesn't exist
      let ticket = await Ticket.findOne({ registration: reg._id });
      if (!ticket) {
        if (!reg.ticketCode) {
          reg.ticketCode = `EF-${reg.event._id.toString().slice(-4).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        }
        await TicketCategory.findByIdAndUpdate(reg.ticketCategory, { $inc: { soldCount: 1 } });
        await Ticket.create({
          registration: reg._id,
          attendee: reg.attendee,
          event: reg.event._id,
          ticketCategory: reg.ticketCategory,
          ticketNumber: reg.ticketCode,
          qrToken: crypto.randomBytes(24).toString('hex'),
          status: 'Valid'
        });
      } else if (ticket.status !== 'Valid') {
        ticket.status = 'Valid';
        await ticket.save();
      }
    } else if (['Rejected', 'Cancelled', 'Waitlisted'].includes(newStatus)) {
      // Invalidate ticket
      await Ticket.findOneAndUpdate({ registration: reg._id }, { status: 'Cancelled' });
      
      // If it was previously approved, we just freed a spot!
      if (oldStatus === 'Approved') {
        await TicketCategory.findByIdAndUpdate(reg.ticketCategory, { $inc: { soldCount: -1 } });
        
        // Automatic waitlist promotion
        const nextWaitlisted = await Registration.findOne({
          event: reg.event._id,
          ticketCategory: reg.ticketCategory,
          status: 'Waitlisted'
        }).sort({ createdAt: 1 });

        if (nextWaitlisted) {
          nextWaitlisted.status = 'Approved';
          if (!nextWaitlisted.ticketCode) {
            nextWaitlisted.ticketCode = `EF-${reg.event._id.toString().slice(-4).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
          }
          await nextWaitlisted.save();
          await TicketCategory.findByIdAndUpdate(reg.ticketCategory, { $inc: { soldCount: 1 } });
          await Ticket.create({
            registration: nextWaitlisted._id,
            attendee: nextWaitlisted.attendee,
            event: reg.event._id,
            ticketCategory: reg.ticketCategory,
            ticketNumber: nextWaitlisted.ticketCode,
            qrToken: crypto.randomBytes(24).toString('hex'),
            status: 'Valid'
          });
        }
      }
    }

    await reg.save();
    return reg;
  }

  // --- ATTENDEE SESSION SELECTION WITH OVERLAP PREVENTION ---
  async updateSelectedSessions(registrationId, attendeeId, sessionIds) {
    const Session = require('../models/Session');
    const reg = await Registration.findById(registrationId);
    if (!reg) {
      const err = new Error('Registration record not found.');
      err.statusCode = 404;
      throw err;
    }
    // Ownership: attendee accesses only their own registrations
    if (reg.attendee.toString() !== attendeeId.toString()) {
      const err = new Error('Access Denied: You can only modify your own registrations.');
      err.statusCode = 403;
      throw err;
    }
    if (reg.status === 'Cancelled') {
      const err = new Error('Cannot modify sessions on a cancelled registration.');
      err.statusCode = 400;
      throw err;
    }

    const uniqueIds = [...new Set((sessionIds || []).map((id) => id.toString()))];
    const sessions = uniqueIds.length > 0
      ? await Session.find({ _id: { $in: uniqueIds } }).lean()
      : [];

    if (sessions.length !== uniqueIds.length) {
      const err = new Error('One or more selected sessions do not exist.');
      err.statusCode = 400;
      throw err;
    }
    // All sessions must belong to the registered event
    const foreign = sessions.find((s) => s.event.toString() !== reg.event.toString());
    if (foreign) {
      const err = new Error(`Session "${foreign.title}" does not belong to this event.`);
      err.statusCode = 400;
      throw err;
    }

    // Overlap detection across the final set
    const ordered = [...sessions].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    for (let i = 1; i < ordered.length; i++) {
      if (new Date(ordered[i].startTime) < new Date(ordered[i - 1].endTime)) {
        const err = new Error(
          `Schedule Conflict: "${ordered[i].title}" overlaps with "${ordered[i - 1].title}".`
        );
        err.statusCode = 409;
        throw err;
      }
    }

    reg.selectedSessions = uniqueIds;
    await reg.save();
    return await reg.populate('selectedSessions');
  }

  // --- ATTENDEE READ API ---
  async getMyRegistrations(attendeeId) {
    return await Registration.find({ attendee: attendeeId })
      .populate({ path: 'event', populate: { path: 'venue' } })
      .populate('ticketCategory')
      .populate('selectedSessions')
      .sort({ createdAt: -1 });
  }

  async getMyTickets(attendeeId) {
    return await Ticket.find({ attendee: attendeeId })
      .populate('event', 'name startDate endDate venue bannerUrl')
      .populate('ticketCategory', 'name price')
      .sort({ createdAt: -1 });
  }

  async getTicketById(ticketId, user) {
    const ticket = await Ticket.findById(ticketId)
      .populate({ path: 'event', populate: { path: 'venue' } })
      .populate('attendee', 'name email organization')
      .populate('ticketCategory');

    if (!ticket) {
      const err = new Error('Ticket not found.');
      err.statusCode = 404;
      throw err;
    }

    // Authorization: User must be ticket owner, event organizer, or Platform Admin
    const isOwner = ticket.attendee._id.toString() === user.id.toString();
    const isAdmin = user.role === ROLES.PLATFORM_ADMIN;

    if (!isOwner && !isAdmin) {
      const err = new Error('Access Denied: You are not authorized to view this ticket.');
      err.statusCode = 403;
      throw err;
    }

    return ticket;
  }
}

module.exports = new RegistrationService();
