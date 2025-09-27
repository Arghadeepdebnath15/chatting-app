import React, { useState } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Smile, Paperclip, Mic, Send, Users } from 'lucide-react';
import { Chat, Message, Screen, User } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface GroupChatScreenProps {
  chat: Chat;
  onBack: () => void;
  onNavigateToScreen: (screen: Screen) => void;
  user: User;
  token: string;
}

export function GroupChatScreen({ chat, onBack, onNavigateToScreen, user, token }: GroupChatScreenProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSenderName = (senderId: string) => {
    if (senderId === user.id) return 'You';
    // For groups, need to fetch participant names, but for now, placeholder
    return 'Unknown';
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: user.id,
        content: message,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const participantCount = chat.participants.length;

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="bg-green-500 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={onBack}
              className="mr-3 p-1 hover:bg-green-600 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center">
              <div className="relative mr-3">
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-white border border-green-500 rounded-full flex items-center justify-center">
                  <Users className="w-2 h-2 text-green-500" />
                </div>
              </div>
              <div>
                <h2 className="text-lg">{chat.name}</h2>
                <p className="text-xs text-green-100">
                  {participantCount} participants
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-green-600 rounded-full transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-green-600 rounded-full transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-green-600 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Participants Bar */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-500" />
          <div className="flex -space-x-2">
            {chat.participants.slice(0, 4).map((participantId) => (
              <img
                key={participantId}
                src={'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'}
                alt="Participant"
                className="w-8 h-8 rounded-full border-2 border-white object-cover"
              />
            ))}
            {chat.participants.length > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
                <span className="text-xs text-gray-600">+{chat.participants.length - 4}</span>
              </div>
            )}
          </div>
          <span className="text-sm text-gray-600 ml-2">
            {participantCount} participants
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
              {msg.senderId !== user.id && (
                <img
                  src={'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'}
                  alt="Sender"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div
                className={`px-4 py-2 rounded-2xl ${
                  msg.senderId === user.id
                    ? 'bg-green-500 text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                }`}
              >
                {msg.senderId !== user.id && (
                  <p className="text-xs text-green-600 mb-1">{getSenderName(msg.senderId)}</p>
                )}
                <p className="break-words">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  msg.senderId === user.id ? 'text-green-100' : 'text-gray-500'
                }`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full pr-10 rounded-full border-gray-300"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 transition-colors">
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          {message.trim() ? (
            <Button
              onClick={handleSendMessage}
              className="p-2 bg-green-500 hover:bg-green-600 rounded-full"
            >
              <Send className="w-5 h-5 text-white" />
            </Button>
          ) : (
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}