import api from '../api';
import { Feed } from '../types';

export const feedService = {
  getFeeds: async (): Promise<Feed[]> => {
    const response = await api.get<Feed[]>('feeds/');
    return response.data;
  },

  addFeed: async (data: { title: string; url: string }): Promise<Feed> => {
    const response = await api.post<Feed>('feeds/', data);
    return response.data;
  },

  deleteFeed: async (id: number): Promise<void> => {
    await api.delete(`feeds/${id}/`);
  },

  updateFeed: async (id: number, data: Partial<Feed>): Promise<Feed> => {
    const response = await api.patch<Feed>(`feeds/${id}/`, data);
    return response.data;
  }
};
