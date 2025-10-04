import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Smartphone,
  HelpCircle,
  Info,
  Palette
} from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeContext';
import { User as UserType } from '../types';
import { API_BASE } from '../config';

interface SettingsScreenProps {
  onBack: () => void;
  onNavigateToScreen: (screen: string) => void;
  onLogout: () => void;
  user: UserType | null;
  token: string | null;
}

export function SettingsScreen({ onBack, onLogout, user, token }: SettingsScreenProps) {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeen, setLastSeen] = useState(true);
  const [profile, setProfile] = useState<UserType | null>(user);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setProfile({
            id: data._id,
            name: data.name,
            mobile: data.mobile,
            avatar: data.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
            status: data.status || 'Available'
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [token]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    if (!confirm('Update profile photo?')) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const uploadResponse = await fetch(`${API_BASE}/api/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (uploadResponse.ok) {
        const { url } = await uploadResponse.json();

        // Update profile with new avatar
        const updateResponse = await fetch(`${API_BASE}/api/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ avatar: url }),
        });

        if (updateResponse.ok) {
          // Refetch profile
          const profileResponse = await fetch(`${API_BASE}/api/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (profileResponse.ok) {
            const data = await profileResponse.json();
            setProfile({
              id: data._id,
              name: data.name,
              mobile: data.mobile,
              avatar: data.avatar,
              status: data.status || 'Available'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  const settingsSections = [
    {
      title: 'Account',
      icon: User,
      color: 'bg-blue-100 text-blue-600',
      items: [
        { name: 'Profile', description: 'Edit your profile information' },
        { name: 'Phone Number', description: profile?.mobile || 'Loading...' },
        { name: 'Username', description: profile ? `@${profile.name.toLowerCase().replace(/\s+/g, '')}` : '@loading' }
      ]
    },
    {
      title: 'Privacy',
      icon: Shield,
      color: 'bg-green-100 text-green-600',
      items: [
        {
          name: 'Last Seen',
          description: 'Who can see when you were last online',
          toggle: true,
          value: lastSeen,
          onChange: setLastSeen
        },
        {
          name: 'Read Receipts',
          description: 'Send read receipts to contacts',
          toggle: true,
          value: readReceipts,
          onChange: setReadReceipts
        },
        { name: 'Blocked Contacts', description: '0 contacts' },
        { name: 'Two-Step Verification', description: 'Not enabled' }
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      color: 'bg-yellow-100 text-yellow-600',
      items: [
        {
          name: 'Message Notifications',
          description: 'Receive notifications for new messages',
          toggle: true,
          value: notifications,
          onChange: setNotifications
        },
        { name: 'Sound', description: 'Default notification sound' },
        { name: 'Vibration', description: 'Default vibration pattern' }
      ]
    },
    {
      title: 'Appearance',
      icon: Palette,
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      items: [
        {
          name: 'Dark Mode',
          description: `Currently using ${theme} theme`,
          toggle: true,
          value: theme === 'dark',
          onChange: () => toggleTheme()
        },
        { name: 'Chat Wallpaper', description: 'Default wallpaper' },
        { name: 'Font Size', description: 'Medium' }
      ]
    }
  ];

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <motion.div
        className="bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-700 dark:to-emerald-700 text-white px-4 py-4 shadow-xl"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center">
          <motion.button
            onClick={onBack}
            className="mr-4 p-2 hover:bg-white/10 rounded-full transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </motion.div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile Section */}
        <motion.div
          className="bg-card p-6 border-b border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-4 sm:space-y-0">
            <div className="relative">
              <motion.img
                src={profile?.avatar}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover ring-4 ring-green-200 dark:ring-green-800"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face';
                }}
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              style={{ display: 'none' }}
            />
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">{profile?.name || 'Loading...'}</h2>
              <p className="text-muted-foreground text-base sm:text-lg">{profile?.status || 'Available'}</p>
              <button
                onClick={() => document.getElementById('avatar-input')?.click()}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Edit Photo'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={sectionIndex}
            className="bg-card mt-4 border-b border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + sectionIndex * 0.1 }}
          >
            <div className="px-6 py-6">
              <div className="flex items-center space-x-3 mb-6">
                <motion.div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${section.color}`}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <section.icon className="w-6 h-6" />
                </motion.div>
                <h3 className="text-xl font-semibold text-foreground">{section.title}</h3>
              </div>

              <div className="space-y-2">
                {section.items.map((item, itemIndex) => (
                  <motion.div
                    key={itemIndex}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl transition-all duration-300 group cursor-pointer"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + itemIndex * 0.05 }}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>

                    {item.toggle ? (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Switch
                          checked={item.value}
                          onCheckedChange={item.onChange}
                        />
                      </motion.div>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Additional Options */}
        <motion.div
          className="bg-card mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <div className="px-6 py-6">
            <div className="space-y-2">
              <motion.button
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl transition-all duration-300 group"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Help & Support</p>
                    <p className="text-sm text-muted-foreground">Get help and contact support</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </motion.button>

              <motion.button
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl transition-all duration-300 group"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                    <Info className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">About</p>
                    <p className="text-sm text-muted-foreground">Version 2.1.0</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </motion.button>

              {/* Logout Item */}
              <motion.button
                className="w-full flex items-center justify-between p-4 hover:bg-destructive/10 rounded-xl transition-all duration-300 group cursor-pointer"
                onClick={handleLogout}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                    <LogOut className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-destructive group-hover:text-destructive transition-colors">Logout</p>
                    <p className="text-sm text-muted-foreground">Sign out of your account</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-destructive group-hover:text-destructive transition-colors" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Theme Toggle Button */}
        <motion.div
          className="bg-card mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <div className="px-6 py-6">
            <motion.button
              onClick={toggleTheme}
              className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
            </motion.button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
