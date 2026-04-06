import React, { useState, useContext, useEffect } from 'react';
import { Eye, EyeOff, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthContext } from '../AuthContext';
import { useFeeds } from '../hooks/useFeeds';
import { useArticles } from '../hooks/useArticles';
import { Feed, Article } from '../types';
import { useConfirmation } from '../ConfirmationContext';

// Components
import Header from '../features/navigation/components/Header';
import BottomNav from '../features/navigation/components/BottomNav';
import FeedSidebar from '../features/feeds/components/FeedSidebar';
import ArticleList from '../features/articles/components/ArticleList';
import ArticleDetail from '../features/articles/components/ArticleDetail';
import AddFeedForm from '../features/feeds/components/AddFeedForm';
import FeedList from '../features/feeds/components/FeedList';
import SettingsView from '../features/settings/components/SettingsView';

import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../services/settingsService';

const Dashboard = () => {
  const { confirm } = useConfirmation();
  const [activeTab, setActiveTab] = useState('articles');
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; feedId: number | null } | null>(null);
  const [markingReadId, setMarkingReadId] = useState<number | 'all' | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const { user, logout } = useContext(AuthContext);
  const { feeds, addFeed, deleteFeed, updateFeed, isAdding, isUpdating, isDeleting } = useFeeds();
  
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings()
  });

  const articleParams = {
    feed_id: selectedFeed?.id,
    unread_only: unreadOnly,
    offset: currentPage * ITEMS_PER_PAGE,
    type: activeTab === 'saved' ? 'saved' : 'all' as any,
  };

  const { 
    articles, 
    isLoading: articlesLoading, 
    hasMore, 
    saveArticle, 
    unsaveArticle, 
    markRead,
    markUnread,
    markFeedRead,
    refresh
  } = useArticles(articleParams);

  // Reset page when feed or unread filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedFeed?.id, unreadOnly, activeTab]);

  const formatDate = (dateStr: string) => {
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

  const handleToggleSave = async (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = (article as any).link || article.url;
    const isSaved = article.is_saved || (activeTab === 'saved');

    if (isSaved) {
      await unsaveArticle(link);
    } else {
      await saveArticle({
        feed_title: (article as any).feed_title || 'Feed',
        title: article.title,
        link: link,
        summary: article.summary,
        thumbnail: article.thumbnail,
        published: article.published_at || (article as any).published,
        timestamp: (article as any).timestamp || 0
      });
    }
  };

  const handleToggleRead = async (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = (article as any).link || article.url;
    const feedId = (article as any).feed_id || article.feed;
    
    if (article.is_read) {
      await markUnread(link);
    } else {
      await markRead({ link, feedId });
    }
  };

  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
    const link = article.url || (article as any).link;
    const feedId = article.feed || (article as any).feed_id;
    if (!article.is_read) {
      markRead({ link, feedId });
    }
  };

  const handleContextMenu = (e: React.MouseEvent, feedId: number | null) => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      feedId: feedId
    });
  };

  const handleMarkFeedAsReadAction = async (feedId: number | null) => {
    setMarkingReadId(feedId === null ? 'all' : feedId);
    setContextMenu(null);
    try {
      await markFeedRead(feedId);
    } finally {
      setMarkingReadId(null);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedFeed(null);
    setSelectedArticle(null);
  };

  const handleSelectFeedAction = (feed: Feed | null) => {
    if (selectedFeed?.id === feed?.id) {
      refresh();
    }
    setSelectedFeed(feed);
    setSelectedArticle(null);
  };

  const handleDeleteFeedAction = async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete Feed',
      message: 'Delete this feed and all its articles? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      isDestructive: true
    });

    if (!confirmed) return;
    
    setDeletingId(id);
    try {
      await deleteFeed(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (selectedArticle) {
    const isArticleSaved = selectedArticle.is_saved || activeTab === 'saved';
    return (
      <ArticleDetail 
        article={selectedArticle}
        isSaved={!!isArticleSaved}
        onClose={() => setSelectedArticle(null)}
        onToggleSave={handleToggleSave}
        formatDate={formatDate}
      />
    );
  }

  const PaginationControls = () => (
    <div className="flex items-center justify-between py-12 border-t border-black/5 mt-8">
      <button
        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
        disabled={currentPage === 0 || articlesLoading}
        className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 border transition-all ${
          currentPage === 0 || articlesLoading 
            ? 'text-gray-200 border-gray-100 cursor-not-allowed' 
            : 'text-black border-black hover:bg-black hover:text-white cursor-pointer'
        }`}
      >
        <ChevronLeft size={14} /> Previous
      </button>
      <span className="text-[10px] font-black uppercase tracking-[0.3em]">
        Page {currentPage + 1}
      </span>
      <button
        onClick={() => setCurrentPage(prev => prev + 1)}
        disabled={!hasMore || articlesLoading}
        className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 border transition-all ${
          !hasMore || articlesLoading
            ? 'text-gray-200 border-gray-100 cursor-not-allowed' 
            : 'text-black border-black hover:bg-black hover:text-white cursor-pointer'
        }`}
      >
        Next <ChevronRight size={14} />
      </button>
    </div>
  );

  return (
    <div className="h-screen bg-white text-black font-sans flex flex-col overflow-hidden" onClick={() => setContextMenu(null)}>
      <Header 
        onOpenSidebar={() => setSidebarOpen(true)} 
        activeTab={activeTab} 
        selectedFeedTitle={selectedFeed?.title}
      />

      <div className="flex flex-1 relative overflow-hidden">
        {activeTab === 'articles' && (
          <FeedSidebar 
            feeds={feeds}
            selectedFeed={selectedFeed}
            onSelectFeed={handleSelectFeedAction}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sidebarOpen={sidebarOpen}
            onCloseSidebar={() => setSidebarOpen(false)}
            markingReadId={markingReadId}
            onContextMenu={handleContextMenu}
          />
        )}

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {activeTab === 'articles' && (
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="max-w-4xl mx-auto p-6 md:p-12 pb-64">
                <div className="flex justify-between items-end mb-12 pb-4 border-b border-black/5">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                      {selectedFeed ? 'SOURCE: ' + selectedFeed.title : 'ALL FEEDS STREAM'}
                    </h2>
                    <div className="flex items-center border-2 border-black p-1 w-fit bg-white">
                      <button 
                        onClick={() => setUnreadOnly(true)}
                        className={`px-8 py-3 min-w-[100px] text-[10px] font-black uppercase tracking-widest transition-all ${unreadOnly ? 'bg-black text-white' : 'text-gray-300 hover:bg-gray-50 cursor-pointer'}`}
                      >
                        Unread
                      </button>
                      <button 
                        onClick={() => setUnreadOnly(false)}
                        className={`px-8 py-3 min-w-[100px] text-[10px] font-black uppercase tracking-widest transition-all ${!unreadOnly ? 'bg-black text-white' : 'text-gray-300 hover:bg-gray-50 cursor-pointer'}`}
                      >
                        All
                      </button>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                    PAGE {currentPage + 1}
                  </span>
                </div>

                <ArticleList 
                  articles={articles}
                  isLoading={articlesLoading}
                  isLoadingMore={false}
                  hasMore={hasMore}
                  onSelect={handleSelectArticle}
                  onToggleSave={handleToggleSave}
                  onToggleRead={handleToggleRead}
                  isSaved={(a) => !!a.is_saved}
                  formatDate={formatDate}
                />
                
                {articles.length > 0 && <PaginationControls />}
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="flex-1 overflow-y-auto no-scrollbar animate-in slide-in-from-right-10 duration-500">
              <div className="max-w-4xl mx-auto p-6 md:p-12 pb-64">
                <div className="flex justify-between items-end mb-12 pb-4 border-b border-black/5">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Saved for Later</h2>
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{articles.length} ARTICLES</span>
                </div>
                <ArticleList 
                  articles={articles}
                  isLoading={articlesLoading}
                  isLoadingMore={false}
                  hasMore={false}
                  onSelect={handleSelectArticle}
                  onToggleSave={handleToggleSave}
                  onToggleRead={handleToggleRead}
                  isSaved={() => true}
                  formatDate={formatDate}
                />
              </div>
            </div>
          )}

          {activeTab === 'feeds' && (
            <div className="flex-1 overflow-y-auto md:overflow-hidden md:flex md:flex-col animate-in slide-in-from-right-10 duration-500">
              {/* HEADER FOR FEEDS - Scrolls on mobile, Fixed on desktop */}
              <div className="max-w-4xl w-full mx-auto px-6 md:px-12 pt-6 md:pt-12 shrink-0 bg-white z-10">
                <AddFeedForm onAdd={async (f) => { await addFeed(f); }} isLoading={isAdding} />
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 py-8 border-b border-black/5">
                  <div className="flex items-center gap-4 flex-1 w-full py-2">
                    <Search size={16} className="text-gray-300" />
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      className="bg-transparent border-none focus:outline-none text-xs uppercase tracking-widest w-full font-bold" 
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 whitespace-nowrap">
                    {feeds.length} FEEDS
                  </span>
                </div>
              </div>

              {/* LIST FOR FEEDS - Part of main scroll on mobile, own scroll on desktop */}
              <div className="flex-1 md:overflow-y-auto no-scrollbar">
                <div className="max-w-4xl mx-auto px-6 md:px-12 pb-64 pt-8">
                  <FeedList 
                    feeds={feeds.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()))} 
                    onDelete={handleDeleteFeedAction}
                    onUpdate={async (id, data) => { await updateFeed({ id, data }); }}
                    isUpdating={isUpdating}
                    isDeleting={isDeleting}
                    deletingId={deletingId}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="max-w-4xl mx-auto p-6 md:p-12 pb-64">
                <SettingsView user={user} onLogout={logout} />
              </div>
            </div>
          )}
        </main>
      </div>

      {contextMenu && (
        <div 
          className="fixed z-[100] bg-white border border-black shadow-xl py-2 w-48 animate-in fade-in zoom-in-95 duration-200"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button 
            onClick={() => handleMarkFeedAsReadAction(contextMenu.feedId)}
            className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors flex items-center gap-3"
          >
            <Eye size={14} /> Mark all as read
          </button>
        </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Dashboard;
