import React from 'react';
import { Bookmark, LayoutGrid, Rss, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'articles', icon: LayoutGrid, label: 'Articles' },
    { id: 'saved', icon: Bookmark, label: 'Saved' },
    { id: 'feeds', icon: Rss, label: 'Feeds' },
    { id: 'settings', icon: Settings, label: 'Config' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-theme-primary border-t border-black/10 flex justify-around items-center p-4 z-50 shadow-xl transition-colors">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button 
          key={id}
          onClick={() => onTabChange(id)} 
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === id ? 'text-theme-primary scale-110' : 'text-gray-300'}`}
        >
          <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 2} />
          <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
