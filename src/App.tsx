import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './components/ThemeContext';
import { SocketProvider, useSocket } from './contexts/SocketContext';
import { BottomNavigation } from './components/BottomNavigation';
import { LoginScreen } from './components/LoginScreen';
import { ChatListScreen } from './components/ChatListScreen';
import { ChatScreen } from './components/ChatScreen';
import { GroupChatScreen } from './components/GroupChatScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { OtherUserProfileScreen } from './components/OtherUserProfileScreen';
import { VideoCallScreen } from './components/VideoCallScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { CallScreen } from './components/CallScreen';
import { Screen, Message, Chat, Call, User } from './types';
import { API_BASE } from './config';
import { useIsMobile } from './components/ui/use-mobile';

function AppContent({ user, setUser, token, setToken }: { user: User | null; setUser: (u: User | null) => void; token: string | null; setToken: (t: string | null) => void }) {
  const { socket } = useSocket();
  const isMobile = useIsMobile();
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      const saved = localStorage.getItem('currentScreen');
      if (saved === 'chat' || saved === 'groupChat') {
        return 'chatList';
      }
      return saved ? (saved as Screen) : 'chatList';
    }
    return 'login';
  });
  const [selectedChatId, setSelectedChatId] = useState<string | null>(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      return null;
    }
    return null;
  });
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [callInitiator, setCallInitiator] = useState<'me' | 'other' | null>(null);
  const [pendingOffer, setPendingOffer] = useState<RTCSessionDescriptionInit | null>(null);


  const saveNavigationState = (screen: Screen, chatId: string | null) => {
    localStorage.setItem('currentScreen', screen);
    if (chatId) {
      localStorage.setItem('selectedChatId', chatId);
    } else {
      localStorage.removeItem('selectedChatId');
    }
  };

  const fetchChats = async (authToken: string) => {
    setIsLoadingChats(true);
    try {
      const response = await fetch(`${API_BASE}/api/chats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        const parsedChats = data.map((chat: any) => ({
          ...chat,
          lastMessageTime: new Date(chat.lastMessageTime)
        }));
        setChats(parsedChats);
        // Validate current screen if it's a chat screen
        if (currentScreen === 'chat' || currentScreen === 'groupChat') {
          if (!selectedChatId || !parsedChats.find((c: Chat) => c.id === selectedChatId)) {
            setCurrentScreen('chatList');
            setSelectedChatId(null);
            localStorage.removeItem('currentScreen');
            localStorage.removeItem('selectedChatId');
          }
        }
      } else {
        console.error('Failed to fetch chats:', response.status, response.statusText);
        setChats([]);
        setCurrentScreen('chatList');
        setSelectedChatId(null);
        localStorage.removeItem('currentScreen');
        localStorage.removeItem('selectedChatId');
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
      setCurrentScreen('chatList');
      setSelectedChatId(null);
      localStorage.removeItem('currentScreen');
      localStorage.removeItem('selectedChatId');
    } finally {
      setIsLoadingChats(false);
    }
  };



  const calls: Call[] = [
    {
      id: '1',
      contactId: '1',
      contactName: 'Sarah Johnson',
      contactAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b808?w=150&h=150&fit=crop&crop=face',
      type: 'video',
      direction: 'outgoing',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      duration: '15:32'
    },
    {
      id: '2',
      contactId: '2',
      contactName: 'Mike Chen',
      contactAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      type: 'voice',
      direction: 'incoming',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      duration: '8:45'
    },
    {
      id: '3',
      contactId: '3',
      contactName: 'Emma Wilson',
      contactAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      type: 'voice',
      direction: 'missed',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  ];

  const selectedChat = selectedChatId ? chats.find(chat => chat.id === selectedChatId) : null;

  const navigateToScreen = (screen: Screen | string) => {
    const typedScreen = typeof screen === 'string' ? screen as Screen : screen;
    setCurrentScreen(typedScreen);
    saveNavigationState(typedScreen, null);
    // Reset selected chat when navigating to chat list or other main screens
    if (typedScreen === 'chatList' || typedScreen === 'calls' || typedScreen === 'profile' || typedScreen === 'settings') {
      setSelectedChatId(null);
    }
    // Reset selected user when navigating to profile (own profile)
    if (typedScreen === 'profile') {
      setSelectedUserId(null);
    }
  };

  const navigateToChat = (chatId: string) => {
    setSelectedChatId(chatId);
    const chat = chats.find(c => c.id === chatId);
    const newScreen = chat?.type === 'group' ? 'groupChat' : 'chat';
    setCurrentScreen(newScreen);
    saveNavigationState(newScreen, chatId);
    // Remove notification badge by setting unreadCount to 0
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c));
    // Mark as read on server
    if (token) {
      fetch(`${API_BASE}/api/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId }),
      }).catch(err => console.error('Error marking as read:', err));
    }
  };

  const navigateToProfile = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentScreen('profile');
    saveNavigationState('profile', null);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Default to chat list with no selection on every app open
      setCurrentScreen('chatList');
      setSelectedChatId(null);
      // Fetch chats to validate chat screens
      fetchChats(storedToken);
    }
  }, []); // Run once on mount

  useEffect(() => {
    if (socket) {
      socket.on('call-offer', (data) => {
        setSelectedUserId(data.from);
        setCallInitiator('other');
        setPendingOffer(data.offer);
        setCurrentScreen('videoCall');
      });
    }
    return () => {
      if (socket) {
        socket.off('call-offer');
      }
    };
  }, [socket]);

  const handleAuthSuccess = async (authUser: User, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(authUser));
    await fetchChats(authToken);
    setCurrentScreen('chatList');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentScreen');
    localStorage.removeItem('selectedChatId');
    setCurrentScreen('login');
    setSelectedChatId(null);
  };

  return (
    <ThemeProvider>
      <SocketProvider userId={user?.id} token={token}>
        <div className="h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
          {!user && currentScreen === 'login' && (
            <LoginScreen onAuthSuccess={handleAuthSuccess} />
          )}
          {user && token && (
            <>
              {/* Main Content Area */}
              <div className="flex-1 overflow-hidden pb-24">
                {(!isMobile && (currentScreen === 'chat' || currentScreen === 'groupChat' || currentScreen === 'chatList')) ? (
                  <div className="flex h-full">
                    <div className="w-3/10 border-r border-border">
                      <ChatListScreen
                        chats={chats}
                        onNavigateToChat={navigateToChat}
                        onNavigateToScreen={navigateToScreen}
                        onNavigateToProfile={navigateToProfile}
                        user={user!}
                        token={token!}
                        setChats={setChats}
                        fetchChats={() => fetchChats(token!)}
                        selectedChatId={selectedChatId}
                      />
                    </div>
                    <div className="flex-1">
                      {currentScreen === 'chat' && selectedChat && (
                        <ChatScreen
                          chat={selectedChat}
                          onBack={() => { setCurrentScreen('chatList'); setSelectedChatId(null); }}
                          onNavigateToScreen={navigateToScreen}
                          onNavigateToProfile={navigateToProfile}
                          user={user!}
                          token={token!}
                          selectedUserId={selectedUserId}
                          setSelectedUserId={setSelectedUserId}
                          setCallInitiator={setCallInitiator}
                        />
                      )}
                      {currentScreen === 'groupChat' && selectedChat && (
                        <GroupChatScreen
                          chat={selectedChat}
                          onBack={() => { setCurrentScreen('chatList'); setSelectedChatId(null); }}
                          onNavigateToScreen={navigateToScreen}
                          user={user!}
                          token={token!}
                        />
                      )}
                        {currentScreen === 'chatList' && (
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center p-8 bg-muted rounded-lg shadow-lg max-w-md">
                              <div className="text-6xl mb-4">💬</div>
                              <h2 className="text-2xl font-semibold text-muted-foreground mb-2">Welcome to ChatApp</h2>
                              <p className="text-muted-foreground">Select a conversation from the sidebar to start messaging</p>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                ) : (
                  <>
                    {currentScreen === 'chatList' && (
                      <ChatListScreen
                        chats={chats}
                        onNavigateToChat={navigateToChat}
                        onNavigateToScreen={navigateToScreen}
                        onNavigateToProfile={navigateToProfile}
                        user={user!}
                        token={token!}
                        setChats={setChats}
                        fetchChats={() => fetchChats(token!)}
                        selectedChatId={selectedChatId}
                      />
                    )}
                    {currentScreen === 'chat' && selectedChat && (
                      <ChatScreen
                        chat={selectedChat}
                        onBack={() => { setCurrentScreen('chatList'); setSelectedChatId(null); }}
                        onNavigateToScreen={navigateToScreen}
                        onNavigateToProfile={navigateToProfile}
                        user={user!}
                        token={token!}
                        selectedUserId={selectedUserId}
                        setSelectedUserId={setSelectedUserId}
                        setCallInitiator={setCallInitiator}
                      />
                    )}
                    {currentScreen === 'groupChat' && selectedChat && (
                      <GroupChatScreen
                        chat={selectedChat}
                        onBack={() => { setCurrentScreen('chatList'); setSelectedChatId(null); }}
                        onNavigateToScreen={navigateToScreen}
                        user={user!}
                        token={token!}
                      />
                    )}
                    {currentScreen === 'profile' && (
                      selectedUserId ? (
                        <OtherUserProfileScreen
                          onBack={() => { setCurrentScreen('chatList'); setSelectedUserId(null); }}
                          onNavigateToScreen={navigateToScreen}
                          user={user!}
                          token={token!}
                          selectedUserId={selectedUserId}
                          setSelectedUserId={setSelectedUserId}
                        />
                      ) : (
                        <ProfileScreen
                          onBack={() => setCurrentScreen('chatList')}
                          onNavigateToScreen={navigateToScreen}
                          user={user!}
                          token={token!}
                        />
                      )
                    )}
                    {currentScreen === 'settings' && (
                      <SettingsScreen
                        onBack={() => setCurrentScreen('chatList')}
                        onNavigateToScreen={navigateToScreen}
                        onLogout={handleLogout}
                        user={user!}
                        token={token!}
                      />
                    )}
                    {currentScreen === 'calls' && (
                      <CallScreen
                        calls={calls}
                        onBack={() => setCurrentScreen('chatList')}
                      />
                    )}
                    {currentScreen === 'videoCall' && selectedUserId && (
                      <VideoCallScreen
                        onBack={() => { setCurrentScreen('chatList'); setSelectedUserId(null); setPendingOffer(null); }}
                        selectedUserId={selectedUserId}
                        userId={user!.id}
                        isCaller={callInitiator === 'me'}
                        pendingOffer={pendingOffer}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Persistent Bottom Navigation */}
              <BottomNavigation
                currentScreen={currentScreen}
                onNavigateToScreen={navigateToScreen}
              />
            </>
          )}
        </div>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  return (
    <ThemeProvider>
      <SocketProvider userId={user?.id} token={token}>
        <AppContent user={user} setUser={setUser} token={token} setToken={setToken} />
      </SocketProvider>
    </ThemeProvider>
  );
}
