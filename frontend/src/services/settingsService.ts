import api from '../api';

export interface UserSettings {
  mark_as_read_on_scroll: boolean;
}

export const settingsService = {
  getSettings: async (): Promise<UserSettings> => {
    const response = await api.get<UserSettings>('feeds/settings/');
    return response.data;
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await api.patch<UserSettings>('feeds/settings/', settings);
    return response.data;
  }
};
