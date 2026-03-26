export enum ViewState {
  HOME = 'HOME',
  GROUP = 'GROUP',
  PROFILE = 'PROFILE',
  DISCOVERY = 'DISCOVERY',
  CHAT = 'CHAT',
  GROUPS_MOBILE = 'GROUPS_MOBILE'
}

export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  school?: string;
  company?: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isAi?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
}

export interface Group {
  id: string;
  name: string;
  icon: string;
  description: string;
  channels: Channel[];
  members: number;
}