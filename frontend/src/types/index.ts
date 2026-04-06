export interface Feed {
  id: number;
  url: string;
  title: string;
  category?: string;
}

export interface Article {
  id: number;
  feed: number;
  title: string;
  url: string;
  summary: string;
  published_at: string;
  author: string;
  thumbnail: string | null;
  is_saved?: boolean;
  is_read?: boolean;
}

export interface User {
  user_id: number;
  username: string;
  display_name: string;
  email: string;
  exp: number;
}
