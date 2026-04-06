import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { articleService } from '../services/articleService';
import toast from 'react-hot-toast';
import { Article } from '../types';

interface UseArticlesParams {
  feed_id?: number;
  unread_only?: boolean;
  type?: 'all' | 'saved';
}

interface ArticlesResponse {
  entries: Article[];
  title: string;
  has_more: boolean;
}

export const useArticles = (params: UseArticlesParams = {}) => {
  const queryClient = useQueryClient();
  const { type = 'all', offset = 0, ...rest } = params;

  // For saved articles
  const savedQuery = useQuery<Article[]>({
    queryKey: ['articles', 'saved'],
    queryFn: () => articleService.getSavedArticles(),
    enabled: type === 'saved',
  });

  // Standard query for paginated articles
  const paginatedQuery = useQuery<ArticlesResponse>({
    queryKey: ['articles', 'paginated', { ...rest, offset }],
    queryFn: () => articleService.getArticles({ ...rest, offset }),
    enabled: type === 'all',
  });

  const saveMutation = useMutation({
    mutationFn: (article: any) => articleService.saveArticle(article),
    onSuccess: (savedArticle) => {
      queryClient.invalidateQueries({ queryKey: ['articles', 'saved'] });
      
      const link = savedArticle.link;
      queryClient.setQueriesData({ queryKey: ['articles', 'paginated'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries.map((entry: any) => 
            (entry.url === link || (entry as any).link === link) 
              ? { ...entry, is_saved: true } 
              : entry
          )
        };
      });
      toast.success('Article saved');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to save article';
      toast.error(message);
    }
  });

  const unsaveMutation = useMutation({
    mutationFn: (link: string) => articleService.unsaveArticle(link),
    onSuccess: (_, link) => {
      queryClient.invalidateQueries({ queryKey: ['articles', 'saved'] });

      queryClient.setQueriesData({ queryKey: ['articles', 'paginated'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries.map((entry: any) => 
            (entry.url === link || (entry as any).link === link) 
              ? { ...entry, is_saved: false } 
              : entry
          )
        };
      });
      toast.success('Article unsaved');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to unsave article';
      toast.error(message);
    }
  });

  const markReadMutation = useMutation({
    mutationFn: ({ link, feedId }: { link: string; feedId: number }) => 
      articleService.markAsRead(link, feedId),
    onMutate: async ({ link }) => {
      queryClient.setQueriesData({ queryKey: ['articles', 'paginated'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries.map((entry: any) => 
            (entry.url === link || (entry as any).link === link) 
              ? { ...entry, is_read: true } 
              : entry
          )
        };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
  });

  const markUnreadMutation = useMutation({
    mutationFn: (link: string) => articleService.markAsUnread(link),
    onMutate: async (link) => {
      queryClient.setQueriesData({ queryKey: ['articles', 'paginated'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries.map((entry: any) => 
            (entry.url === link || (entry as any).link === link) 
              ? { ...entry, is_read: false } 
              : entry
          )
        };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
  });

  const markFeedReadMutation = useMutation({
    mutationFn: (feedId: number | null) => articleService.markFeedAsRead(feedId),
    onMutate: async (feedId) => {
      queryClient.setQueriesData({ queryKey: ['articles', 'paginated'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries.map((entry: any) => 
            (feedId === null || (entry.feed || (entry as any).feed_id) === feedId)
              ? { ...entry, is_read: true }
              : entry
          )
        };
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
  });

  const isSavedType = type === 'saved';
  
  const articles = isSavedType 
    ? (savedQuery.data || [])
    : (paginatedQuery.data?.entries || []);

  const hasMore = !isSavedType && !!paginatedQuery.data?.has_more;

  return {
    articles,
    title: (!isSavedType && paginatedQuery.data?.title) || '',
    hasMore,
    isLoading: isSavedType ? savedQuery.isLoading : paginatedQuery.isLoading,
    isError: isSavedType ? savedQuery.isError : paginatedQuery.isError,
    saveArticle: saveMutation.mutateAsync,
    unsaveArticle: unsaveMutation.mutateAsync,
    markRead: markReadMutation.mutateAsync,
    markUnread: markUnreadMutation.mutateAsync,
    markFeedRead: markFeedReadMutation.mutateAsync,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
    }
  };
};
