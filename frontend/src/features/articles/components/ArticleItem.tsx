import React from 'react';
import { Bookmark, BookmarkCheck, Eye, EyeOff } from 'lucide-react';
import { Article } from '../../../types';

interface ArticleItemProps {
  article: Article;
  isSaved: boolean;
  onSelect: (article: Article) => void;
  onToggleSave: (article: Article, e: React.MouseEvent) => void;
  onToggleRead: (article: Article, e: React.MouseEvent) => void;
  formatDate: (dateStr: string) => string;
}

const ArticleItem: React.FC<ArticleItemProps> = ({ 
  article, 
  isSaved, 
  onSelect, 
  onToggleSave, 
  onToggleRead,
  formatDate 
}) => {
  const isVisuallyRead = article.is_read;

  return (
    <div 
      onClick={() => onSelect(article)} 
      className={`group cursor-pointer py-10 px-6 border-b border-black/5 hover:border-black/20 transition-all duration-700 flex justify-between items-start gap-10 ${
        isVisuallyRead 
          ? 'opacity-60' 
          : 'opacity-100'
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-2 h-2 bg-theme-primary rounded-full border border-black transition-all duration-500 ${isVisuallyRead ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`} />
          <span className={`text-[10px] font-bold border px-2 py-0.5 uppercase tracking-widest truncate max-w-[120px] transition-colors duration-500 ${
            isVisuallyRead ? 'text-gray-400 border-black/5' : 'text-theme-primary border-black/20'
          }`}>
            {(article as any).feed_title || 'Feed'}
          </span>
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            {formatDate(article.published_at || (article as any).published)}
          </span>
        </div>
        <h2 className={`text-2xl md:text-3xl font-bold uppercase tracking-tight leading-tight group-hover:translate-x-2 transition-all duration-700 ${
          isVisuallyRead ? 'text-theme-primary/50' : 'text-theme-primary'
        }`}>
          {article.title || 'Untitled'}
        </h2>
      </div>
      
      <div className="flex items-center gap-6 self-center">
        {article.thumbnail && (
          <div className={`hidden md:block w-32 h-32 shrink-0 border transition-all duration-700 overflow-hidden bg-gray-50/50 rounded-sm ${
            isVisuallyRead ? 'border-black/5 opacity-50' : 'border-black/10 group-hover:border-black/30'
          }`}>
            <img src={article.thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          <button 
            onClick={(e) => onToggleRead(article, e)}
            title={article.is_read ? "Mark as unread" : "Mark as read"}
            className={`p-2 transition-all ${isVisuallyRead ? 'text-theme-primary' : 'text-gray-200 group-hover:text-theme-primary'} cursor-pointer`}
          >
            {isVisuallyRead ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          
          <button 
            onClick={(e) => onToggleSave(article, e)}
            title={isSaved ? "Unsave article" : "Save article"}
            className={`p-2 transition-all ${isSaved ? 'text-theme-primary' : 'text-gray-200 group-hover:text-theme-primary'} cursor-pointer ${isVisuallyRead ? 'opacity-40' : 'opacity-100'}`}
          >
            {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticleItem;
