import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Settings, User, Pin, Archive, Bell, BellOff, X } from 'lucide-react';
import { Chat, Screen, User as UserType } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';
import { useSocket } from '../contexts/SocketContext';
import { API_BASE } from '../config';

interface ChatListScreenProps {
  chats: Chat[];
  onNavigateToChat: (chatId: string) => void;
  onNavigateToScreen: (screen: Screen) => void;
  onNavigateToProfile: (userId: string) => void;
  user: UserType;
  token: string;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  fetchChats: () => Promise<void>;
}

export function ChatListScreen({ chats, onNavigateToChat, onNavigateToScreen, onNavigateToProfile, user, token, setChats, fetchChats }: ChatListScreenProps) {
  const { theme } = useTheme();
  const { socket, isConnected } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mobileInput, setMobileInput] = useState('');
  const [error, setError] = useState('');

  // Listen for real-time messages and online status updates
  useEffect(() => {
    if (socket && isConnected) {
      const handleReceiveMessage = (msg: any) => {
        // Only update if this message is for the current user
        if (msg.receiverId === user.id) {
          setChats(prevChats => {
            const updatedChats = prevChats.map(chat => {
              if (chat.participants[0] === msg.senderId) {
                return {
                  ...chat,
                  lastMessage: msg.content,
                  lastMessageTime: new Date(msg.timestamp),
                  unreadCount: chat.unreadCount + 1
                };
              }
              return chat;
            });
            // Re-sort by lastMessageTime descending
            return updatedChats.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
          });
        }
      };

      const handleUserOnline = (data: { userId: string }) => {
        setChats(prevChats => {
          return prevChats.map(chat => {
            if (chat.participants[0] === data.userId) {
              return { ...chat, isOnline: true };
            }
            return chat;
          });
        });
      };

      const handleUserOffline = (data: { userId: string }) => {
        setChats(prevChats => {
          return prevChats.map(chat => {
            if (chat.participants[0] === data.userId) {
              return { ...chat, isOnline: false };
            }
            return chat;
          });
        });
      };

      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('userOnline', handleUserOnline);
      socket.on('userOffline', handleUserOffline);

      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('userOnline', handleUserOnline);
        socket.off('userOffline', handleUserOffline);
      };
    }
  }, [socket, isConnected, user.id, setChats]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedChats = filteredChats.filter(chat => chat.isPinned);
  const regularChats = filteredChats.filter(chat => !chat.isPinned);

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-700 dark:to-emerald-700 text-white px-4 py-4 shadow-xl"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <motion.h1 
            className="text-2xl font-bold"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            ChatApp
          </motion.h1>
          <motion.button 
            onClick={() => onNavigateToScreen('settings')}
            className="p-3 hover:bg-white/10 rounded-full transition-all duration-300 active:scale-95"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MoreVertical className="w-5 h-5" />
          </motion.button>
        </div>
        
        {/* Search */}
        <motion.div 
          className="relative"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
          <Input 
            placeholder="Search conversations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 h-12 bg-white/15 border-white/20 text-white placeholder-white/70 rounded-full backdrop-blur-sm focus:bg-white/20 transition-all duration-300"
          />
        </motion.div>
      </motion.div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {pinnedChats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="px-4 py-2 bg-muted/50 border-b border-border">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Pin className="w-4 h-4" />
                  Pinned
                </p>
              </div>
              {pinnedChats.map((chat, index) => (
                <ChatItem 
                  key={chat.id} 
                  chat={chat} 
                  onNavigateToChat={onNavigateToChat}
                  onNavigateToProfile={onNavigateToProfile}
                  formatTime={formatTime}
                  index={index}
                  isPinned={true}
                />
              ))}
            </motion.div>
          )}
          
          {regularChats.map((chat, index) => (
            <ChatItem 
              key={chat.id} 
              chat={chat} 
              onNavigateToChat={onNavigateToChat}
              onNavigateToProfile={onNavigateToProfile}
              formatTime={formatTime}
              index={index + pinnedChats.length}
              isPinned={false}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <motion.div 
        className="absolute bottom-24 right-6"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
      >
        <motion.button
          onClick={() => setIsAddModalOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-xl hover:shadow-2xl text-white flex items-center justify-center"
          whileHover={{ scale: 1.1, boxShadow: "0 20px 40px rgba(34, 197, 94, 0.4)" }}
          whileTap={{ scale: 0.9 }}
          initial={{ boxShadow: "0 10px 25px rgba(34, 197, 94, 0.3)" }}
        >
          <Plus className="w-7 h-7" />
        </motion.button>
      </motion.div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Add Contact</h2>
                <button onClick={() => setIsAddModalOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Input
                placeholder="Enter mobile number"
                value={mobileInput}
                onChange={(e) => setMobileInput(e.target.value)}
                className="mb-4"
              />
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <div className="flex space-x-2">
                <Button
                  onClick={async () => {
                    if (!mobileInput) return;
                    try {
                      const response = await fetch(`${API_BASE}/api/search-user?mobile=${encodeURIComponent(mobileInput)}`, {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                      });
                      if (!response.ok) {
                        throw new Error('User not found');
                      }
                      const data = await response.json();
                      if (data.id === user.id) {
                        setError('Cannot add yourself as a contact');
                        return;
                      }
                      // Add contact
                      const addResponse = await fetch(`${API_BASE}/api/add-contact`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ contactId: data.id }),
                      });
                      if (!addResponse.ok) {
                        const errorData = await addResponse.json();
                        throw new Error(errorData.error || 'Failed to add contact');
                      }
                      // Refetch chats to update list
                      await fetchChats();
                      setIsAddModalOpen(false);
                      setMobileInput('');
                      setError('');
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Error adding contact');
                    }
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  Add
                </Button>
                <Button
                  onClick={() => setIsAddModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Chat Item Component
interface ChatItemProps {
  chat: Chat;
  onNavigateToChat: (chatId: string) => void;
  onNavigateToProfile: (userId: string) => void;
  formatTime: (date: Date) => string;
  index: number;
  isPinned: boolean;
}

function ChatItem({ chat, onNavigateToChat, onNavigateToProfile, formatTime, index, isPinned }: ChatItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => onNavigateToChat(chat.id)}
      className="flex items-center p-4 hover:bg-muted/50 border-b border-border cursor-pointer transition-all duration-300 active:bg-muted/70 group"
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <div className="relative mr-4">
        <motion.img
          src={chat.avatar}
          alt={chat.name}
          className="w-14 h-14 rounded-full object-cover ring-2 ring-transparent group-hover:ring-green-200 dark:group-hover:ring-green-800 transition-all duration-300 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          onClick={(e) => { e.stopPropagation(); if (chat.type === 'individual') onNavigateToProfile(chat.participants[0]); }}
        />
        {chat.isOnline && chat.type === 'individual' && (
          <motion.div 
            className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
          />
        )}
        {isPinned && (
          <motion.div 
            className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Pin className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </div>

      {/* Chat Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-foreground truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {chat.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatTime(chat.lastMessageTime)}
            </span>
            {chat.unreadCount > 0 && (
              <motion.div 
                className="bg-green-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-medium"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </motion.div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground truncate flex-1">
            {chat.isTyping ? (
              <motion.span 
                className="text-green-500 font-medium flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  typing...
                </motion.span>
              </motion.span>
            ) : (
              chat.lastMessage
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}