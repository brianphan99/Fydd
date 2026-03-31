import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../api';
import toast from 'react-hot-toast';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('password_reset/', { email });
      setIsSent(true);
      toast.success('Reset link sent to your email');
    } catch (err: any) {
      toast.error('Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="w-full max-w-md animate-in fade-in duration-700">
          <h1 className="text-4xl font-bold mb-8 text-black tracking-tighter uppercase">Check Email</h1>
          <p className="text-lg text-gray-600 mb-12 uppercase tracking-tight font-bold">
            We've sent a password reset link to <span className="text-black">{email}</span>.
          </p>
          <Link to="/login" className="w-full block text-center bg-black text-white py-4 font-bold uppercase tracking-[0.2em] text-xs hover:bg-gray-900 transition-all shadow-lg active:scale-95">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md animate-in fade-in duration-700">
        <h1 className="text-4xl font-bold mb-12 text-black tracking-tighter uppercase">Reset Password</h1>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-12">
          Enter your email and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] mb-2 text-gray-400">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b-2 border-black py-3 focus:outline-none focus:border-gray-300 transition-colors bg-transparent text-lg font-bold uppercase tracking-tight"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-black text-white py-4 font-bold uppercase tracking-[0.2em] text-xs hover:bg-gray-900 transition-all shadow-lg active:scale-95 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="mt-12 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          Remember your password? <Link to="/login" className="text-black underline underline-offset-4 hover:text-gray-600 transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
