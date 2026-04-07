export type Status = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface User {
  id: number;
  email: string;
  username: string;
}

export interface Card {
  id: number;
  title: string;
  description: string;
  status: Status;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  listId: number;
  assignedUsers: User[];
}

export interface List {
  id: number;
  title: string;
  boardId: number;
  createdAt: string;
  updatedAt: string;
  cards: Card[];
}

export interface Board {
  id: number;
  title: string;
  description: string;
  lists: List[];
  users: User[];
}
