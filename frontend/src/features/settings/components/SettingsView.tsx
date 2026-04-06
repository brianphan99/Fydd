import React, { useEffect } from 'react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { User } from '../../../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, UserSettings } from '../../../services/settingsService';
import toast from 'react-hot-toast';

interface SettingsViewProps {
  user: User | null;
  onLogout: () => Promise<void>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onLogout }) => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<UserSettings>) => settingsService.updateSettings(newSettings),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated);
      if (updated.dark_mode) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    },
    onError: () => {
      toast.error('Failed to update settings');
    }
  });

  // Apply theme on load
  useEffect(() => {
    if (settings) {
      if (settings.dark_mode) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
  }, [settings]);

  const toggleDarkMode = () => {
    if (!settings) return;
    updateSettingsMutation.mutate({ dark_mode: !settings.dark_mode });
  };

  return (
    <div className="max-w-md animate-in slide-in-from-right-10 duration-500 space-y-12 pb-64">
      <header className="mb-16">
        <h1 className="text-5xl font-black uppercase tracking-tighter border-b-8 border-black pb-2 inline-block">
          {user?.display_name || user?.username || 'Profile'}
        </h1>
      </header>

      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-gray-400">Preferences</h2>
        <div className="space-y-4">
          <button 
            onClick={toggleDarkMode}
            disabled={isLoading || updateSettingsMutation.isPending}
            className="w-full flex items-center justify-between border-2 border-black p-6 font-bold uppercase tracking-[0.2em] text-xs hover:bg-black hover:text-white transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              {settings?.dark_mode ? <Moon size={20} /> : <Sun size={20} />}
              <span>Dark Mode</span>
            </div>
            <div className={`w-12 h-6 border-2 border-black relative transition-all ${settings?.dark_mode ? 'bg-black' : 'bg-white'}`}>
              <div className={`absolute top-1 w-2 h-2 transition-all ${settings?.dark_mode ? 'right-1 bg-white' : 'left-1 bg-black'}`} />
            </div>
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-gray-400">Account</h2>
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
