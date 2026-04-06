import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AlertMessage from '../components/AlertMessage';
import FormField from '../components/FormField';

export default function ResetPassword() {
  const navigate = useNavigate();
  const passwordInputRef = useRef(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  // Check for valid recovery session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check URL hash for recovery token (Supabase redirects with hash params)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (type !== 'recovery' && !session) {
        setIsValidToken(false);
      }
    };
    
    checkSession();
  }, []);

  // Auto-focus password input on mount
  useEffect(() => {
    if (isValidToken) {
      passwordInputRef.current?.focus();
    }
  }, [isValidToken]);

  // Password strength indicator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '', textColor: '' };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600' };
    if (score <= 3) return { score, label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    if (score <= 4) return { score, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600' };
    return { score, label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength(password);

  // Handle blur validation
  const handleBlur = (field) => {
    const errors = { ...fieldErrors };
    
    if (field === 'password') {
      if (!password) {
        errors.password = 'Password is required';
      } else if (password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else {
        delete errors.password;
      }
    }
    
    if (field === 'confirmPassword') {
      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      } else {
        delete errors.confirmPassword;
      }
    }
    
    setFieldErrors(errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate all fields
    const errors = {};
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      if (err.message?.includes('same as')) {
        setError('New password must be different from your current password');
      } else if (err.message?.includes('expired')) {
        setError('Reset link has expired. Please request a new one.');
        setIsValidToken(false);
      } else {
        setError(err.message || 'Failed to reset password');
      }
    } finally {
      setLoading(false);
    }
  };

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-8 sm:py-12 px-4">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="card-static p-6 sm:p-8 text-center" role="alert">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text mb-2">Invalid or Expired Link</h3>
            <p className="text-text-secondary mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link to="/forgot-password" className="btn-primary w-full py-3">
              Request New Link
            </Link>
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
            Create new password
          </h1>
          <p className="text-text-secondary">
            Enter a new password for your account
          </p>
        </div>

        {/* Card */}
        <div className="card-static p-6 sm:p-8">
          {success ? (
            <div className="text-center animate-fade-in" role="status" aria-live="polite">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text mb-2">Password Reset!</h3>
              <p className="text-text-secondary mb-6">
                Your password has been successfully reset. Redirecting to login...
              </p>
              <Link to="/login" className="btn-primary w-full py-3">
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="mb-6">
                  <AlertMessage variant="error" onDismiss={() => setError('')}>
                    {error}
                  </AlertMessage>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* New Password */}
                <FormField
                  id="password"
                  label="New Password"
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
                          ref={passwordInputRef}
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) {
                              setFieldErrors(prev => ({ ...prev, password: undefined }));
                            }
                          }}
                          onBlur={() => handleBlur('password')}
                          className={`input pl-12 pr-12 ${errorClass}`}
                          placeholder="Enter new password"
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
                      {password && (
                        <div className="mt-2 space-y-1" aria-live="polite">
                          <div className="flex gap-1" role="progressbar" aria-valuenow={passwordStrength.score} aria-valuemin="0" aria-valuemax="5" aria-label="Password strength">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`h-1 flex-1 rounded-full transition-colors ${
                                  level <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-text-secondary">
                            Password strength: <span className={`font-medium ${passwordStrength.textColor}`}>{passwordStrength.label}</span>
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (fieldErrors.confirmPassword) {
                            setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                          }
                        }}
                        onBlur={() => handleBlur('confirmPassword')}
                        className={`input pl-12 ${errorClass}`}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        {...ariaProps}
                      />
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
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
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
