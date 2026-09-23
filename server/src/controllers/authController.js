const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, organization, profileInfo } = req.body;
    const { user, token } = await authService.registerUser({
      name,
      email,
      password,
      role,
      organization,
      profileInfo
    });

    res.status(201).json({
      success: true,
      message: `Account created successfully with role '${user.role}'`,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Platform Admin creates staff/speaker/sponsor/organizer accounts
const createUserByAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role, organization, profileInfo } = req.body;
    const { user } = await authService.createUserByAdmin({
      name,
      email,
      password,
      role,
      organization,
      profileInfo
    });

    res.status(201).json({
      success: true,
      message: `Account created with role '${user.role}'`,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser({ email, password });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// PUT /api/auth/me — account profile self-edit (any authenticated user, own record only)
const updateMe = async (req, res, next) => {
  try {
    const { name, organization, profileInfo } = req.body;
    const user = await authService.updateMyProfile(req.user.id, { name, organization, profileInfo });
    res.status(200).json({ success: true, message: 'Profile updated', data: { user } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/me/password — password change (own record only)
const changeMyPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await authService.changeMyPassword(req.user.id, currentPassword, newPassword);
    res.status(200).json({ success: true, message: 'Password changed successfully', data: { user } });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/users?role=&search=&isActive=&page=&limit=
// Allowed: Platform Admin, Event Organizer (read-only directory)
const listUsers = async (req, res, next) => {
  try {
    const { role, search, isActive, page, limit } = req.query;
    const parsed = {
      role,
      search,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50
    };
    const result = await authService.listUsers(parsed);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/auth/users/:id/status { isActive: boolean }
// Allowed: Platform Admin only
const setUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive (boolean) is required' });
    }
    const user = await authService.setUserActiveStatus(req.params.id, isActive);
    res.status(200).json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}`, data: { user } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  createUserByAdmin,
  login,
  me,
  updateMe,
  changeMyPassword,
  logout,
  listUsers,
  setUserStatus
};
