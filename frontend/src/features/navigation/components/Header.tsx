import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onOpenSidebar: () => void;
  activeTab: string;
  selectedFeedTitle?: string;
}

const Header: React.FC<HeaderProps> = ({ onOpenSidebar, activeTab, selectedFeedTitle }) => {
  const getTabLabel = () => {
    switch (activeTab) {
      case 'articles': return selectedFeedTitle || 'ALL FEEDS';
      case 'feeds': return 'LIBRARY';
      case 'saved': return 'SAVED';
      case 'settings': return 'CONFIG';
      default: return 'FYDD';
    }
  };

  return (
    <nav className="border-b border-black/10 p-6 flex justify-between items-center bg-theme-primary z-40 shrink-0 transition-colors">
      <div className="flex items-center gap-4">
        <button onClick={onOpenSidebar} className="lg:hidden p-1 cursor-pointer"><Menu size={20} /></button>
        <h1 className="text-3xl font-bold tracking-tighter uppercase">FYDD</h1>
      </div>
      <span className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-gray-300">
        {getTabLabel()}
      </span>
    </nav>
  );
};

export default Header;
