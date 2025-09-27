import React from 'react';
import { MessageCircle, Phone, User, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeContext';
import { Screen } from '../types';

interface BottomNavigationProps {
  currentScreen: Screen;
  onNavigateToScreen: (screen: string) => void;
}

export function BottomNavigation({ currentScreen, onNavigateToScreen }: BottomNavigationProps) {
  const { theme } = useTheme();

  const navItems = [
    {
      id: 'chatList' as Screen,
      icon: MessageCircle,
      label: 'Chats',
      isActive: currentScreen === 'chatList' || currentScreen === 'chat' || currentScreen === 'groupChat'
    },
    {
      id: 'calls' as Screen,
      icon: Phone,
      label: 'Calls',
      isActive: currentScreen === 'calls'
    },
    {
      id: 'profile' as Screen,
      icon: User,
      label: 'Profile',
      isActive: currentScreen === 'profile'
    },
    {
      id: 'settings' as Screen,
      icon: Settings,
      label: 'Settings',
      isActive: currentScreen === 'settings'
    }
  ];

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 z-50 flex bg-card/95 backdrop-blur-lg border-t border-border shadow-xl"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = item.isActive;
        
        return (
          <motion.button
            key={item.id}
            onClick={() => onNavigateToScreen(item.id)}
            className={`flex-1 py-3 px-4 flex flex-col items-center gap-1 transition-all duration-300 relative ${
              isActive 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            {/* Active indicator */}
            {isActive && (
              <motion.div
                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-green-500 rounded-full"
                layoutId="activeTab"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            
            {/* Active background */}
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-green-50 dark:bg-green-900/20 rounded-t-xl"
                layoutId="activeBackground"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            
            <motion.div
              className="relative z-10"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-2' : 'stroke-1.5'}`} />
            </motion.div>
            
            <span className={`text-xs relative z-10 ${isActive ? 'font-semibold' : 'font-medium'}`}>
              {item.label}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}