import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../../api';
import toast from 'react-hot-toast';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const validatePassword = (pass: string) => {
    const hasUpper = /[A-Z]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const isLongEnough = pass.length >= 8;
    return { hasUpper, hasSpecial, isLongEnough };
  };

  const { hasUpper, hasSpecial, isLongEnough } = validatePassword(password);
  const isPasswordValid = hasUpper && hasSpecial && isLongEnough;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast.error('Password does not meet requirements');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!token) {
      toast.error('Invalid or missing token');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('password_reset/confirm/', { token, password });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (err: any) {
      toast.error('Failed to reset password. Token might be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md animate-in fade-in duration-700">
        <h1 className="text-4xl font-bold mb-12 text-black tracking-tighter uppercase">New Password</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] mb-2 text-gray-400">Enter New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b-2 border-black py-3 focus:outline-none focus:border-gray-300 transition-colors bg-transparent text-lg font-bold tracking-tight"
              required
              disabled={isLoading}
            />
            <div className="mt-4 space-y-1">
              <div className={`text-[8px] font-bold uppercase tracking-widest ${isLongEnough ? 'text-green-500' : 'text-gray-300'}`}>• At least 8 characters</div>
              <div className={`text-[8px] font-bold uppercase tracking-widest ${hasUpper ? 'text-green-500' : 'text-gray-300'}`}>• One uppercase letter</div>
              <div className={`text-[8px] font-bold uppercase tracking-widest ${hasSpecial ? 'text-green-500' : 'text-gray-300'}`}>• One special character</div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] mb-2 text-gray-400">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border-b-2 border-black py-3 focus:outline-none focus:border-gray-300 transition-colors bg-transparent text-lg font-bold tracking-tight"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !isPasswordValid}
            className={`w-full bg-black text-white py-4 font-bold uppercase tracking-[0.2em] text-xs hover:bg-gray-900 transition-all shadow-lg active:scale-95 ${(isLoading || !isPasswordValid) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Processing...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
