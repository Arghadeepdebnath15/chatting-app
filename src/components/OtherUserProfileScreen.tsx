import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Phone,
  Video,
  MessageCircle,
  Settings,
  UserX,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Screen, User } from "../types";
import { API_BASE } from '../config';

interface OtherUserProfileScreenProps {
  onBack: () => void;
  onNavigateToScreen: (screen: Screen) => void;
  user: User;
  token: string;
  selectedUserId: string;
  setSelectedUserId: (id: string | null) => void;
}

export function OtherUserProfileScreen({
  onBack,
  onNavigateToScreen,
  user,
  token,
  selectedUserId,
  setSelectedUserId,
}: OtherUserProfileScreenProps) {
  const [profile, setProfile] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [imageLoading, setImageLoading] = useState(true);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user, selectedUserId]);

  useEffect(() => {
    setImageLoading(true);
  }, [profile?.avatar]);

  const fetchProfile = async () => {
    setImageLoading(true);
    try {
      const url = `${API_BASE}/api/profile/${selectedUserId}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch profile");

      const data = await response.json();
      setProfile(data);
      setName(data.name);
      setStatus(data.status || "Available");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setImageLoading(false);
    }
  };

  const handleBlockUser = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/block/${selectedUserId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to block user");
      setBlockDialogOpen(false);
      // Refetch profile to update isBlocked
      fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDeleteChat = async () => {
    setIsDeleting(true);
    try {
      console.log('Deleting chat...');
      const response = await fetch(`${API_BASE}/api/delete-chat/${selectedUserId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete response error:', response.status, errorText);
        throw new Error("Failed to delete chat");
      }
      console.log('Delete successful');
      setDeleteDialogOpen(false);
      setSelectedUserId(null); // Clear selected user
      onNavigateToScreen('chatList'); // Navigate to chat list
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReportUser = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/report/${selectedUserId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reportReason }),
      });
      if (!response.ok) throw new Error("Failed to report user");
      setReportDialogOpen(false);
      setReportReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="h-full flex flex-col bg-background transition-colors">
      {/* Header */}
      <div className="bg-green-500 dark:bg-green-600 text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-green-600 dark:hover:bg-green-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">{name}</h1>
          <div className="w-8" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile Picture */}
        <div className="px-6 py-8 text-center border-b border-border bg-card">
          <div className="relative inline-block">
            {profile?.avatar ? (
              <>
                <img
                  src={profile.avatar}
                  alt="Profile"
                  className={`w-32 h-32 rounded-full object-cover mx-auto shadow-lg ring-4 ring-green-500/20 ${imageLoading ? 'hidden' : ''}`}
                  onLoad={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                />

                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
                  </div>
                )}
              </>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto shadow-lg ring-4 ring-green-500/20 flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">No Image</span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-2xl font-semibold">{name}</h2>
            <p className="text-muted-foreground mt-2">{status}</p>
            {profile?.isBlocked && (
              <div className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-sm">
                Blocked
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-4 bg-card shadow-sm rounded-lg mx-4 overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-foreground font-medium">{profile?.mobile || 'Not available'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 bg-card shadow-sm rounded-lg mx-4 overflow-hidden">
          <div className="px-6 py-4">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              {[
                {
                  icon: <MessageCircle className="w-5 h-5 text-green-600" />,
                  title: "Send Message",
                  desc: "Start a conversation",
                  onClick: () => onNavigateToScreen('chat'),
                },
                {
                  icon: <Phone className="w-5 h-5 text-blue-600" />,
                  title: "Voice Call",
                  desc: "Make a voice call",
                  onClick: () => console.log("Voice call not implemented"),
                },
                {
                  icon: <Video className="w-5 h-5 text-purple-600" />,
                  title: "Video Call",
                  desc: "Start a video call",
                  onClick: () => onNavigateToScreen('videoCall'),
                },
                {
                  icon: <Settings className="w-5 h-5 text-gray-600" />,
                  title: "Privacy Settings",
                  desc: "Manage privacy options",
                  onClick: () => console.log("Privacy settings not implemented"),
                },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.onClick}
                  className="w-full flex items-center space-x-4 p-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-full">
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-foreground font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => {
                  console.log('Block button clicked');
                  setBlockDialogOpen(true);
                }}
                className="w-full flex items-center space-x-4 p-3 hover:bg-muted rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 flex items-center justify-center rounded-full">
                  <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-medium">Block User</p>
                  <p className="text-sm text-muted-foreground">Prevent this user from contacting you</p>
                </div>
              </button>
              <button
                onClick={() => {
                  console.log('Delete button clicked');
                  setDeleteDialogOpen(true);
                }}
                className="w-full flex items-center space-x-4 p-3 hover:bg-muted rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 flex items-center justify-center rounded-full">
                  <Trash2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-medium">Delete Chat</p>
                  <p className="text-sm text-muted-foreground">Remove this chat from your list</p>
                </div>
              </button>
              <button
                onClick={() => {
                  console.log('Report button clicked');
                  setReportDialogOpen(true);
                }}
                className="w-full flex items-center space-x-4 p-3 hover:bg-muted rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center rounded-full">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-medium">Report User</p>
                  <p className="text-sm text-muted-foreground">Report inappropriate behavior</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 bg-card shadow-sm rounded-lg mx-4 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Activity</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                247
              </p>
              <p className="text-sm text-muted-foreground">Messages Sent</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                89
              </p>
              <p className="text-sm text-muted-foreground">Calls Made</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded-lg mb-4">
            {error}
          </div>
        )}
      </div>

      {/* Block User Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block User</DialogTitle>
            <DialogDescription>
              Are you sure you want to block {name}? They will not be able to send you messages or calls.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlockUser}>
              Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Chat Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the chat with {name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteChat} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report User Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Please provide a reason for reporting {name}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe the issue..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="mt-4"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReportUser} disabled={!reportReason.trim()}>
              Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
