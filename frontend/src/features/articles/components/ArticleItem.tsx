import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Article } from '../../../types';

interface ArticleItemProps {
  article: Article;
  isSaved: boolean;
  onSelect: (article: Article) => void;
  onToggleSave: (article: Article, e: React.MouseEvent) => void;
  formatDate: (dateStr: string) => string;
}

const ArticleItem: React.FC<ArticleItemProps> = ({ 
  article, 
  isSaved, 
  onSelect, 
  onToggleSave, 
  formatDate 
}) => {
  return (
    <div 
      onClick={() => onSelect(article)} 
      className={`group cursor-pointer py-10 px-6 border-b border-gray-100 hover:border-black transition-all duration-300 flex justify-between items-start gap-10 ${article.is_read ? 'opacity-40' : 'opacity-100'}`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-4">
          {!article.is_read && <div className="w-2 h-2 bg-black rounded-full" />}
          <span className="text-[10px] font-bold text-black border border-black px-2 py-0.5 uppercase tracking-widest truncate max-w-[120px]">
            {/* Note: backend might return feed_title or we might need to get it from context if feed object is used */}
            {(article as any).feed_title || 'Feed'}
          </span>
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            {formatDate(article.published_at || (article as any).published)}
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight leading-tight group-hover:translate-x-2 transition-transform duration-500">
          {article.title || 'Untitled'}
        </h2>
      </div>
      
      <div className="flex items-center gap-8 self-center">
        {article.thumbnail && (
          <div className="hidden md:block w-40 h-40 shrink-0 border-2 border-black/10 group-hover:border-black transition-colors overflow-hidden bg-gray-50">
            <img src={article.thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <button 
          onClick={(e) => onToggleSave(article, e)}
          className={`p-2 transition-all ${isSaved ? 'text-black' : 'text-gray-200 group-hover:text-black'} cursor-pointer`}
        >
          {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
        </button>
      </div>
    </div>
  );
};

export default ArticleItem;
