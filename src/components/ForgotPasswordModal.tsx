import { useState } from 'react';
import { X, Mail, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

interface ForgotPasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim() });
      if (response.data.success) {
        setSuccess('OTP has been sent to your email. Please check your inbox.');
        setStep('otp');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length !== 4) {
      setError('Please enter a valid 4-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/auth/verify-otp', {
        email: email.trim(),
        otp: otp.trim(),
      });
      if (response.data.success) {
        setSuccess('OTP verified successfully');
        setStep('reset');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword: newPassword.trim(),
      });
      if (response.data.success) {
        setSuccess('Password reset successfully! You can now login with your new password.');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'email' && 'Enter your email to receive OTP'}
              {step === 'otp' && 'Enter the 4-digit OTP sent to your email'}
              {step === 'reset' && 'Enter your new password'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Step 1: Email */}
        {step === 'email' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label-field">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              onClick={handleSendOtp}
              disabled={loading || !email.trim()}
              className="btn-primary w-full"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="otp" className="label-field">
                4-Digit OTP <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setOtp(value);
                  }}
                  className="input-field pl-10 text-center text-2xl tracking-widest font-mono"
                  placeholder="0000"
                  maxLength={4}
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Check your email for the 4-digit code
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError(null);
                }}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 4}
                className="btn-primary flex-1"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="label-field">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter new password (min 6 characters)"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label-field">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Confirm new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('otp');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError(null);
                }}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleResetPassword}
                disabled={loading || !newPassword.trim() || newPassword !== confirmPassword}
                className="btn-primary flex-1"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 hover:text-gray-900 w-full text-center"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;

