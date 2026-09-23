const bcrypt = require('bcryptjs');
const { User, ROLES } = require('../models/User');
const { generateToken } = require('../utils/jwt');

class AuthService {
  async registerUser({ name, email, password, role, organization, profileInfo }) {
    const requestedRole = role || ROLES.ATTENDEE;
    if (requestedRole === ROLES.PLATFORM_ADMIN) {
      const error = new Error('Public registration as Platform Admin is restricted.');
      error.statusCode = 403;
      throw error;
    }
    return this.createUser({ name, email, password, role: requestedRole, organization, profileInfo });
  }

  // Platform Admin creates accounts with any role (except a second Platform Admin).
  async createUserByAdmin({ name, email, password, role, organization, profileInfo }) {
    const userRole = role || ROLES.ATTENDEE;
    if (!Object.values(ROLES).includes(userRole)) {
      const error = new Error(`Invalid role '${userRole}'. Must be one of: ${Object.values(ROLES).join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    return this.createUser({ name, email, password, role: userRole, organization, profileInfo });
  }

  async createUser({ name, email, password, role, organization, profileInfo }) {
    // 1. Email format check & existing check
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const error = new Error('An account with this email address already exists.');
      error.statusCode = 400;
      throw error;
    }

    // 2. Password strength validation
    if (!password || password.length < 6) {
      const error = new Error('Password must be at least 6 characters long.');
      error.statusCode = 400;
      throw error;
    }

    // 3. Role validation & SINGLE Platform Admin enforcement
    const userRole = role || ROLES.ATTENDEE;
    if (!Object.values(ROLES).includes(userRole)) {
      const error = new Error(`Invalid role '${userRole}'. Must be one of: ${Object.values(ROLES).join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    if (userRole === ROLES.PLATFORM_ADMIN) {
      const adminExists = await User.exists({ role: ROLES.PLATFORM_ADMIN });
      if (adminExists) {
        const error = new Error('Access Denied: Platform Admin is restricted to a single primary system administrator account.');
        error.statusCode = 403;
        throw error;
      }
    }

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 5. Save user
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: userRole,
      organization: organization || '',
      profileInfo: profileInfo || {}
    });

    const token = generateToken(user);
    return { user, token };
  }

  async loginUser({ email, password }) {
    if (!email || !password) {
      const error = new Error('Please provide both email and password.');
      error.statusCode = 400;
      throw error;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Your account has been deactivated. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const token = generateToken(user);
    return { user: user.toJSON(), token };
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  // Account profile self-edit (name, organization, phone, title, interests, avatar).
  // Role-specific data (speaker bio/socials, sponsor brand, org settings) lives in
  // its own module and is never touched here.
  async updateMyProfile(userId, { name, organization, profileInfo }) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    if (name !== undefined) user.name = String(name).trim().slice(0, 100);
    if (organization !== undefined) user.organization = String(organization).trim();
    if (profileInfo && typeof profileInfo === 'object') {
      const pi = user.profileInfo || {};
      ['bio', 'avatarUrl', 'phoneNumber', 'title'].forEach((k) => {
        if (profileInfo[k] !== undefined) pi[k] = profileInfo[k];
      });
      if (Array.isArray(profileInfo.interests)) {
        pi.interests = profileInfo.interests.map((s) => String(s).trim()).filter(Boolean).slice(0, 20);
      }
      user.profileInfo = pi;
    }
    await user.save();
    return user.toJSON();
  }

  async changeMyPassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    const ok = await bcrypt.compare(currentPassword || '', user.passwordHash);
    if (!ok) {
      const error = new Error('Current password is incorrect.');
      error.statusCode = 400;
      throw error;
    }
    if (!newPassword || newPassword.length < 6) {
      const error = new Error('New password must be at least 6 characters long.');
      error.statusCode = 400;
      throw error;
    }
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();
    return user.toJSON();
  }

  // Admin/Organizer: paginated user directory with role + status filters
  async listUsers({ role, search, isActive, page = 1, limit = 50 }) {
    const filter = {};
    if (role && Object.values(ROLES).includes(role)) filter.role = role;
    if (typeof isActive === 'boolean') filter.isActive = isActive;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (Math.max(1, page) - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Math.min(100, limit)).lean(),
      User.countDocuments(filter)
    ]);
    const sanitized = users.map(({ passwordHash, ...rest }) => rest);
    return { users: sanitized, total, page, limit };
  }

  // Platform Admin only: activate / deactivate accounts
  async setUserActiveStatus(userId, isActive) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    user.isActive = !!isActive;
    await user.save();
    return user.toJSON();
  }
}

module.exports = new AuthService();
