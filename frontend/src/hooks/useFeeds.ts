import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService } from '../services/feedService';
import toast from 'react-hot-toast';
import { Feed } from '../types';

export const useFeeds = () => {
  const queryClient = useQueryClient();

  const feedsQuery = useQuery({
    queryKey: ['feeds'],
    queryFn: feedService.getFeeds,
  });

  const addFeedMutation = useMutation({
    mutationFn: (data: { title: string; url: string }) => feedService.addFeed(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      toast.success('Feed added successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to add feed';
      toast.error(message);
    },
  });

  const deleteFeedMutation = useMutation({
    mutationFn: feedService.deleteFeed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      toast.success('Feed removed');
    },
    onError: () => {
      toast.error('Failed to remove feed');
    },
  });

  const updateFeedMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Feed> }) => 
      feedService.updateFeed(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      toast.success('Feed updated');
    },
    onError: () => {
      toast.error('Failed to update feed');
    },
  });

  const discoverFeedsMutation = useMutation({
    mutationFn: (url: string) => feedService.discoverFeeds(url),
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to discover feeds';
      toast.error(message);
    },
  });

  return {
    feeds: feedsQuery.data || [],
    isLoading: feedsQuery.isLoading,
    isError: feedsQuery.isError,
    error: feedsQuery.error,
    addFeed: addFeedMutation.mutateAsync,
    isAdding: addFeedMutation.isPending,
    deleteFeed: deleteFeedMutation.mutateAsync,
    isDeleting: deleteFeedMutation.isPending,
    updateFeed: updateFeedMutation.mutateAsync,
    isUpdating: updateFeedMutation.isPending,
    discoverFeeds: discoverFeedsMutation.mutateAsync,
    isDiscovering: discoverFeedsMutation.isPending,
  };
};
