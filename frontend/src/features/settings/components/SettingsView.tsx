import React from 'react';
import { LogOut } from 'lucide-react';
import { User } from '../../../types';

interface SettingsViewProps {
  user: User | null;
  onLogout: () => Promise<void>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onLogout }) => {
  return (
    <div className="max-w-md animate-in slide-in-from-right-10 duration-500 space-y-12 pb-64">
      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-gray-400">Account</h2>
        <div className="border-l-4 border-black pl-8 py-8 mb-8">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">User</span>
          <p className="text-3xl font-bold uppercase tracking-tight">{user?.username}</p>
        </div>
        <button 
          onClick={onLogout} 
          className="w-full flex items-center justify-between border-2 border-black p-6 font-bold uppercase tracking-[0.2em] text-xs hover:bg-black hover:text-white transition-all cursor-pointer group"
        >
          Sign Out <LogOut size={20} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </section>
    </div>
  );
};

export default SettingsView;
