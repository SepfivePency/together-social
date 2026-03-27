import { User, Group, Post } from './types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Alex Chen',
  handle: '@alexc',
  avatar: 'https://picsum.photos/id/64/200/200',
  bio: 'CS Student 🎓 | Photographer 📸 | Coffee Lover ☕',
  school: 'Stanford University',
  company: 'Google',
};

export const MOCK_GROUPS: Group[] = [];
export const MOCK_POSTS: Post[] = [];