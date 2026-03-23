import api from '../api';
import { Article } from '../types';

interface ArticleParams {
  feed_id?: number;
  offset?: number;
  unread_only?: boolean;
}

interface ArticlesResponse {
  entries: Article[];
  title: string;
  has_more: boolean;
}

export const articleService = {
  getArticles: async (params: ArticleParams = {}): Promise<ArticlesResponse> => {
    const { feed_id, offset = 0, unread_only = true } = params;
    const endpoint = feed_id 
      ? `feeds/${feed_id}/content/?offset=${offset}&unread_only=${unread_only}`
      : `feeds/all-content/?offset=${offset}&unread_only=${unread_only}`;
    
    const response = await api.get<ArticlesResponse>(endpoint);
    return response.data;
  },

  getSavedArticles: async (): Promise<Article[]> => {
    const response = await api.get<Article[]>('feeds/saved/');
    return response.data;
  },

  saveArticle: async (article: any): Promise<Article> => {
    const response = await api.post<Article>('feeds/saved/', article);
    return response.data;
  },

  unsaveArticle: async (link: string): Promise<void> => {
    await api.delete(`feeds/saved/delete/?link=${encodeURIComponent(link)}`);
  },

  markAsRead: async (link: string, feedId: number): Promise<void> => {
    await api.post('feeds/mark-read/', { link, feed_id: feedId });
  },

  markFeedAsRead: async (feedId: number | null): Promise<void> => {
    await api.post('feeds/mark-feed-read/', { feed_id: feedId });
  }
};
