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
    getBoards()
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
      const updated = await getBoards();
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
      <div className="flex flex-1 items-center justify-center">
        <span className="text-gray-400 text-sm">Loading…</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-red-500 text-sm">{fetchError}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Your Boards</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New Board
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
          <p className="text-lg">No boards yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-indigo-500 font-medium hover:underline text-sm"
          >
            Create your first board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {boards.map((board) => (
            <div key={board.id} className="group bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/boards/${board.id}`}
                  className="text-base font-semibold text-gray-800 hover:text-indigo-600 transition-colors leading-snug"
                >
                  {board.title}
                </Link>
                <button
                  onClick={() => handleDelete(board.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-xs shrink-0 mt-0.5"
                  aria-label="Delete board"
                >
                  ✕
                </button>
              </div>
              {board.description && (
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {board.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-auto pt-1">
                <span className="text-xs text-gray-400">
                  {board.lists?.reduce((acc, l) => acc + (l.cards?.length ?? 0), 0)} cards
                </span>
                {board.users && board.users.length > 0 && (
                  <div className="flex -space-x-1 ml-auto">
                    {board.users.slice(0, 4).map((u) => (
                      <span
                        key={u.id}
                        className="w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white uppercase"
                        title={u.username}
                      >
                        {u.username[0]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Link
                href={`/boards/${board.id}`}
                className="text-xs text-indigo-500 font-medium hover:underline"
              >
                Open board →
              </Link>
            </div>
          ))}
        </div>
      )}

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
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2 transition-colors"
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
