import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AddFeedFormProps {
  onAdd: (feed: { title: string; url: string }) => Promise<void>;
  isLoading: boolean;
}

const AddFeedForm: React.FC<AddFeedFormProps> = ({ onAdd, isLoading }) => {
  const [newFeed, setNewFeed] = useState({ title: '', url: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd(newFeed);
    setNewFeed({ title: '', url: '' });
  };

  return (
    <section className="bg-white pb-10">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-gray-400">Add Feed</h2>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 p-6 border-2 border-black bg-white shadow-lg">
        <input 
          type="text" 
          placeholder="TITLE" 
          value={newFeed.title} 
          onChange={(e) => setNewFeed({ ...newFeed, title: e.target.value })} 
          className="flex-1 border-b border-black py-2 focus:outline-none uppercase text-xs tracking-widest font-bold" 
          required 
        />
        <input 
          type="url" 
          placeholder="URL" 
          value={newFeed.url} 
          onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })} 
          className="flex-1 border-b border-black py-2 focus:outline-none text-xs tracking-widest" 
          required 
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className={`bg-black text-white px-8 py-3 font-bold uppercase text-[10px] tracking-widest hover:bg-gray-800 transition-all cursor-pointer whitespace-nowrap flex items-center gap-3 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Connecting...
            </>
          ) : 'Connect'}
        </button>
      </form>
    </section>
  );
};

export default AddFeedForm;
