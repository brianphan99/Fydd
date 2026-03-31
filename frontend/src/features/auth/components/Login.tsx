import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../api';
import { AuthContext } from '../../../AuthContext';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const res = await api.post('login/google/', { token: credentialResponse.credential });
      login(res.data.access, res.data.refresh);
      toast.success('Welcome back');
      navigate('/');
    } catch (err: any) {
      toast.error('Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('token/', { username, password });
      login(res.data.access, res.data.refresh);
      toast.success('Welcome back');
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Invalid username or password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md animate-in fade-in duration-700">
        <h1 className="text-4xl font-bold mb-12 text-black tracking-tighter uppercase">Sign In</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.3em] mb-2 text-gray-400">Username or Email</label>
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
            <div className="flex justify-between items-end mb-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Password</label>
              <Link to="/forgot-password" size="sm" className="text-[8px] font-bold uppercase tracking-widest text-black hover:underline underline-offset-4">Forgot?</Link>
            </div>
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
            {isLoading ? 'Processing...' : 'Enter'}
          </button>
        </form>
        
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center w-full gap-4">
            <div className="h-[1px] bg-gray-100 flex-1" />
            <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">OR</span>
            <div className="h-[1px] bg-gray-100 flex-1" />
          </div>
          
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google Login Failed')}
              useOneTap
              theme="outline"
              size="large"
              width="100%"
            />
          </div>
        </div>

        <p className="mt-12 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          No account? <Link to="/register" className="text-black underline underline-offset-4 hover:text-gray-600 transition-colors">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
