import React from 'react';
import { LayoutGrid, Loader2, Rss, Search, X } from 'lucide-react';
import { Feed } from '../../../types';

interface FeedSidebarProps {
  feeds: Feed[];
  selectedFeed: Feed | null;
  onSelectFeed: (feed: Feed | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  markingReadId: number | 'all' | null;
  onContextMenu: (e: React.MouseEvent, feedId: number | null) => void;
}

const FeedSidebar: React.FC<FeedSidebarProps> = ({
  feeds,
  selectedFeed,
  onSelectFeed,
  searchQuery,
  onSearchChange,
  sidebarOpen,
  onCloseSidebar,
  markingReadId,
  onContextMenu,
}) => {
  const filteredFeeds = feeds.filter(f => 
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`fixed lg:static inset-0 z-40 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 bg-white border-r border-black/5 flex flex-col w-64 h-full shrink-0`}>
      <div className="p-6 border-b border-black/5 flex justify-between items-center lg:hidden">
        <h2 className="text-sm font-bold tracking-widest uppercase">Sources</h2>
        <button onClick={onCloseSidebar} className="p-2 cursor-pointer"><X size={18} /></button>
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-2 bg-gray-50 p-2 border border-black/5">
          <Search size={12} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-[10px] uppercase tracking-widest w-full font-bold"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-1 pb-64">
        <button 
          onClick={() => { onSelectFeed(null); onCloseSidebar(); }}
          onContextMenu={(e) => onContextMenu(e, null)}
          className={`w-full text-left p-3 transition-all flex justify-between items-center cursor-pointer ${!selectedFeed ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-500'}`}
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest">All Feeds</span>
            {markingReadId === 'all' && (
              <span className="text-[8px] font-black flex items-center gap-1 animate-pulse opacity-20">
                <Loader2 size={8} className="animate-spin" /> LOADING...
              </span>
            )}
          </div>
          <LayoutGrid size={14} />
        </button>
        <div className="pt-4 pb-2 text-[8px] font-bold text-gray-300 uppercase tracking-[0.3em] px-3">Your Feeds</div>
        {filteredFeeds.map(feed => (
          <button 
            key={feed.id}
            onClick={() => { onSelectFeed(feed); onCloseSidebar(); }}
            onContextMenu={(e) => onContextMenu(e, feed.id)}
            className={`w-full text-left p-3 transition-all flex justify-between items-center cursor-pointer ${selectedFeed?.id === feed.id ? 'bg-black text-white font-bold' : 'hover:bg-gray-50 text-gray-500 font-bold'}`}
          >
            <div className="flex flex-col truncate mr-2">
              <span className="text-[10px] uppercase tracking-widest truncate">{feed.title}</span>
              {markingReadId === feed.id ? (
                <span className={`text-[8px] font-black flex items-center gap-1 animate-pulse ${selectedFeed?.id === feed.id ? 'text-white/20' : 'text-black/20'}`}>
                  <Loader2 size={8} className="animate-spin" /> LOADING...
                </span>
              ) : (feed as any).unread_count > 0 && (
                <span className={`text-[8px] font-black ${selectedFeed?.id === feed.id ? 'text-white/50' : 'text-black/30'}`}>{(feed as any).unread_count} UNREAD</span>
              )}
            </div>
            <Rss size={12} className="shrink-0 opacity-50" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default FeedSidebar;
