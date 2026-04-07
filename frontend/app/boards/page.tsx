'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getBoards, createBoard, deleteBoard, addUserToBoard } from '@/lib/api';
import type { Board } from '@/lib/types';

const CARD_GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-500',
  'from-pink-500 to-fuchsia-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-cyan-600',
  'from-rose-500 to-pink-600',
];

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
          <span className="text-slate-400 text-sm font-medium">Loading your workspace…</span>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-6 py-4 text-red-400 text-sm">{fetchError}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Page header */}
      <div className="border-b border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-screen-xl mx-auto px-8 py-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-indigo-400 text-sm font-medium mb-1">Welcome back, {user?.username}</p>
              <h1 className="text-white text-3xl font-bold tracking-tight">My Workspace</h1>
              <p className="text-slate-400 text-sm mt-1.5">
                {boards.length === 0
                  ? 'No boards yet — create your first one'
                  : `${boards.length} board${boards.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-150 shadow-lg shadow-indigo-500/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Board
            </button>
          </div>
        </div>
      </div>

      {/* Board grid */}
      <div className="max-w-screen-xl mx-auto px-8 py-8">
        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
              </svg>
            </div>
            <p className="text-slate-300 font-semibold text-lg mb-1">No boards yet</p>
            <p className="text-slate-500 text-sm mb-6">Create your first board to get started</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-150"
            >
              Create a board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {boards.map((board, i) => (
              <Link
                key={board.id}
                href={`/boards/${board.id}`}
                aria-label={`Open board: ${board.title}`}
                style={{ animationDelay: `${i * 50}ms` }}
                className="animate-slide-up group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 transition-all duration-200"
              >
                {/* Gradient top section */}
                <div className={`bg-gradient-to-br ${CARD_GRADIENTS[board.id % CARD_GRADIENTS.length]} h-28 p-4 flex flex-col justify-between relative`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="relative flex items-start justify-between gap-2">
                    <h3 className="text-white font-bold text-base leading-snug line-clamp-2 flex-1 drop-shadow-sm">
                      {board.title}
                    </h3>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(board.id); }}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 active:scale-95 text-white text-xs transition-all duration-150 shrink-0 mt-0.5"
                      aria-label="Delete board"
                    >
                      ✕
                    </button>
                  </div>
                  {board.description && (
                    <p className="relative text-white/80 text-xs line-clamp-2 leading-relaxed">
                      {board.description}
                    </p>
                  )}
                </div>

                {/* Bottom info bar */}
                <div className="bg-slate-800/80 border border-white/[0.06] border-t-0 rounded-b-2xl px-4 py-2.5 flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    {board.users && board.users.slice(0, 4).map((u) => (
                      <span
                        key={u.id}
                        className="w-6 h-6 rounded-full bg-indigo-500/60 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-800 uppercase"
                        title={u.username}
                      >
                        {u.username[0]}
                      </span>
                    ))}
                    {board.users && board.users.length > 4 && (
                      <span className="w-6 h-6 rounded-full bg-slate-600 text-slate-300 text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-800">
                        +{board.users.length - 4}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 text-xs">
                    {board.users?.length ?? 0} member{(board.users?.length ?? 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </Link>
            ))}

            {/* + New Board card */}
            <button
              onClick={() => setShowCreate(true)}
              style={{ animationDelay: `${boards.length * 50}ms` }}
              className="animate-slide-up group flex flex-col items-center justify-center rounded-2xl h-[calc(7rem+2.75rem)] border-2 border-dashed border-white/10 hover:border-indigo-500/50 bg-white/[0.02] hover:bg-indigo-500/5 active:scale-95 text-slate-500 hover:text-indigo-400 gap-2 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-semibold">New Board</span>
            </button>
          </div>
        )}
      </div>

      {/* Create board modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="animate-scale-in bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white">Create New Board</h2>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              {createError && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {createError}
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Board Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="e.g. Q2 Product Roadmap"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Description <span className="text-slate-500 font-normal">(optional)</span></label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
                  placeholder="What is this board for?"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border border-white/10 rounded-xl py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white text-sm font-semibold rounded-xl py-2.5 transition-all shadow-lg shadow-indigo-500/20"
                >
                  {creating ? 'Creating…' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
