import useDocumentTitle from '../hooks/useDocumentTitle';
import { ChevronLeft } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AlertMessage from '../components/AlertMessage';
import FormField from '../components/FormField';

export default function ForgotPassword() {
  useDocumentTitle('Forgot Password');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [success, setSuccess] = useState(false);
  const emailInputRef = useRef(null);

  // Auto-focus email input on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle blur validation
  const handleBlur = () => {
    if (!email) {
      setFieldError('Email is required');
    } else if (!validateEmail(email)) {
      setFieldError('Please enter a valid email address');
    } else {
      setFieldError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldError('');
    setSuccess(false);

    if (!email) {
      setFieldError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setFieldError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err) {
      if (err.message?.includes('rate limit')) {
        setError('Too many requests. Please wait a few minutes and try again.');
      } else {
        setError(err.message || 'Failed to send reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-8 sm:py-12 px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
              <span className="font-bold text-4xl tracking-tight leading-none text-[#1A1A1A]">
                <span className="text-[#C8622A]">G</span>Markt
              </span>
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">
            Reset your password
          </h1>
          <p className="text-text-secondary">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {/* Card */}
        <div className="card-static p-6 sm:p-8">
          {success ? (
            <div className="text-center animate-fade-in" role="status" aria-live="polite">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text mb-2">Check your email</h3>
              <p className="text-text-secondary mb-6">
                We've sent a password reset link to <strong>{email}</strong>. 
                Please check your inbox and spam folder.
              </p>
              <Link to="/login" className="btn-primary w-full py-3">
                Back to Login
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
                {/* Email */}
                <FormField
                  id="email"
                  label="Email address"
                  error={fieldError}
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
                        ref={emailInputRef}
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldError) setFieldError('');
                        }}
                        onBlur={handleBlur}
                        className={`input pl-12 ${errorClass}`}
                        placeholder="you@example.com"
                        autoComplete="email"
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
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Back to Login Link */}
          {!success && (
            <>
              <div className="relative my-6">
                <div className="divider" />
              </div>
              <p className="text-center text-text-secondary">
                Remember your password?{' '}
                <Link to="/login" className="text-primary hover:text-primary-dark font-semibold transition-colors">
                  Back to Login
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Back to Home */}
        <p className="text-center mt-6">
          <Link to="/" className="text-sm text-text-muted hover:text-text transition-colors inline-flex items-center gap-1 min-h-[44px] justify-center">
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
