export type Screen = 'login' | 'chatList' | 'chat' | 'groupChat' | 'profile' | 'settings' | 'calls' | 'videoCall';

export interface User {
  id: string;
  name: string;
  mobile: string;
  avatar?: string;
  status?: string;
  isOnline?: boolean;
  isBlocked?: boolean;
  blockedBy?: string[];
}

export interface Report {
  userId: string;
  reason: string;
  timestamp: Date;
  reportedBy: string;
}

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  status: string;
  isOnline: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'emoji' | 'voice' | 'file';
  imageUrl?: string;
  url?: string;
  fileName?: string;
  voiceDuration?: number;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  reactions?: { emoji: string; users: string[] }[];
  replyTo?: string;
}

export interface Chat {
  id: string;
  type: 'individual' | 'group';
  name: string;
  avatar: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
  messages: Message[];
  isTyping?: boolean;
  typingUsers?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
  wallpaper?: string;
}

export interface Call {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatar: string;
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: Date;
  duration?: string;
}
