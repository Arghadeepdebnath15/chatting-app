import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
  userId?: string;
  token?: string | null;
}

export const SocketProvider = ({ children, userId, token }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const serverUrl = (import.meta as any).env.VITE_API_URL || `http://${window.location.hostname}:3002`;
    const newSocket = io(serverUrl, {
      auth: token ? { token } : undefined,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
      if (userId) {
        newSocket.emit('join', userId);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
