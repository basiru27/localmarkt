import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertMessage from '../components/AlertMessage';
import FormField from '../components/FormField';

export default function Register() {
  const { signUp } = useAuth();
  const nameInputRef = useRef(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto-focus name input on mount
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
    // Clear global error when user types
    if (error) setError('');
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle blur validation
  const handleBlur = (field) => {
    const errors = { ...fieldErrors };
    
    if (field === 'displayName') {
      if (!formData.displayName.trim()) {
        errors.displayName = 'Display name is required';
      } else if (formData.displayName.trim().length < 2) {
        errors.displayName = 'Display name must be at least 2 characters';
      } else {
        delete errors.displayName;
      }
    }
    
    if (field === 'email') {
      if (!formData.email) {
        errors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        errors.email = 'Please enter a valid email address';
      } else {
        delete errors.email;
      }
    }
    
    if (field === 'password') {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else {
        delete errors.password;
      }
    }
    
    if (field === 'confirmPassword') {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      } else {
        delete errors.confirmPassword;
      }
    }
    
    setFieldErrors(errors);
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '', textColor: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600' };
    return { strength, label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate all fields
    const errors = {};
    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required';
    }
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.displayName);
      setSuccess(true);
    } catch (err) {
      if (err.message?.includes('already registered')) {
        setError('An account with this email already exists.');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-8 sm:py-12 px-4">
        <div className="w-full max-w-md animate-scale-in">
          <div className="card-static p-8 text-center" role="status" aria-live="polite">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text mb-3">Check your email</h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              We've sent a confirmation link to{' '}
              <span className="font-semibold text-text">{formData.email}</span>.
              Click the link to verify your account.
            </p>
            <div className="space-y-3">
              <Link to="/login" className="btn-primary w-full">
                Go to Login
              </Link>
              <p className="text-sm text-text-muted">
                Didn't receive the email? Check your spam folder.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-8 sm:py-12 px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
              </svg>
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
              LocalMarkt
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">
            Create your account
          </h1>
          <p className="text-text-secondary">
            Join the community and start selling today
          </p>
        </div>

        {/* Card */}
        <div className="card-static p-6 sm:p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6">
              <AlertMessage variant="error" onDismiss={() => setError('')}>
                {error}
              </AlertMessage>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Display Name */}
            <FormField
              id="displayName"
              label="Display Name"
              error={fieldErrors.displayName}
              required
            >
              {({ errorClass, ...ariaProps }) => (
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    ref={nameInputRef}
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('displayName')}
                    className={`input pl-12 ${errorClass}`}
                    placeholder="How should we call you?"
                    autoComplete="name"
                    {...ariaProps}
                  />
                </div>
              )}
            </FormField>

            {/* Email */}
            <FormField
              id="email"
              label="Email"
              error={fieldErrors.email}
              required
            >
              {({ errorClass, ...ariaProps }) => (
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    className={`input pl-12 ${errorClass}`}
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...ariaProps}
                  />
                </div>
              )}
            </FormField>

            {/* Password */}
            <FormField
              id="password"
              label="Password"
              error={fieldErrors.password}
              required
            >
              {({ errorClass, ...ariaProps }) => (
                <>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur('password')}
                      className={`input pl-12 pr-12 ${errorClass}`}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      {...ariaProps}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text transition-colors rounded-md hover:bg-gray-100"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {formData.password && (
                    <div className="mt-2 animate-fade-in" aria-live="polite">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={passwordStrength.strength} aria-valuemin="0" aria-valuemax="5" aria-label="Password strength">
                          <div 
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${passwordStrength.textColor}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-1">
                        Use 8+ characters with uppercase, numbers, and symbols for a strong password.
                      </p>
                    </div>
                  )}
                </>
              )}
            </FormField>

            {/* Confirm Password */}
            <FormField
              id="confirmPassword"
              label="Confirm Password"
              error={fieldErrors.confirmPassword}
              required
            >
              {({ errorClass, ...ariaProps }) => (
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`input pl-12 pr-12 ${errorClass}`}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    {...ariaProps}
                  />
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-success" aria-label="Passwords match">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </FormField>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5 border-white border-t-transparent" aria-hidden="true" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Terms notice */}
          <p className="text-xs text-text-muted text-center mt-4 leading-relaxed">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>

          {/* Divider */}
          <div className="relative my-6">
            <div className="divider" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-text-muted">
              or
            </span>
          </div>

          {/* Login Link */}
          <p className="text-center text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-dark font-semibold transition-colors">
              Log In
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <p className="text-center mt-6">
          <Link to="/" className="text-sm text-text-muted hover:text-text transition-colors inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
