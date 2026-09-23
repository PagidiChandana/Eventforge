import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Building, Eye, EyeOff, Phone, Briefcase, Tag, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getHomeForRole } from '../constants/roles';
import AlertError from '../components/AlertError';
import AuthPageLayout from '../components/AuthPageLayout';

// Public signup creates an Attendee ONLY (role forced server-side too).
// Privileged accounts are provisioned by the Platform Admin.
const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Attendee',
    phoneNumber: '',
    organization: '',
    jobTitle: '',
    interests: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect already-authenticated users to their own home
  useEffect(() => {
    if (isAuthenticated) navigate(getHomeForRole(user?.role), { replace: true });
  }, [isAuthenticated, navigate, user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      const newUser = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        organization: formData.organization,
        profileInfo: {
          phoneNumber: formData.phoneNumber,
          title: formData.jobTitle,
          interests: formData.interests.split(',').map((s) => s.trim()).filter(Boolean)
        }
      });
      // New attendees land on the Attendee Dashboard
      navigate(getHomeForRole(newUser?.role), { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageLayout
      eyebrow="Get started"
      title="Create your account"
      description="Set up your EventForge profile. You can update your details later."
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      {errorMsg && <div className="auth-alert"><AlertError message={errorMsg} type="error" /></div>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="register-role">I’m joining as</label>
          <select className="auth-select" id="register-role" name="role" value={formData.role} onChange={handleChange}>
            <option value="Attendee">Attendee</option>
            <option value="Event Organizer">Event Organizer</option>
            <option value="Sponsor">Sponsor</option>
            <option value="Speaker">Speaker</option>
            <option value="Event Staff">Event Staff</option>
          </select>
          <p className="auth-hint">Platform Admin accounts are provisioned separately.</p>
        </div>

        <div className="auth-form-grid">
          <div className="auth-field">
            <label htmlFor="register-name">Full name</label>
            <div className="auth-input-wrap"><User className="auth-input-icon" aria-hidden="true" /><input className="auth-input" id="register-name" type="text" name="name" autoComplete="name" required value={formData.name} onChange={handleChange} placeholder="Jane Doe" /></div>
          </div>
          <div className="auth-field">
            <label htmlFor="register-email">Email address</label>
            <div className="auth-input-wrap"><Mail className="auth-input-icon" aria-hidden="true" /><input className="auth-input" id="register-email" type="email" name="email" autoComplete="email" required value={formData.email} onChange={handleChange} placeholder="name@company.com" /></div>
          </div>
        </div>

        <div className="auth-form-grid">
          <div className="auth-field">
            <label htmlFor="register-password">Password</label>
            <div className="auth-input-wrap">
              <Lock className="auth-input-icon" aria-hidden="true" />
              <input className="auth-input auth-has-action" id="register-password" type={showPassword ? 'text' : 'password'} name="password" autoComplete="new-password" required value={formData.password} onChange={handleChange} placeholder="Create a password" />
              <button className="auth-input-action" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
            <p className="auth-hint">Use at least 6 characters.</p>
          </div>
          <div className="auth-field">
            <label htmlFor="register-confirm-password">Confirm password</label>
            <div className="auth-input-wrap">
              <Lock className="auth-input-icon" aria-hidden="true" />
              <input className="auth-input auth-has-action" id="register-confirm-password" type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" autoComplete="new-password" required value={formData.confirmPassword} onChange={handleChange} placeholder="Enter it again" />
              <button className="auth-input-action" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </div>
        </div>

        <div className="auth-form-grid">
          <div className="auth-field">
            <label htmlFor="register-phone">Phone number <span className="auth-hint">(optional)</span></label>
            <div className="auth-input-wrap"><Phone className="auth-input-icon" aria-hidden="true" /><input className="auth-input" id="register-phone" type="tel" name="phoneNumber" autoComplete="tel" value={formData.phoneNumber} onChange={handleChange} placeholder="+1 555 0100" /></div>
          </div>
          <div className="auth-field">
            <label htmlFor="register-organization">Organization <span className="auth-hint">(optional)</span></label>
            <div className="auth-input-wrap"><Building className="auth-input-icon" aria-hidden="true" /><input className="auth-input" id="register-organization" type="text" name="organization" autoComplete="organization" value={formData.organization} onChange={handleChange} placeholder="Company or organization" /></div>
          </div>
        </div>

        <div className="auth-form-grid">
          <div className="auth-field">
            <label htmlFor="register-job-title">Job title <span className="auth-hint">(optional)</span></label>
            <div className="auth-input-wrap"><Briefcase className="auth-input-icon" aria-hidden="true" /><input className="auth-input" id="register-job-title" type="text" name="jobTitle" autoComplete="organization-title" value={formData.jobTitle} onChange={handleChange} placeholder="Your role" /></div>
          </div>
          <div className="auth-field">
            <label htmlFor="register-interests">Interests <span className="auth-hint">(optional)</span></label>
            <div className="auth-input-wrap"><Tag className="auth-input-icon" aria-hidden="true" /><input className="auth-input" id="register-interests" type="text" name="interests" value={formData.interests} onChange={handleChange} placeholder="AI, cloud, design" /></div>
          </div>
        </div>

        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'Creating your account…' : 'Create account'} {!submitting && <ArrowRight size={16} aria-hidden="true" />}
        </button>
      </form>
    </AuthPageLayout>
  );
};

export default Register;
