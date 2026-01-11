import { User, Group, Post } from './types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Alex Chen',
  handle: '@alexc',
  avatar: 'https://picsum.photos/id/64/200/200',
  bio: 'CS Student 🎓 | Photographer 📸 | Coffee Lover ☕',
};

export const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'CS Study Group',
    icon: 'https://picsum.photos/id/0/100/100',
    description: 'Algorithms, Data Structures, and late night coding sessions.',
    members: 142,
    channels: [
      { id: 'c1', name: 'general', type: 'text' },
      { id: 'c2', name: 'homework-help', type: 'text' },
      { id: 'c3', name: 'resources', type: 'text' },
      { id: 'c4', name: 'Voice Lounge', type: 'voice' },
    ]
  },
  {
    id: 'g2',
    name: 'Campus Hiking',
    icon: 'https://picsum.photos/id/10/100/100',
    description: 'Exploring the trails every weekend.',
    members: 85,
    channels: [
      { id: 'c5', name: 'trail-talk', type: 'text' },
      { id: 'c6', name: 'photos', type: 'text' },
      { id: 'c7', name: 'events', type: 'text' },
    ]
  },
  {
    id: 'g3',
    name: 'Music Society',
    icon: 'https://picsum.photos/id/26/100/100',
    description: 'Jam sessions and concert trips.',
    members: 204,
    channels: [
      { id: 'c8', name: 'general', type: 'text' },
      { id: 'c9', name: 'jam-sessions', type: 'text' },
    ]
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    author: {
      id: 'u2',
      name: 'Sarah Jenkins',
      handle: '@sarahj',
      avatar: 'https://picsum.photos/id/65/200/200',
      bio: 'Art Major'
    },
    content: 'Just finished my final project for the semester! 🎨 so relieved.',
    image: 'https://picsum.photos/id/103/800/400',
    likes: 45,
    comments: 12,
    timestamp: '2 hours ago'
  },
  {
    id: 'p2',
    author: {
      id: 'u3',
      name: 'Mike Ross',
      handle: '@mikeross',
      avatar: 'https://picsum.photos/id/91/200/200',
      bio: 'Law Student'
    },
    content: 'Anyone want to grab study coffee at the library?',
    likes: 8,
    comments: 4,
    timestamp: '4 hours ago'
  }
];