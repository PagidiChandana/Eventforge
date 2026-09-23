import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getHomeForRole } from '../constants/roles';
import AlertError from '../components/AlertError';
import AuthPageLayout from '../components/AuthPageLayout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showForgot, setShowForgot] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect already-authenticated users
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const loggedUser = await login(email.trim(), password);
      // Role-aware landing: each role opens its own workspace (no confusion)
      const home = getHomeForRole(loggedUser?.role);
      // Respect deep-link only if it belongs to this role; else go home
      navigate(location.state?.from?.pathname || home, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageLayout
      eyebrow="Welcome back"
      title="Sign in to EventForge"
      description="Access your workspace and pick up where your events left off."
      footer={<>New to EventForge? <Link to="/register">Create an account</Link></>}
    >
      {errorMsg && <div className="auth-alert"><AlertError message={errorMsg} type="error" /></div>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="login-email">Email address</label>
          <div className="auth-input-wrap">
            <Mail className="auth-input-icon" aria-hidden="true" />
            <input className="auth-input" id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrorMsg(null); }} placeholder="name@company.com" />
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <div className="auth-input-wrap">
            <Lock className="auth-input-icon" aria-hidden="true" />
            <input className="auth-input auth-has-action" id="login-password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setErrorMsg(null); }} placeholder="Enter your password" />
            <button className="auth-input-action" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        <div className="auth-form-meta">
          <button className="auth-link-button" type="button" onClick={() => setShowForgot(true)}>Forgot password?</button>
        </div>
        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'} {!submitting && <ArrowRight size={16} aria-hidden="true" />}
        </button>
      </form>

      {showForgot && (
        <div className="auth-modal-backdrop" onClick={() => setShowForgot(false)}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="reset-password-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="reset-password-title">Password help</h2>
            <p>Self-service password reset is not available. Contact your Event Organizer or Platform Administrator for help resetting your account.</p>
            <button className="auth-submit" type="button" onClick={() => setShowForgot(false)}>Got it</button>
          </section>
        </div>
      )}
    </AuthPageLayout>
  );
};

export default Login;
