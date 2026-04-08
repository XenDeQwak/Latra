'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
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

const COLUMN_STYLES: Record<string, { accent: string; badge: string; headerText: string }> = {
  'To-Do':       { accent: 'border-t-slate-400',   badge: 'bg-slate-100 text-slate-600',   headerText: 'text-slate-700' },
  'In Progress': { accent: 'border-t-blue-500',    badge: 'bg-blue-50 text-blue-600',      headerText: 'text-blue-700' },
  'In Review':   { accent: 'border-t-amber-500',   badge: 'bg-amber-50 text-amber-600',    headerText: 'text-amber-700' },
  'Done':        { accent: 'border-t-emerald-500', badge: 'bg-emerald-50 text-emerald-600', headerText: 'text-emerald-700' },
};

const DEFAULT_COLUMN_STYLE = { accent: 'border-t-purple-500', badge: 'bg-purple-50 text-purple-600', headerText: 'text-purple-700' };

const CARD_LEFT_BORDER: Record<string, string> = {
  'To-Do':       'border-l-slate-400',
  'In Progress': 'border-l-blue-500',
  'In Review':   'border-l-amber-500',
  'Done':        'border-l-emerald-500',
};

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
  listTitle,
  boardMembers,
  onEdit,
  onDelete,
  onAssign,
}: {
  card: Card;
  listTitle: string;
  boardMembers: User[];
  onEdit: (card: Card) => void;
  onDelete: (cardId: number) => void;
  onAssign: (cardId: number, userId: number) => void;
}) {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: card.id,
  });
  const { setNodeRef: setDropRef } = useDroppable({ id: `card-drop-${String(card.id)}` });

  const setRef = (el: HTMLElement | null) => {
    setDragRef(el);
    setDropRef(el);
  };

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const { label: deadlineLabel, isPast } = formatDeadline(card.deadline);
  const leftBorder = CARD_LEFT_BORDER[listTitle] ?? 'border-l-purple-500';

  return (
    <div
      ref={setRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${leftBorder} p-3.5 flex flex-col gap-2.5 group cursor-grab active:cursor-grabbing transition-all duration-150 ${isDragging ? 'opacity-30 scale-95' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
    >
      {/* Title row + actions */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800 leading-snug flex-1">{card.title}</p>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onEdit(card)}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-indigo-50 text-gray-400 hover:text-indigo-500 transition-colors"
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(card.id)}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {card.description && (
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{card.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${isPast ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {deadlineLabel}
        </span>

        <div
          className="flex items-center gap-1 flex-wrap justify-end"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {card.assignedUsers.map((u) => (
            <span
              key={u.id}
              className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center uppercase ring-1 ring-white"
              title={u.username}
            >
              {u.username[0]}
            </span>
          ))}
          <AssignUserButton card={card} boardMembers={boardMembers} onAssign={onAssign} />
        </div>
      </div>
    </div>
  );
}

// ─── Card preview shown in DragOverlay ───────────────────────────────────────
function CardPreview({ card }: { card: Card }) {
  const { label: deadlineLabel, isPast } = formatDeadline(card.deadline);
  return (
    <div className="bg-white rounded-xl shadow-2xl border border-indigo-200 border-l-4 border-l-indigo-400 p-3.5 flex flex-col gap-2 w-72 rotate-2 scale-105 opacity-95">
      <p className="text-sm font-semibold text-gray-800 leading-snug">{card.title}</p>
      {card.description && (
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{card.description}</p>
      )}
      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full w-fit ${isPast ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {deadlineLabel}
      </span>
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
      className={`flex-1 flex flex-col gap-2.5 p-3 overflow-y-auto max-h-[calc(100vh-280px)] rounded-b-xl transition-colors duration-150 ${isOver ? 'bg-indigo-50/80' : ''}`}
    >
      {children}
    </div>
  );
}

// ─── Shared modal shell ───────────────────────────────────────────────────────
function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
      <div className="animate-scale-in bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        {children}
      </div>
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
    const overIdRaw = String(over.id);

    // over could be a list ID (numeric) or a card-drop zone (`card-drop-N`)
    let targetListId: number;
    if (overIdRaw.startsWith('card-drop-')) {
      const overCardId = Number(overIdRaw.replace('card-drop-', ''));
      const overCard = board.lists.flatMap((l) => l.cards).find((c) => c.id === overCardId);
      if (!overCard) return;
      targetListId = overCard.listId;
    } else {
      targetListId = Number(overIdRaw);
      if (!board.lists.some((l) => l.id === targetListId)) return;
    }

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
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
          <span className="text-slate-400 text-sm font-medium">Loading board…</span>
        </div>
      </div>
    );
  }

  if (fetchError || !board) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 min-h-screen">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-400 font-medium">{fetchError || 'Board not found'}</p>
          <Link href="/boards" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">← Back to boards</Link>
        </div>
      </div>
    );
  }

  const boardMemberIds = new Set(board.users.map((u) => u.id));
  const nonMembers = allUsers.filter((u) => !boardMemberIds.has(u.id));
  const totalCards = board.lists.reduce((sum, l) => sum + l.cards.length, 0);

  return (
    <div className="flex flex-col flex-1 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Board header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm px-6 py-4 animate-fade-in">
        <div className="max-w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Back button */}
            <Link
              href="/boards"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 shrink-0 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Boards
            </Link>

            <div className="w-px h-6 bg-white/10" />

            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white truncate">{board.title}</h1>
              {board.description && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">{board.description}</p>
              )}
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-3 ml-2">
              <span className="text-xs text-slate-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                {board.lists.length} lists
              </span>
              <span className="text-xs text-slate-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                {totalCards} cards
              </span>
            </div>
          </div>

          {/* Right: members + add member */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex -space-x-2">
              {board.users.slice(0, 5).map((u) => (
                <span
                  key={u.id}
                  className="w-7 h-7 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center ring-2 ring-slate-900 uppercase"
                  title={u.username}
                >
                  {u.username[0]}
                </span>
              ))}
              {board.users.length > 5 && (
                <span className="w-7 h-7 rounded-full bg-slate-600 text-slate-300 text-xs font-bold flex items-center justify-center ring-2 ring-slate-900">
                  +{board.users.length - 5}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Member
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
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 p-6 h-full min-w-max items-start">
            {board.lists.map((list, colIdx) => {
              const style = COLUMN_STYLES[list.title] ?? DEFAULT_COLUMN_STYLE;
              const isDefaultList = list.title in TITLE_TO_STATUS;

              return (
                <div
                  key={list.id}
                  style={{ animationDelay: `${colIdx * 60}ms` }}
                  className={`animate-slide-up flex flex-col rounded-2xl w-72 shrink-0 bg-white/95 shadow-xl border-t-4 ${style.accent}`}
                >
                  {/* Column header */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${style.headerText}`}>{list.title}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                        {list.cards.length}
                      </span>
                    </div>
                    {!isDefaultList && (
                      <button
                        onClick={() => handleDeleteList(list.id, list.title)}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                        title="Delete list"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Cards (droppable area) */}
                  <DroppableCardList list={list}>
                    {list.cards.map((card) => (
                      <DraggableCard
                        key={card.id}
                        card={card}
                        listTitle={list.title}
                        boardMembers={board.users}
                        onEdit={openEdit}
                        onDelete={handleDeleteCard}
                        onAssign={handleAssignUserToCard}
                      />
                    ))}
                    <button
                      onClick={() => { setCreateTarget(list); setCreateError(''); }}
                      className="group/add mt-1 w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 bg-transparent hover:bg-indigo-50 py-2.5 rounded-xl border border-dashed border-gray-200 hover:border-indigo-300 transition-all duration-150 font-medium"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add card
                    </button>
                  </DroppableCardList>
                </div>
              );
            })}

            {/* Add list column */}
            {showAddList ? (
              <div className="animate-scale-in bg-white/95 rounded-2xl w-72 shrink-0 shadow-xl p-4">
                <form onSubmit={handleAddList} className="flex flex-col gap-3">
                  <p className="text-sm font-semibold text-gray-700 mb-1">New List</p>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 focus:bg-white transition-all"
                    placeholder="List title…"
                  />
                  {addListError && (
                    <p className="text-xs text-red-500">{addListError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={addingList}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 active:scale-95 text-white text-xs font-semibold rounded-xl py-2 transition-all"
                    >
                      {addingList ? 'Adding…' : 'Add list'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddList(false); setNewListTitle(''); setAddListError(''); }}
                      className="flex-1 border border-gray-200 rounded-xl py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setShowAddList(true)}
                className="flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-300 rounded-2xl w-72 shrink-0 py-6 border-2 border-dashed border-white/10 hover:border-indigo-500/40 bg-white/5 hover:bg-indigo-500/5 transition-all duration-200 active:scale-95"
              >
                <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-semibold">Add list</span>
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
        <Modal>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-gray-800">New Card</h2>
          </div>
          <p className="text-sm text-gray-400 mb-5">
            Adding to <span className="font-semibold text-gray-600">{createTarget.title}</span>
          </p>
          <form onSubmit={handleCreateCard} className="flex flex-col gap-4">
            {createError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{createError}</p>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                required
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                placeholder="Task title"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none transition-all"
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
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
              />
            </div>
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={() => setCreateTarget(null)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 active:scale-95 text-white text-sm font-semibold rounded-xl py-2.5 transition-all shadow-md shadow-indigo-200"
              >
                {creating ? 'Adding…' : 'Add Card'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit card modal */}
      {editState && (
        <Modal>
          <h2 className="text-lg font-bold text-gray-800 mb-5">Edit Card</h2>
          <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
            {saveError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{saveError}</p>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                required
                value={editState.title}
                onChange={(e) => setEditState({ ...editState, title: e.target.value })}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={3}
                value={editState.description}
                onChange={(e) => setEditState({ ...editState, description: e.target.value })}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Deadline</label>
              <input
                type="date"
                required
                value={editState.deadline}
                onChange={(e) => setEditState({ ...editState, deadline: e.target.value })}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={editState.status}
                onChange={(e) => setEditState({ ...editState, status: e.target.value as Status })}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
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
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 active:scale-95 text-white text-sm font-semibold rounded-xl py-2.5 transition-all shadow-md shadow-indigo-200"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add member to board modal */}
      {showAddMember && (
        <Modal>
          <h2 className="text-lg font-bold text-gray-800 mb-5">Add Member</h2>
          {nonMembers.length === 0 ? (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">All users are already members of this board.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <select
                value={selectedUserId ?? ''}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
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
              className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
            >
              Cancel
            </button>
            {nonMembers.length > 0 && (
              <button
                onClick={handleAddMemberToBoard}
                disabled={!selectedUserId || addingMember}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 active:scale-95 text-white text-sm font-semibold rounded-xl py-2.5 transition-all shadow-md shadow-indigo-200"
              >
                {addingMember ? 'Adding…' : 'Add Member'}
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Assign-user dropdown ─────────────────────────────────────────────────────
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
        className="w-5 h-5 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-400 hover:text-indigo-500 text-[10px] flex items-center justify-center transition-colors font-bold"
        title="Assign user"
      >
        +
      </button>
      {open && (
        <div className="absolute bottom-7 left-0 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-10 min-w-max">
          {unassigned.map((u) => (
            <button
              key={u.id}
              onClick={() => { onAssign(card.id, u.id); setOpen(false); }}
              className="w-full text-left text-xs px-3.5 py-2 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 transition-colors"
            >
              {u.username}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
