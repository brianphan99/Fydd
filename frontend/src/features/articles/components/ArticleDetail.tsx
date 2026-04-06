import React from 'react';
import { ArrowLeft, Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react';
import { Article } from '../../../types';
import SanitizedHTML from '../../../components/ui/SanitizedHTML';

interface ArticleDetailProps {
  article: Article;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: (article: Article, e: React.MouseEvent) => void;
  formatDate: (dateStr: string) => string;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({
  article,
  isSaved,
  onClose,
  onToggleSave,
  formatDate,
}) => {
  return (
    <div className="h-screen bg-theme-primary text-theme-primary font-sans flex flex-col transition-colors">
      <nav className="border-b border-black/10 p-6 flex justify-between items-center bg-theme-primary z-40 shrink-0">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 hover:text-gray-400 transition-colors uppercase text-xs font-bold tracking-widest cursor-pointer"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">FYDD • READ</div>
        <button 
          onClick={(e) => onToggleSave(article, e)}
          className={`p-2 transition-all ${isSaved ? 'text-theme-primary' : 'text-gray-300 hover:text-black'} cursor-pointer`}
        >
          {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
        </button>
      </nav>
      <main className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar pb-48">
        <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-6">
            {(article as any).feed_title} • {formatDate(article.published_at || (article as any).published)}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight leading-tight mb-12">
            {article.title || 'Untitled Article'}
          </h1>
          
          {article.thumbnail && (
            <div className="mb-16 border border-black/10 rounded-sm overflow-hidden bg-gray-50/50 shadow-xl transition-all">
              <img 
                src={article.thumbnail} 
                alt={article.title} 
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          <SanitizedHTML 
            html={article.summary} 
            className="text-theme-primary/90 text-lg leading-relaxed mb-16 prose prose-lg max-w-none prose-p:mb-6 prose-a:text-theme-primary prose-a:font-bold prose-img:mx-auto prose-img:my-12"
          />
          
          <a 
            href={article.url || (article as any).link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all cursor-pointer shadow-lg active:scale-95 rounded-sm"
          >
            Original Source <ExternalLink size={14} />
          </a>
          <div className="h-32" />
        </div>
      </main>
    </div>
  );
};

export default ArticleDetail;
