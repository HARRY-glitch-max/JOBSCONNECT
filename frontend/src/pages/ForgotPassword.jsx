// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get role from URL query parameter (default: jobseeker)
  const role = searchParams.get('role') || 'jobseeker';
  
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Role-based configuration
  const getRoleConfig = () => {
    switch(role) {
      case 'admin':
        return {
          title: 'Admin Password Reset',
          subtitle: 'Enter your admin email to receive a password reset link',
          buttonText: 'Send Reset Link to Admin',
          successMessage: 'Password reset link sent to your admin email!',
          redirectPath: '/admin-login',
          icon: '👨‍💼',
          color: 'purple'
        };
      case 'employer':
        return {
          title: 'Employer Password Reset',
          subtitle: 'Enter your employer email to receive a password reset link',
          buttonText: 'Send Reset Link to Employer',
          successMessage: 'Password reset link sent to your employer email!',
          redirectPath: '/employer-login',
          icon: '🏢',
          color: 'blue'
        };
      case 'jobseeker':
      default:
        return {
          title: 'Job Seeker Password Reset',
          subtitle: 'Enter your email address to receive a password reset link',
          buttonText: 'Send Reset Link',
          successMessage: 'Password reset link sent to your email address!',
          redirectPath: '/login',
          icon: '👤',
          color: 'green'
        };
    }
  };

  const config = getRoleConfig();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Call the unified forgotPassword function from api.js
      const response = await forgotPassword(email, role);
      
      setEmailSent(true);
      setMessage(response.data.message || config.successMessage);
      
      // Clear email field
      setEmail('');
      
    } catch (err) {
      console.error('Forgot password error:', err);
      
      // Handle different error scenarios
      if (err.response?.status === 404) {
        setError('No account found with this email address');
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid request. Please check your email.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Color scheme based on role
  const getColorScheme = () => {
    switch(config.color) {
      case 'purple':
        return {
          bg: 'bg-purple-600',
          hover: 'hover:bg-purple-700',
          focus: 'focus:ring-purple-500',
          text: 'text-purple-600',
          border: 'border-purple-300'
        };
      case 'blue':
        return {
          bg: 'bg-blue-600',
          hover: 'hover:bg-blue-700',
          focus: 'focus:ring-blue-500',
          text: 'text-blue-600',
          border: 'border-blue-300'
        };
      default:
        return {
          bg: 'bg-green-600',
          hover: 'hover:bg-green-700',
          focus: 'focus:ring-green-500',
          text: 'text-green-600',
          border: 'border-green-300'
        };
    }
  };

  const colors = getColorScheme();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Icon and Title */}
        <div className="text-center">
          <div className="text-6xl mb-4">{config.icon}</div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {config.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {config.subtitle}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* Success Message */}
          {emailSent && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{message}</p>
                  <p className="mt-1 text-xs text-green-700">
                    Please check your email inbox (and spam folder) for the reset link.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !emailSent && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Forgot Password Form */}
          {!emailSent && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 ${colors.focus} focus:border-transparent sm:text-sm`}
                    placeholder="you@example.com"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  We'll send a password reset link to this email address
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${colors.bg} ${colors.hover} focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.focus} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    config.buttonText
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Additional Information */}
          {emailSent && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the email? Check your spam folder or
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setMessage('');
                  }}
                  className={`ml-1 font-medium ${colors.text} hover:underline focus:outline-none`}
                >
                  try again
                </button>
              </p>
            </div>
          )}

          {/* Back to Login Link */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Remember your password?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to={config.redirectPath}
                className={`text-sm font-medium ${colors.text} hover:underline focus:outline-none`}
              >
                Back to {role === 'admin' ? 'Admin' : role === 'employer' ? 'Employer' : 'Job Seeker'} Login
              </Link>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Need help? Contact support at{' '}
              <a href="mailto:support@jobconnect.com" className="text-blue-600 hover:underline">
                support@jobconnect.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;