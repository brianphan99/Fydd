import React, { useState } from 'react';
import { Loader2, Plus, Check, X } from 'lucide-react';
import { DiscoveredFeed } from '../../../services/feedService';
import { useFeeds } from '../../../hooks/useFeeds';

const AddFeedForm: React.FC = () => {
  const [url, setUrl] = useState('');
  const [discoveredFeeds, setDiscoveredFeeds] = useState<DiscoveredFeed[]>([]);
  const { discoverFeeds, isDiscovering, addFeed, deleteFeed, isAdding, isDeleting } = useFeeds();

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    const feeds = await discoverFeeds(url);
    setDiscoveredFeeds(feeds);
  };

  const handleFollow = async (feed: DiscoveredFeed) => {
    await addFeed({ title: feed.title, url: feed.url });
    // Update local state to show "Followed"
    setDiscoveredFeeds(prev => prev.map(f => 
      f.url === feed.url ? { ...f, is_followed: true } : f
    ));
  };

  const handleUnfollow = async (feed: DiscoveredFeed) => {
    if (!feed.id) {
      // If we don't have the ID, we might need to find it from the main feeds list
      // but the discovery endpoint should ideally provide it if it's already followed
      return;
    }
    await deleteFeed(feed.id);
    setDiscoveredFeeds(prev => prev.map(f => 
      f.url === feed.url ? { ...f, is_followed: false, id: undefined } : f
    ));
  };

  return (
    <section className="bg-theme-primary pb-10 transition-colors">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-gray-400">Add Feed</h2>
      <form onSubmit={handleDiscover} className="flex flex-col md:flex-row gap-6 p-6 border border-black/10 bg-theme-primary shadow-lg mb-8 rounded-sm">
        <input 
          type="url" 
          placeholder="PASTE WEBSITE OR FEED URL" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          className="flex-1 border-b border-black/10 py-2 focus:outline-none text-xs tracking-widest bg-transparent" 
          required 
        />
        <button 
          type="submit" 
          disabled={isDiscovering}
          className={`bg-black text-white px-8 py-3 font-bold uppercase text-[10px] tracking-widest hover:bg-gray-800 transition-all cursor-pointer whitespace-nowrap flex items-center gap-3 rounded-sm ${isDiscovering ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isDiscovering ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Searching...
            </>
          ) : 'Search Feeds'}
        </button>
      </form>

      {discoveredFeeds.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest">Found {discoveredFeeds.length} feeds</h3>
            <button 
              onClick={() => setDiscoveredFeeds([])}
              className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-1"
            >
              Clear <X size={10} />
            </button>
          </div>
          <div className="grid gap-4">
            {discoveredFeeds.map((feed) => (
              <div key={feed.url} className="flex items-center justify-between p-6 border border-black/5 hover:border-black/20 transition-all group bg-gray-50/30 rounded-sm">
                <div className="flex flex-col gap-1 overflow-hidden mr-4">
                  <span className="font-black text-xs uppercase tracking-tighter truncate">{feed.title}</span>
                  <span className="text-[10px] text-gray-400 truncate font-mono">{feed.url}</span>
                </div>
                
                {feed.is_followed ? (
                  <button 
                    onClick={() => handleUnfollow(feed)}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-300 transition-all border border-transparent rounded-sm"
                  >
                    Unfollow
                  </button>
                ) : (
                  <button 
                    onClick={() => handleFollow(feed)}
                    disabled={isAdding}
                    className="flex items-center gap-2 px-6 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all border border-black rounded-sm"
                  >
                    Follow
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default AddFeedForm;
