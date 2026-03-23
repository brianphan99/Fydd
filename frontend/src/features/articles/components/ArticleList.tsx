import React from 'react';
import { Loader2 } from 'lucide-react';
import ArticleItem from './ArticleItem';
import { Article } from '../../../types';

interface ArticleListProps {
  articles: Article[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onSelect: (article: Article) => void;
  onToggleSave: (article: Article, e: React.MouseEvent) => void;
  isSaved: (article: Article) => boolean;
  formatDate: (dateStr: string) => string;
}

const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  isLoading,
  isLoadingMore,
  hasMore,
  onSelect,
  onToggleSave,
  isSaved,
  formatDate,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-pulse">
        <div className="w-12 h-1 bg-black mb-4"></div>
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold">Syncing...</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm italic text-gray-300 uppercase tracking-widest">No Content Found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {articles.map((article) => (
        <ArticleItem
          key={article.url || (article as any).link}
          article={article}
          isSaved={isSaved(article)}
          onSelect={onSelect}
          onToggleSave={onToggleSave}
          formatDate={formatDate}
        />
      ))}
      
      {isLoadingMore && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-black" size={24} />
        </div>
      )}
      
      {!hasMore && articles.length > 0 && (
        <p className="text-center py-12 text-[10px] font-bold text-gray-200 uppercase tracking-[0.5em]">End of Stream</p>
      )}
      
      <div className="h-32" />
    </div>
  );
};

export default ArticleList;
