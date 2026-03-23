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
  const { type = 'all', ...rest } = params;

  // For saved articles, we still use a simple query (or could be infinite if backend supports)
  const savedQuery = useQuery<Article[]>({
    queryKey: ['articles', 'saved'],
    queryFn: () => articleService.getSavedArticles(),
    enabled: type === 'saved',
  });

  const infiniteQuery = useInfiniteQuery<ArticlesResponse>({
    queryKey: ['articles', 'infinite', rest],
    queryFn: ({ pageParam = 0 }) => 
      articleService.getArticles({ ...rest, offset: pageParam as number }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.has_more) return undefined;
      return allPages.length * 10;
    },
    initialPageParam: 0,
    enabled: type === 'all',
  });

  const saveMutation = useMutation({
    mutationFn: (article: any) => articleService.saveArticle(article),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article saved');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to save article';
      toast.error(message);
    }
  });

  const unsaveMutation = useMutation({
    mutationFn: (link: string) => articleService.unsaveArticle(link),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
  });

  const markFeedReadMutation = useMutation({
    mutationFn: (feedId: number | null) => articleService.markFeedAsRead(feedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
  });

  const isSavedType = type === 'saved';
  
  const articles = isSavedType 
    ? (savedQuery.data || [])
    : (infiniteQuery.data?.pages.flatMap(page => page.entries) || []);

  const hasMore = !isSavedType && !!infiniteQuery.hasNextPage;

  return {
    articles,
    title: (!isSavedType && infiniteQuery.data?.pages[0]?.title) || '',
    hasMore,
    isLoading: isSavedType ? savedQuery.isLoading : infiniteQuery.isLoading,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    isError: isSavedType ? savedQuery.isError : infiniteQuery.isError,
    fetchNextPage: infiniteQuery.fetchNextPage,
    saveArticle: saveMutation.mutateAsync,
    unsaveArticle: unsaveMutation.mutateAsync,
    markRead: markReadMutation.mutateAsync,
    markFeedRead: markFeedReadMutation.mutateAsync,
  };
};
