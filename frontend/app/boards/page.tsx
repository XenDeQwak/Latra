'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getBoards, createBoard, deleteBoard, addUserToBoard } from '@/lib/api';
import type { Board } from '@/lib/types';

export default function BoardsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [boards, setBoards] = useState<Board[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    getBoards(user.id)
      .then(setBoards)
      .catch((e: unknown) =>
        setFetchError(e instanceof Error ? e.message : 'Failed to load boards'),
      )
      .finally(() => setFetching(false));
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreateError('');
    setCreating(true);
    try {
      const board = await createBoard(newTitle.trim(), newDesc.trim());
      await addUserToBoard(board.id, user.id);
      const updated = await getBoards(user.id);
      setBoards(updated);
      setNewTitle('');
      setNewDesc('');
      setShowCreate(false);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create board');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this board?')) return;
    try {
      await deleteBoard(id);
      setBoards((prev) => prev.filter((b) => b.id !== id));
    } catch {
      alert('Failed to delete board');
    }
  };

  if (isLoading || fetching) {
    return (
      <div className="min-h-screen bg-[#1d2d44] flex items-center justify-center">
        <span className="text-white/60 text-sm">Loading…</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#1d2d44] flex items-center justify-center">
        <p className="text-red-400 text-sm">{fetchError}</p>
      </div>
    );
  }

  const palette = ['bg-blue-500','bg-teal-500','bg-green-600','bg-orange-500','bg-purple-600','bg-red-500','bg-pink-500','bg-indigo-600'];

  return (
    <div className="min-h-screen bg-[#1d2d44] px-8 py-10">
      <h1 className="text-white text-xl font-bold mb-6">Your Boards</h1>

      <div className="flex flex-wrap gap-4">
        {boards.map((board) => (
          <div
            key={board.id}
            className={`group relative w-48 h-28 rounded-lg cursor-pointer ${palette[board.id % palette.length]} flex flex-col justify-between p-3 hover:brightness-110 transition`}
          >
            <div className="flex items-start justify-between">
              <Link
                href={`/boards/${board.id}`}
                className="text-white font-bold text-sm leading-snug line-clamp-2 flex-1"
              >
                {board.title}
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); handleDelete(board.id); }}
                className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white transition-all text-xs ml-1 shrink-0"
                aria-label="Delete board"
              >
                ✕
              </button>
            </div>
            {board.users && board.users.length > 0 && (
              <div className="flex -space-x-1">
                {board.users.slice(0, 4).map((u) => (
                  <span
                    key={u.id}
                    className="w-6 h-6 rounded-full bg-white/30 text-white text-[10px] font-bold flex items-center justify-center ring-1 ring-white/40 uppercase"
                    title={u.username}
                  >
                    {u.username[0]}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* + New Board tile */}
        <button
          onClick={() => setShowCreate(true)}
          className="w-48 h-28 rounded-lg bg-white/20 hover:bg-white/30 border-2 border-dashed border-white/40 flex items-center justify-center text-white/80 hover:text-white text-sm font-medium transition"
        >
          + New Board
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Create Board</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              {createError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {createError}
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="My Project"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  placeholder="What is this board about?"
                />
              </div>
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-[#0079bf] hover:bg-[#026aa7] disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2 transition-colors"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
