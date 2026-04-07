import type { Board, Card, List, Status, User } from './types';

const API_BASE = 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

// Auth
export const apiLogin = (email: string, password: string) =>
  request<User>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const apiSignup = (email: string, username: string, password: string) =>
  request<User>('/users', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  });

// Boards
export const getBoards = () => request<Board[]>('/boards');

export const getBoard = (id: number) => request<Board>(`/boards/${id}`);

export const createBoard = (title: string, description: string) =>
  request<Board>('/boards', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  });

export const updateBoard = (
  id: number,
  data: Partial<{ title: string; description: string }>,
) =>
  request<Board>(`/boards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteBoard = (id: number) =>
  request<Board>(`/boards/${id}`, { method: 'DELETE' });

export const addUserToBoard = (boardId: number, userId: number) =>
  request<Board>('/boards/add-user', {
    method: 'POST',
    body: JSON.stringify({ boardId, userId }),
  });

// Cards
export const createCard = (data: {
  title: string;
  description: string;
  deadline: string;
  listId: number;
  status?: Status;
}) =>
  request<Card>('/cards', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateCard = (id: number, data: Partial<Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'assignedUsers'>>) =>
  request<Card>(`/cards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteCard = (id: number) =>
  request<Card>(`/cards/${id}`, { method: 'DELETE' });

export const addUserToCard = (cardId: number, userId: number) =>
  request<Card>('/cards/add-user', {
    method: 'POST',
    body: JSON.stringify({ cardId, userId }),
  });

// Users
export const getUsers = () => request<User[]>('/users');

// Lists
export const createList = (title: string, boardId: number) =>
  request<List>('/lists', {
    method: 'POST',
    body: JSON.stringify({ title, boardId }),
  });

export const updateList = (id: number, title: string) =>
  request<List>(`/lists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });

export const deleteList = (id: number) =>
  request<List>(`/lists/${id}`, { method: 'DELETE' });
