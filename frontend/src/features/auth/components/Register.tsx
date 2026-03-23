import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../api';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('register/', { username, password });
      toast.success('Registration successful. Please sign in.');
      navigate('/login');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Registration failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md animate-in fade-in duration-700">
        <h1 className="text-4xl font-bold mb-12 text-black tracking-tighter uppercase">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] mb-2 text-gray-400">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-b-2 border-black py-3 focus:outline-none focus:border-gray-300 transition-colors bg-transparent text-lg font-bold uppercase tracking-tight"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] mb-2 text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b-2 border-black py-3 focus:outline-none focus:border-gray-300 transition-colors bg-transparent text-lg font-bold tracking-tight"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-black text-white py-4 font-bold uppercase tracking-[0.2em] text-xs hover:bg-gray-900 transition-all shadow-lg active:scale-95 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Processing...' : 'Create Account'}
          </button>
        </form>
        <p className="mt-12 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          Already have an account? <Link to="/login" className="text-black underline underline-offset-4 hover:text-gray-600 transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
