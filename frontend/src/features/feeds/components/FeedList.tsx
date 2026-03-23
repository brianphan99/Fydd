import React, { useState } from 'react';
import { Check, Edit2, Loader2, Rss, Trash2, X } from 'lucide-react';
import { Feed } from '../../../types';

interface FeedListProps {
  feeds: Feed[];
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, data: Partial<Feed>) => Promise<void>;
  isUpdating?: boolean;
  isDeleting?: boolean;
  deletingId?: number | null;
}

const FeedList: React.FC<FeedListProps> = ({ 
  feeds, 
  onDelete, 
  onUpdate, 
  isUpdating, 
  isDeleting,
  deletingId 
}) => {
  const [editingFeedId, setEditingFeedId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', url: '' });

  const handleStartEdit = (feed: Feed) => {
    setEditingFeedId(feed.id);
    setEditForm({ title: feed.title, url: feed.url });
  };

  const handleSaveEdit = async (id: number) => {
    await onUpdate(id, editForm);
    setEditingFeedId(null);
  };

  return (
    <div className="space-y-4 pr-2">
      {feeds.map((feed) => (
        <div 
          key={feed.id} 
          className={`group border-2 transition-all p-6 flex flex-col md:flex-row justify-between items-center gap-6 ${editingFeedId === feed.id ? 'border-black bg-gray-50' : 'border-gray-50 hover:border-black'}`}
        >
          <div className="flex items-center gap-6 flex-1 w-full">
            <div className={`w-10 h-10 border flex items-center justify-center transition-all ${editingFeedId === feed.id ? 'bg-black text-white' : 'border-black group-hover:bg-black group-hover:text-white'}`}>
              {(isDeleting && deletingId === feed.id) ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Rss size={16} />
              )}
            </div>
            {editingFeedId === feed.id ? (
              <div className="flex-1 space-y-4">
                <input 
                  value={editForm.title} 
                  onChange={e => setEditForm({...editForm, title: e.target.value})} 
                  className="w-full border-b border-black bg-transparent py-1 text-xl font-bold uppercase tracking-tight focus:outline-none" 
                  disabled={isUpdating}
                />
                <input 
                  value={editForm.url} 
                  onChange={e => setEditForm({...editForm, url: e.target.value})} 
                  className="w-full border-b border-black bg-transparent py-1 text-[10px] uppercase tracking-widest focus:outline-none" 
                  disabled={isUpdating}
                />
              </div>
            ) : (
              <div className="flex-1 truncate">
                <h3 className="text-xl font-bold uppercase tracking-tight truncate">{feed.title}</h3>
                <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-1 font-bold truncate">{feed.url}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {editingFeedId === feed.id ? (
              <>
                <button 
                  onClick={() => handleSaveEdit(feed.id)} 
                  className="p-3 text-green-600 cursor-pointer disabled:opacity-30"
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                </button>
                <button 
                  onClick={() => setEditingFeedId(null)} 
                  className="p-3 text-red-600 cursor-pointer disabled:opacity-30"
                  disabled={isUpdating}
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => handleStartEdit(feed)} 
                  className="p-3 text-gray-300 hover:text-black cursor-pointer disabled:opacity-30"
                  disabled={isDeleting || isUpdating}
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => onDelete(feed.id)} 
                  className="p-3 text-gray-300 hover:text-red-600 cursor-pointer disabled:opacity-30"
                  disabled={isDeleting || isUpdating}
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeedList;
