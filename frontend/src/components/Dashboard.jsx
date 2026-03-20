import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { LogOut, Plus, Trash2, ExternalLink, ChevronLeft, BookOpen, ArrowLeft, Settings, LayoutGrid, Rss, Search, Edit2, Check, X, Menu, Type, Loader2 } from 'lucide-react';
import api from '../api';
import { AuthContext } from '../AuthContext';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('articles'); // 'articles', 'feeds', 'settings'
  const [feeds, setFeeds] = useState([]);
  const [newFeed, setNewFeed] = useState({ title: '', url: '' });
  const [selectedFeed, setSelectedFeed] = useState(null);
  
  // Articles & Pagination
  const [articles, setArticles] = useState([]);
  const [feedTitle, setFeedTitle] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Search & Edit states
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFeedId, setEditingFeedId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', url: '' });
  
  const { user, logout } = useContext(AuthContext);
  const scrollRef = useRef(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'RECENT';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).toUpperCase();
    } catch (e) {
      return dateStr;
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  useEffect(() => {
    if (activeTab === 'articles') {
      resetAndFetchArticles();
    }
  }, [activeTab, selectedFeed]);

  const fetchFeeds = async () => {
    try {
      const res = await api.get('feeds/');
      setFeeds(res.data);
    } catch (err) {
      console.error('Failed to fetch feeds');
    }
  };

  const resetAndFetchArticles = async () => {
    setArticles([]);
    setOffset(0);
    setHasMore(true);
    fetchArticles(0, true);
  };

  const fetchArticles = async (currentOffset, isInitial = false) => {
    if (isInitial) setLoadingContent(true);
    else setLoadingMore(true);

    try {
      const endpoint = selectedFeed 
        ? `feeds/${selectedFeed.id}/content/?offset=${currentOffset}`
        : `feeds/all-content/?offset=${currentOffset}`;
      
      const res = await api.get(endpoint);
      
      setArticles(prev => isInitial ? res.data.entries : [...prev, ...res.data.entries]);
      setFeedTitle(res.data.title);
      setHasMore(res.data.has_more);
      setOffset(currentOffset + 10);
    } catch (err) {
      console.error('Failed to fetch articles');
    } finally {
      setLoadingContent(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && !loadingMore && hasMore && !loadingContent) {
      fetchArticles(offset);
    }
  };

  const handleAddFeed = async (e) => {
    e.preventDefault();
    try {
      await api.post('feeds/', newFeed);
      setNewFeed({ title: '', url: '' });
      fetchFeeds();
    } catch (err) {
      alert('Failed to add feed');
    }
  };

  const handleDeleteFeed = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this feed?')) return;
    try {
      await api.delete(`feeds/${id}/`);
      fetchFeeds();
      if (selectedFeed?.id === id) setSelectedFeed(null);
    } catch (err) {
      alert('Failed to delete feed');
    }
  };

  const handleStartEdit = (feed, e) => {
    e.stopPropagation();
    setEditingFeedId(feed.id);
    setEditForm({ title: feed.title, url: feed.url });
  };

  const handleSaveEdit = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`feeds/${id}/`, editForm);
      setEditingFeedId(null);
      fetchFeeds();
    } catch (err) {
      alert('Failed to update feed');
    }
  };

  const handleSelectFeed = (feed) => {
    if (editingFeedId) return;
    setSelectedFeed(feed);
    setSelectedArticle(null);
    setSidebarOpen(false);
  };

  const filteredFeeds = useMemo(() => {
    return feeds.filter(f => 
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.url.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [feeds, searchQuery]);

  // Sidebar Component
  const Sidebar = () => (
    <div className={`fixed lg:static inset-0 z-40 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 bg-white border-r border-black/5 flex flex-col w-64 h-full shrink-0`}>
      <div className="p-6 border-b border-black/5 flex justify-between items-center lg:hidden">
        <h2 className="text-sm font-bold tracking-widest uppercase">Sources</h2>
        <button onClick={() => setSidebarOpen(false)} className="p-2 cursor-pointer"><X size={18} /></button>
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-2 bg-gray-50 p-2 border border-black/5">
          <Search size={12} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-[10px] uppercase tracking-widest w-full font-bold"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-1 pb-64">
        <button 
          onClick={() => { setSelectedFeed(null); setSidebarOpen(false); }}
          className={`w-full text-left p-3 transition-all flex justify-between items-center cursor-pointer ${!selectedFeed ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-500'}`}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest">Aggregated</span>
          <LayoutGrid size={14} />
        </button>
        <div className="pt-4 pb-2 text-[8px] font-bold text-gray-300 uppercase tracking-[0.3em] px-3">Your Feeds</div>
        {filteredFeeds.map(feed => (
          <button 
            key={feed.id}
            onClick={() => handleSelectFeed(feed)}
            className={`w-full text-left p-3 transition-all flex justify-between items-center cursor-pointer ${selectedFeed?.id === feed.id ? 'bg-black text-white font-bold' : 'hover:bg-gray-50 text-gray-500 font-bold'}`}
          >
            <span className="text-[10px] uppercase tracking-widest truncate mr-2">{feed.title}</span>
            <Rss size={12} className="shrink-0 opacity-50" />
          </button>
        ))}
      </div>
    </div>
  );

  // Article Detail View
  if (selectedArticle) {
    return (
      <div className="h-screen bg-white text-black font-sans flex flex-col">
        <nav className="border-b border-black p-6 flex justify-between items-center bg-white z-40 shrink-0">
          <button 
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 hover:text-gray-400 transition-colors uppercase text-xs font-bold tracking-widest cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">PR FYDD • READ</div>
          <div className="w-16"></div>
        </nav>
        <main className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar pb-48">
          <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-6">{selectedArticle.feed_title} • {formatDate(selectedArticle.published)}</span>
            <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight leading-tight mb-12">{selectedArticle.title || 'Untitled Article'}</h1>
            <div 
              className="text-gray-800 text-lg leading-relaxed mb-16 prose prose-lg max-w-none prose-p:mb-6 prose-a:text-black prose-a:font-bold prose-img:mx-auto prose-img:my-12"
              dangerouslySetInnerHTML={{ __html: selectedArticle.summary }}
            />
            <a href={selectedArticle.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all cursor-pointer shadow-lg active:scale-95">Original Source <ExternalLink size={14} /></a>
            <div className="h-32" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white text-black font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <nav className="border-b border-black p-6 flex justify-between items-center bg-white z-40 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 cursor-pointer"><Menu size={20} /></button>
          <h1 className="text-3xl font-bold tracking-tighter uppercase">PR FYDD</h1>
        </div>
        <span className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-gray-300">
          {activeTab === 'articles' ? (selectedFeed ? selectedFeed.title : 'AGGREGATED') : activeTab === 'feeds' ? 'LIBRARY' : 'CONFIG'}
        </span>
      </nav>

      <div className="flex flex-1 relative overflow-hidden">
        {activeTab === 'articles' && <Sidebar />}

        <main onScroll={activeTab === 'articles' ? handleScroll : undefined} className="flex-1 overflow-y-auto no-scrollbar">
          <div className="max-w-4xl mx-auto p-6 md:p-12 pb-64">
            {/* Tab Content: Articles */}
            {activeTab === 'articles' && (
              <div>
                <div className="flex justify-between items-end mb-12 pb-4 border-b border-black/5">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                    {selectedFeed ? 'SOURCE: ' + selectedFeed.title : 'AGGREGATED STREAM'}
                  </h2>
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                    {articles.length} LOADED
                  </span>
                </div>

                {loadingContent ? (
                  <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                    <div className="w-12 h-1 bg-black mb-4"></div>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold">Syncing...</p>
                  </div>
                ) : articles.length === 0 ? (
                  <div className="py-24 text-center">
                    <p className="text-sm italic text-gray-300 uppercase tracking-widest">No Content Found.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {articles.map((entry, idx) => (
                      <div key={idx} onClick={() => setSelectedArticle(entry)} className="group cursor-pointer py-10 px-6 border-b border-gray-100 hover:border-black transition-all duration-300 flex justify-between items-center gap-10">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-[10px] font-bold text-black border border-black px-2 py-0.5 uppercase tracking-widest truncate max-w-[120px]">{entry.feed_title}</span>
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{formatDate(entry.published)}</span>
                          </div>
                          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight leading-tight group-hover:translate-x-2 transition-transform duration-500">{entry.title || 'Untitled'}</h2>
                        </div>
                      </div>
                    ))}
                    
                    {loadingMore && (
                      <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-gray-200" size={24} />
                      </div>
                    )}
                    
                    {!hasMore && articles.length > 0 && (
                      <p className="text-center py-12 text-[10px] font-bold text-gray-200 uppercase tracking-[0.5em]">End of Stream</p>
                    )}
                    
                    <div className="h-32" />
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Feeds List */}
            {activeTab === 'feeds' && (
              <div className="animate-in slide-in-from-right-10 duration-500">
                <div className="sticky -top-12 bg-white z-30 pt-2 pb-8 border-b border-black/5 mb-8">
                  <section className="bg-white pb-10">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-gray-400">Add Feed</h2>
                    <form onSubmit={handleAddFeed} className="flex flex-col md:flex-row gap-6 p-6 border-2 border-black bg-white shadow-lg">
                      <input type="text" placeholder="TITLE" value={newFeed.title} onChange={(e) => setNewFeed({ ...newFeed, title: e.target.value })} className="flex-1 border-b border-black py-2 focus:outline-none uppercase text-xs tracking-widest font-bold" required />
                      <input type="url" placeholder="URL" value={newFeed.url} onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })} className="flex-1 border-b border-black py-2 focus:outline-none text-xs tracking-widest" required />
                      <button type="submit" className="bg-black text-white px-8 py-3 font-bold uppercase text-[10px] tracking-widest hover:bg-gray-800 transition-all cursor-pointer whitespace-nowrap">Connect</button>
                    </form>
                  </section>
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-2">
                    <div className="flex items-center gap-4 flex-1 w-full py-2">
                      <Search size={16} className="text-gray-300" />
                      <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none focus:outline-none text-xs uppercase tracking-widest w-full font-bold" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 whitespace-nowrap">{filteredFeeds.length} FEEDS</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {filteredFeeds.map((feed) => (
                    <div key={feed.id} className={`group border-2 transition-all p-6 flex flex-col md:flex-row justify-between items-center gap-6 ${editingFeedId === feed.id ? 'border-black bg-gray-50' : 'border-gray-50 hover:border-black'}`}>
                      <div className="flex items-center gap-6 flex-1 w-full">
                        <div className={`w-10 h-10 border flex items-center justify-center transition-all ${editingFeedId === feed.id ? 'bg-black text-white' : 'border-black group-hover:bg-black group-hover:text-white'}`}><Rss size={16} /></div>
                        {editingFeedId === feed.id ? (
                          <div className="flex-1 space-y-4">
                            <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full border-b border-black bg-transparent py-1 text-xl font-bold uppercase tracking-tight focus:outline-none" />
                            <input value={editForm.url} onChange={e => setEditForm({...editForm, url: e.target.value})} className="w-full border-b border-black bg-transparent py-1 text-[10px] uppercase tracking-widest focus:outline-none" />
                          </div>
                        ) : (
                          <div className="flex-1 truncate">
                            <h3 className="text-xl font-bold uppercase tracking-tight truncate">{feed.title}</h3>
                            <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-1 font-bold truncate">{feed.url}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {editingFeedId === feed.id ? (
                          <><button onClick={(e) => handleSaveEdit(feed.id, e)} className="p-3 text-green-600 cursor-pointer"><Check size={20} /></button><button onClick={(e) => { e.stopPropagation(); setEditingFeedId(null); }} className="p-3 text-red-600 cursor-pointer"><X size={20} /></button></>
                        ) : (
                          <><button onClick={(e) => handleStartEdit(feed, e)} className="p-3 text-gray-300 hover:text-black cursor-pointer"><Edit2 size={16} /></button><button onClick={(e) => handleDeleteFeed(feed.id, e)} className="p-3 text-gray-300 hover:text-red-600 cursor-pointer"><Trash2 size={16} /></button></>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="h-32" />
                </div>
              </div>
            )}

            {/* Tab Content: Settings */}
            {activeTab === 'settings' && (
              <div className="max-w-md animate-in slide-in-from-right-10 duration-500 space-y-12 pb-64">
                <section>
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-gray-400">Account</h2>
                  <div className="border-l-4 border-black pl-8 py-8 mb-8">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">User</span>
                    <p className="text-3xl font-bold uppercase tracking-tight">{user?.username}</p>
                  </div>
                  <button onClick={logout} className="w-full flex items-center justify-between border-2 border-black p-6 font-bold uppercase tracking-[0.2em] text-xs hover:bg-black hover:text-white transition-all cursor-pointer group">
                    Sign Out <LogOut size={20} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </section>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black flex justify-around items-center p-4 z-50 shadow-2xl">
        <button onClick={() => { setActiveTab('articles'); setSelectedFeed(null); setSelectedArticle(null); }} className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'articles' ? 'text-black scale-110' : 'text-gray-300'}`}>
          <LayoutGrid size={24} strokeWidth={activeTab === 'articles' ? 2.5 : 2} />
          <span className="text-[8px] font-black uppercase tracking-widest">Articles</span>
        </button>
        <button onClick={() => { setActiveTab('feeds'); setSelectedFeed(null); setSelectedArticle(null); }} className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'feeds' ? 'text-black scale-110' : 'text-gray-300'}`}>
          <Rss size={24} strokeWidth={activeTab === 'feeds' ? 2.5 : 2} />
          <span className="text-[8px] font-black uppercase tracking-widest">Feeds</span>
        </button>
        <button onClick={() => { setActiveTab('settings'); setSelectedFeed(null); setSelectedArticle(null); }} className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'settings' ? 'text-black scale-110' : 'text-gray-300'}`}>
          <Settings size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
          <span className="text-[8px] font-black uppercase tracking-widest">Config</span>
        </button>
      </nav>
    </div>
  );
};

export default Dashboard;
