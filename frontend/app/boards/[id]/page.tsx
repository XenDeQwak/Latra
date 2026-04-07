'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '@/lib/auth-context';
import {
  getBoard,
  createCard,
  updateCard,
  deleteCard,
  getUsers,
  addUserToCard,
  addUserToBoard,
  createList,
  deleteList,
} from '@/lib/api';
import type { Board, Card, List, Status, User } from '@/lib/types';

// Maps the auto-created list titles to their Status enum values
const TITLE_TO_STATUS: Record<string, Status> = {
  'To-Do': 'TODO',
  'In Progress': 'IN_PROGRESS',
  'In Review': 'REVIEW',
  'Done': 'DONE',
};

const COLUMN_COLORS: Record<string, { bg: string; headerBg: string }> = {
  'To-Do': { bg: 'bg-slate-100', headerBg: 'bg-slate-500' },
  'In Progress': { bg: 'bg-blue-50', headerBg: 'bg-blue-500' },
  'In Review': { bg: 'bg-amber-50', headerBg: 'bg-amber-500' },
  'Done': { bg: 'bg-green-50', headerBg: 'bg-green-500' },
};

const DEFAULT_COLUMN = { bg: 'bg-purple-50', headerBg: 'bg-purple-500' };

function formatDeadline(deadline: string) {
  const d = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = d < today;
  const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return { label, isPast };
}

interface EditState {
  card: Card;
  title: string;
  description: string;
  deadline: string;
  status: Status;
}

// ─── Draggable card wrapper ───────────────────────────────────────────────────
function DraggableCard({
  card,
  boardMembers,
  onEdit,
  onDelete,
  onAssign,
}: {
  card: Card;
  boardMembers: User[];
  onEdit: (card: Card) => void;
  onDelete: (cardId: number) => void;
  onAssign: (cardId: number, userId: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const { label: deadlineLabel, isPast } = formatDeadline(card.deadline);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-white rounded-lg shadow-sm border border-gray-100 p-3 flex flex-col gap-2 group cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-40 shadow-lg' : ''}`}
    >
      {/* Drag handle bar */}
      <div
        {...listeners}
        className="flex items-center justify-between gap-2"
        title="Drag to move"
      >
        <p className="text-sm font-semibold text-gray-800 leading-snug flex-1">
          {card.title}
        </p>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onEdit(card)}
            className="text-gray-400 hover:text-indigo-500 text-xs"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(card.id)}
            className="text-gray-400 hover:text-red-500 text-xs"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      {card.description && (
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
          {card.description}
        </p>
      )}

      <div className={`text-xs font-medium ${isPast ? 'text-red-500' : 'text-gray-400'}`}>
        📅 {deadlineLabel}
      </div>

      {/* Assigned users */}
      <div
        className="flex items-center gap-1.5 flex-wrap"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {card.assignedUsers.map((u) => (
          <span
            key={u.id}
            className="w-5 h-5 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center uppercase"
            title={u.username}
          >
            {u.username[0]}
          </span>
        ))}
        <AssignUserButton card={card} boardMembers={boardMembers} onAssign={onAssign} />
      </div>
    </div>
  );
}

// ─── Card preview shown in DragOverlay ───────────────────────────────────────
function CardPreview({ card }: { card: Card }) {
  const { label: deadlineLabel, isPast } = formatDeadline(card.deadline);
  return (
    <div className="bg-white rounded-lg shadow-xl border border-indigo-200 p-3 flex flex-col gap-2 w-72 rotate-2 opacity-95">
      <p className="text-sm font-semibold text-gray-800 leading-snug">{card.title}</p>
      {card.description && (
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{card.description}</p>
      )}
      <div className={`text-xs font-medium ${isPast ? 'text-red-500' : 'text-gray-400'}`}>
        📅 {deadlineLabel}
      </div>
    </div>
  );
}

// ─── Droppable column (card list area) ───────────────────────────────────────
function DroppableCardList({
  list,
  children,
}: {
  list: List;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: list.id });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 flex flex-col gap-3 p-3 overflow-y-auto max-h-[calc(100vh-260px)] rounded-b-xl transition-colors ${isOver ? 'bg-indigo-50/60' : ''}`}
    >
      {children}
    </div>
  );
}

// ─── Main board page ──────────────────────────────────────────────────────────
export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  const boardId = parseInt(rawId as unknown as string, 10);

  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [board, setBoard] = useState<Board | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Active drag card (for DragOverlay)
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  // Create card
  const [createTarget, setCreateTarget] = useState<List | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit card
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Add member to board
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [addingMember, setAddingMember] = useState(false);

  // Add list
  const [showAddList, setShowAddList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [addingList, setAddingList] = useState(false);
  const [addListError, setAddListError] = useState('');

  // DnD sensors — require 8px movement to start drag so clicks still work
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const reload = () =>
    getBoard(boardId)
      .then(setBoard)
      .catch((e: unknown) =>
        setFetchError(e instanceof Error ? e.message : 'Failed to load board'),
      )
      .finally(() => setFetching(false));

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    Promise.all([getBoard(boardId), getUsers()])
      .then(([b, users]) => {
        setBoard(b);
        setAllUsers(users);
      })
      .catch((e: unknown) =>
        setFetchError(e instanceof Error ? e.message : 'Failed to load board'),
      )
      .finally(() => setFetching(false));
  }, [user, boardId]);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const cardId = Number(event.active.id);
    const card = board?.lists.flatMap((l) => l.cards).find((c) => c.id === cardId) ?? null;
    setActiveCard(card);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over || !board) return;

    const cardId = Number(active.id);
    const targetListId = Number(over.id);

    const sourceCard = board.lists.flatMap((l) => l.cards).find((c) => c.id === cardId);
    if (!sourceCard || sourceCard.listId === targetListId) return;

    const targetList = board.lists.find((l) => l.id === targetListId);
    if (!targetList) return;

    const newStatus = TITLE_TO_STATUS[targetList.title];

    try {
      if (newStatus) {
        await updateCard(cardId, { status: newStatus });
      } else {
        await updateCard(cardId, { listId: targetListId });
      }
      await reload();
    } catch {
      alert('Failed to move card');
    }
  };

  // ── Card CRUD ──────────────────────────────────────────────────────────────
  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTarget) return;
    setCreateError('');
    setCreating(true);
    try {
      await createCard({
        title: newTitle.trim(),
        description: newDesc.trim(),
        deadline: new Date(newDeadline).toISOString(),
        listId: createTarget.id,
      });
      setNewTitle('');
      setNewDesc('');
      setNewDeadline('');
      setCreateTarget(null);
      await reload();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create card');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!confirm('Delete this card?')) return;
    try {
      await deleteCard(cardId);
      await reload();
    } catch {
      alert('Failed to delete card');
    }
  };

  const openEdit = (card: Card) => {
    setSaveError('');
    setEditState({
      card,
      title: card.title,
      description: card.description,
      deadline: card.deadline.split('T')[0],
      status: card.status,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editState) return;
    setSaveError('');
    setSaving(true);
    try {
      await updateCard(editState.card.id, {
        title: editState.title.trim(),
        description: editState.description.trim(),
        deadline: new Date(editState.deadline).toISOString(),
        status: editState.status,
      });
      setEditState(null);
      await reload();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save card');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignUserToCard = async (cardId: number, userId: number) => {
    try {
      await addUserToCard(cardId, userId);
      await reload();
    } catch {
      alert('Failed to assign user');
    }
  };

  // ── Member management ──────────────────────────────────────────────────────
  const handleAddMemberToBoard = async () => {
    if (!selectedUserId) return;
    setAddingMember(true);
    try {
      await addUserToBoard(boardId, selectedUserId);
      setShowAddMember(false);
      setSelectedUserId(null);
      await reload();
    } catch {
      alert('Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  // ── List management ────────────────────────────────────────────────────────
  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    setAddListError('');
    setAddingList(true);
    try {
      await createList(newListTitle.trim(), boardId);
      setNewListTitle('');
      setShowAddList(false);
      await reload();
    } catch (e) {
      setAddListError(e instanceof Error ? e.message : 'Failed to create list');
    } finally {
      setAddingList(false);
    }
  };

  const handleDeleteList = async (listId: number, listTitle: string) => {
    if (!confirm(`Delete the "${listTitle}" list and all its cards?`)) return;
    try {
      await deleteList(listId);
      await reload();
    } catch {
      alert('Failed to delete list');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isLoading || fetching) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-gray-400 text-sm">Loading…</span>
      </div>
    );
  }

  if (fetchError || !board) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-red-500 text-sm">{fetchError || 'Board not found'}</p>
      </div>
    );
  }

  const boardMemberIds = new Set(board.users.map((u) => u.id));
  const nonMembers = allUsers.filter((u) => !boardMemberIds.has(u.id));

  return (
    <div className="flex flex-col h-full">
      {/* Board header — white background to visually separate from the navbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-full flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{board.title}</h1>
            {board.description && (
              <p className="text-sm text-gray-500 mt-0.5">{board.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex -space-x-1">
              {board.users.slice(0, 6).map((u) => (
                <span
                  key={u.id}
                  className="w-7 h-7 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white uppercase"
                  title={u.username}
                >
                  {u.username[0]}
                </span>
              ))}
            </div>
            <button
              onClick={() => setShowAddMember(true)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-md transition-colors"
            >
              + Member
            </button>
          </div>
        </div>
      </div>

      {/* Kanban columns */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto bg-gray-100">
          <div className="flex gap-4 p-6 h-full min-w-max items-start">
            {board.lists.map((list) => {
              const colors = COLUMN_COLORS[list.title] ?? DEFAULT_COLUMN;
              const isDefaultList = list.title in TITLE_TO_STATUS;

              return (
                <div key={list.id} className={`flex flex-col rounded-xl w-72 shrink-0 ${colors.bg} shadow-sm`}>
                  {/* Column header */}
                  <div className={`${colors.headerBg} text-white rounded-t-xl px-4 py-3 flex items-center justify-between`}>
                    <span className="font-semibold text-sm">{list.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-white/20 text-xs font-medium px-2 py-0.5 rounded-full">
                        {list.cards.length}
                      </span>
                      {!isDefaultList && (
                        <button
                          onClick={() => handleDeleteList(list.id, list.title)}
                          className="text-white/70 hover:text-white text-xs transition-colors"
                          title="Delete list"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cards (droppable area) */}
                  <DroppableCardList list={list}>
                    {list.cards.map((card) => (
                      <DraggableCard
                        key={card.id}
                        card={card}
                        boardMembers={board.users}
                        onEdit={openEdit}
                        onDelete={handleDeleteCard}
                        onAssign={handleAssignUserToCard}
                      />
                    ))}
                    <button
                      onClick={() => { setCreateTarget(list); setCreateError(''); }}
                      className="text-xs text-gray-400 hover:text-indigo-600 hover:bg-white/60 transition-colors rounded-lg py-2 border border-dashed border-gray-200 hover:border-indigo-300 mt-1"
                    >
                      + Add card
                    </button>
                  </DroppableCardList>
                </div>
              );
            })}

            {/* Add list column */}
            {showAddList ? (
              <div className="bg-white rounded-xl w-72 shrink-0 shadow-sm p-4">
                <form onSubmit={handleAddList} className="flex flex-col gap-3">
                  <input
                    type="text"
                    autoFocus
                    required
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="List title…"
                  />
                  {addListError && (
                    <p className="text-xs text-red-600">{addListError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={addingList}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg py-2 transition-colors"
                    >
                      {addingList ? 'Adding…' : 'Add list'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddList(false); setNewListTitle(''); setAddListError(''); }}
                      className="flex-1 border border-gray-300 rounded-lg py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setShowAddList(true)}
                className="bg-white/60 hover:bg-white text-gray-500 hover:text-indigo-600 rounded-xl w-72 shrink-0 py-4 text-sm font-medium border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors"
              >
                + Add list
              </button>
            )}
          </div>
        </div>

        {/* Drag overlay — floats above everything while dragging */}
        <DragOverlay>
          {activeCard ? <CardPreview card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Create card modal */}
      {createTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">New Card</h2>
            <p className="text-sm text-gray-400 mb-5">in <span className="font-medium text-gray-600">{createTarget.title}</span></p>
            <form onSubmit={handleCreateCard} className="flex flex-col gap-4">
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
                  placeholder="Task title"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  placeholder="Optional details…"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Deadline</label>
                <input
                  type="date"
                  required
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setCreateTarget(null)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2 transition-colors"
                >
                  {creating ? 'Adding…' : 'Add Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit card modal */}
      {editState && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Edit Card</h2>
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {saveError}
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  required
                  value={editState.title}
                  onChange={(e) => setEditState({ ...editState, title: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={editState.description}
                  onChange={(e) => setEditState({ ...editState, description: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Deadline</label>
                <input
                  type="date"
                  required
                  value={editState.deadline}
                  onChange={(e) => setEditState({ ...editState, deadline: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={editState.status}
                  onChange={(e) => setEditState({ ...editState, status: e.target.value as Status })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {(Object.keys(TITLE_TO_STATUS) as string[]).map((title) => (
                    <option key={TITLE_TO_STATUS[title]} value={TITLE_TO_STATUS[title]}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setEditState(null)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2 transition-colors"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add member to board modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Add Member</h2>
            {nonMembers.length === 0 ? (
              <p className="text-sm text-gray-500">All users are already members.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <select
                  value={selectedUserId ?? ''}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="" disabled>Select a user…</option>
                  {nonMembers.map((u) => (
                    <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowAddMember(false); setSelectedUserId(null); }}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {nonMembers.length > 0 && (
                <button
                  onClick={handleAddMemberToBoard}
                  disabled={!selectedUserId || addingMember}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2 transition-colors"
                >
                  {addingMember ? 'Adding…' : 'Add'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Assign-user dropdown (unchanged from original) ───────────────────────────
function AssignUserButton({
  card,
  boardMembers,
  onAssign,
}: {
  card: Card;
  boardMembers: User[];
  onAssign: (cardId: number, userId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const assignedIds = new Set(card.assignedUsers.map((u) => u.id));
  const unassigned = boardMembers.filter((u) => !assignedIds.has(u.id));

  if (unassigned.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-5 h-5 rounded-full bg-gray-200 hover:bg-indigo-100 text-gray-500 hover:text-indigo-600 text-[10px] flex items-center justify-center transition-colors"
        title="Assign user"
      >
        +
      </button>
      {open && (
        <div className="absolute bottom-7 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-max">
          {unassigned.map((u) => (
            <button
              key={u.id}
              onClick={() => { onAssign(card.id, u.id); setOpen(false); }}
              className="w-full text-left text-xs px-3 py-1.5 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700"
            >
              {u.username}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

