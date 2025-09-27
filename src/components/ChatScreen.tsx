import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, Smile, Paperclip, Mic, Send, Check, CheckCheck } from 'lucide-react';
import { Chat, Message, Screen, User } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useTheme } from './ThemeContext';
import { useSocket } from '../contexts/SocketContext';
import { API_BASE } from '../config';
import { useIsMobile } from './ui/use-mobile';

interface ChatScreenProps {
  chat: Chat;
  onBack: () => void;
  onNavigateToScreen: (screen: Screen) => void;
  onNavigateToProfile: (userId: string) => void;
  user: User;
  token: string;
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
  setCallInitiator: (initiator: 'me' | 'other' | null) => void;
}

export function ChatScreen({ chat, onBack, onNavigateToScreen, onNavigateToProfile, user, token, selectedUserId, setSelectedUserId, setCallInitiator }: ChatScreenProps) {
  const { theme } = useTheme();
  const { socket, isConnected } = useSocket();
  const isMobile = useIsMobile();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [localIsOnline, setLocalIsOnline] = useState(chat.isOnline || false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const userId = user.id;
  const contactId = chat.participants[0];

  // Heights for layout
  const NAVBAR_HEIGHT = 56; // px, adjust to your bottom navbar height
  const INPUT_BAR_HEIGHT = 32; // px, adjust if your input bar is taller

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/messages/${userId}/${contactId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          const apiMessages: Message[] = data.map((msg: any) => ({
            id: msg._id,
            senderId: msg.senderId,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            type: msg.type,
            status: msg.status || 'sent',
            url: msg.url,
            fileName: msg.fileName,
          }));
          setMessages(apiMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
        } else {
          setMessages([]);
          console.error('Failed to fetch messages');
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setMessages([]);
      }
    };
    fetchMessages();

    // Mark messages as read when opening the chat
    const markAsRead = async () => {
      try {
        await fetch(`${API_BASE}/api/mark-read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chatId: contactId }),
        });
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    };
    markAsRead();
  }, [chat.id, userId, contactId, token]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  // Socket listeners
  useEffect(() => {
    if (socket && isConnected) {
      const handleReceiveMessage = (msg: any) => {
        if (msg.senderId === userId && msg.receiverId === contactId) return;
        if (msg.senderId === contactId || msg.receiverId === contactId) {
          const receivedMessage: Message = {
            id: msg._id,
            senderId: msg.senderId,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            type: msg.type,
            status: msg.status || 'delivered'
          };
          if (msg.type === 'file' || msg.type === 'voice') {
            receivedMessage.url = msg.url;
            receivedMessage.fileName = msg.fileName;
          }
          setMessages(prev => [...prev, receivedMessage]);
          socket.emit('messageDelivered', { messageId: msg._id, senderId: msg.senderId });

          // Mark as read since chat is open
          const markAsRead = async () => {
            try {
              await fetch(`${API_BASE}/api/mark-read`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ chatId: contactId }),
              });
            } catch (err) {
              console.error('Error marking as read:', err);
            }
          };
          markAsRead();
        }
      };

      const handleMessageSent = (msg: any) => {
        setMessages(prev => prev.map(m =>
          m.id === msg.tempId ? { ...m, id: msg._id, status: 'sent' } : m
        ));
      };

      const handleMessageDelivered = (data: { messageId: string }) => {
        setMessages(prev => prev.map(m =>
          m.id === data.messageId ? { ...m, status: 'delivered' } : m
        ));
      };

      const handleMessageRead = (data: { messageId: string }) => {
        setMessages(prev => prev.map(m =>
          m.id === data.messageId ? { ...m, status: 'read' } : m
        ));
      };

      const handleUserOnline = (data: { userId: string }) => {
        if (data.userId === contactId) setLocalIsOnline(true);
      };
      const handleUserOffline = (data: { userId: string }) => {
        if (data.userId === contactId) setLocalIsOnline(false);
      };

      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('messageSent', handleMessageSent);
      socket.on('messageDelivered', handleMessageDelivered);
      socket.on('messageRead', handleMessageRead);
      socket.on('userOnline', handleUserOnline);
      socket.on('userOffline', handleUserOffline);

      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('messageSent', handleMessageSent);
        socket.off('messageDelivered', handleMessageDelivered);
        socket.off('messageRead', handleMessageRead);
        socket.off('userOnline', handleUserOnline);
        socket.off('userOffline', handleUserOffline);
      };
    }
  }, [socket, isConnected, userId, contactId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSendMessage = () => {
    if (!message.trim() || !socket) return;
    const tempId = Date.now().toString();
    const newMessage = {
      senderId: userId,
      receiverId: contactId,
      content: message,
      type: 'text',
      tempId,
    };
    socket.emit('sendMessage', newMessage);

    const localMessage: Message = {
      id: tempId,
      senderId: userId,
      content: message,
      timestamp: new Date(),
      type: 'text',
      status: 'sending',
    };
    setMessages(prev => [...prev, localMessage]);
    setMessage('');

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadAndSendVoice(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAndSendVoice = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      const fileName = `voice_${Date.now()}.webm`;
      formData.append('file', audioBlob, fileName);

      const uploadResponse = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const { url } = uploadData;

      const tempId = Date.now().toString();
      const newMessage = {
        senderId: userId,
        receiverId: contactId,
        content: 'Voice message',
        type: 'voice',
        url,
        fileName,
        tempId,
      };

      socket?.emit('sendMessage', newMessage);

      const localMessage: Message = {
        id: tempId,
        senderId: userId,
        content: 'Voice message',
        timestamp: new Date(),
        type: 'voice',
        url,
        fileName,
        status: 'sending',
      };
      setMessages(prev => [...prev, localMessage]);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    } catch (error) {
      console.error('Error uploading voice:', error);
      alert('Failed to send voice message.');
    }
  };



  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="text-white px-4 py-3 shadow-lg flex-shrink-0" style={{backgroundColor: '#2d4a1a'}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-3 p-1 hover:bg-green-800 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center cursor-pointer" onClick={(e) => { e.stopPropagation(); onNavigateToProfile(contactId); }}>
              <div className="relative mr-3">
                <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full object-cover" />
                {localIsOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-green-500 rounded-full"></div>}
              </div>
              <div>
                <h2 className="text-lg">{chat.name}</h2>
                <p className="text-xs text-green-100">{localIsOnline ? 'Online' : 'Last seen recently'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setSelectedUserId(contactId); setCallInitiator('me'); onNavigateToScreen('videoCall'); }}
              className="p-2 hover:bg-green-800 rounded-full transition-colors"
            >
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-green-800 rounded-full transition-colors"><Phone className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-green-800 rounded-full transition-colors"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ paddingBottom: NAVBAR_HEIGHT + INPUT_BAR_HEIGHT + 16 }}
      >
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'voice' ? (
              <div className={`max-w-xs lg:max-w-md p-3 rounded-2xl shadow-sm ${
                msg.senderId === userId ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Mic className={`w-4 h-4 ${msg.senderId === userId ? 'text-blue-100' : 'text-gray-500'}`} />
                  <span className="text-sm font-medium truncate">Voice message</span>
                </div>
                {msg.url && (
                  <audio
                    controls
                    src={msg.url}
                    className="w-full mb-2"
                    preload="metadata"
                  >
                    Your browser does not support the audio element.
                  </audio>
                )}
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${msg.senderId === userId ? 'text-blue-100' : 'text-gray-500'}`}>{formatTime(msg.timestamp)}</p>
                  {msg.senderId === userId && (
                    <div className="flex items-center ml-2">
                      {msg.status === 'sending' && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      {msg.status === 'sent' && <Check className="w-4 h-4 text-blue-100" />}
                      {msg.status === 'delivered' && <CheckCheck className="w-4 h-4 text-blue-200" />}
                      {msg.status === 'read' && <CheckCheck className="w-4 h-4 text-white" />}
                    </div>
                  )}
                </div>
              </div>
            ) : msg.type === 'file' ? (
              <div className={`max-w-xs lg:max-w-md p-3 rounded-2xl shadow-sm ${
                msg.senderId === userId ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md'
              }`}>
                <div className="flex items-center space-x-2 mb-1">
                  <Paperclip className={`w-4 h-4 ${msg.senderId === userId ? 'text-blue-100' : 'text-gray-500'}`} />
                  <span className="text-sm font-medium truncate">{msg.fileName}</span>
                </div>
                {msg.url && (
                  <a
                    href={msg.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={msg.fileName}
                    className={`text-xs underline ${msg.senderId === userId ? 'text-blue-100 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`}
                  >
                    Download
                  </a>
                )}
                {msg.url && msg.url.startsWith('http') && msg.fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <div className="mt-2">
                    <img src={msg.url} alt={msg.fileName} className="max-w-full max-h-48 rounded-lg" />
                  </div>
                ) : null}
                <div className="flex items-center justify-between mt-2">
                  <p className={`text-xs ${msg.senderId === userId ? 'text-blue-100' : 'text-gray-500'}`}>{formatTime(msg.timestamp)}</p>
                  {msg.senderId === userId && (
                    <div className="flex items-center ml-2">
                      {msg.status === 'sending' && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      {msg.status === 'sent' && <Check className="w-4 h-4 text-blue-100" />}
                      {msg.status === 'delivered' && <CheckCheck className="w-4 h-4 text-blue-200" />}
                      {msg.status === 'read' && <CheckCheck className="w-4 h-4 text-white" />}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                msg.senderId === userId ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
              }`}>
                <p className="break-words">{msg.content}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-xs ${msg.senderId === userId ? 'text-blue-100' : 'text-gray-500'}`}>{formatTime(msg.timestamp)}</p>
                  {msg.senderId === userId && (
                    <div className="flex items-center ml-2">
                      {msg.status === 'sending' && <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>}
                      {msg.status === 'sent' && <Check className="w-4 h-4 text-gray-400" />}
                      {msg.status === 'delivered' && <CheckCheck className="w-4 h-4 text-gray-300" />}
                      {msg.status === 'read' && <CheckCheck className="w-4 h-4 text-blue-300" />}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar above navbar */}
      <div
        className="flex-shrink-0 bg-white border-t border-gray-200 p-4 flex items-center space-x-1 fixed z-20"
        style={{ left: isMobile ? 0 : '22vw', bottom: NAVBAR_HEIGHT, right: 0 }}
      >
        <button className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors">
          <Smile className="w-5 h-5" />
        </button>
        <div className="flex-1 relative min-h-8">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full pr-4 h-8 rounded-full border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:ring-offset-2 shadow-sm transition-all text-sm"
          />
        </div>
        {message.trim() ? (
          <Button onClick={handleSendMessage} className="p-1.5 bg-green-500 hover:bg-green-600 rounded-full">
            <Send className="w-5 h-5 text-white" />
          </Button>
        ) : (
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`p-1.5 transition-colors ${isRecording ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
