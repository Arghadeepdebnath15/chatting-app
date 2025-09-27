import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Camera,
  Edit2,
  Phone,
  MessageCircle,
  Settings,
  Ban,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Screen, User } from "../types";
import { API_BASE } from '../config';

interface ProfileScreenProps {
  onBack: () => void;
  onNavigateToScreen: (screen: Screen) => void;
  user: User;
  token: string;
}

export function ProfileScreen({
  onBack,
  onNavigateToScreen,
  user,
  token,
}: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  useEffect(() => {
    setImageLoading(true);
  }, [profile?.avatar]);

  const fetchProfile = async () => {
    setImageLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/profile`, {
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

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, status }),
      });
      if (!response.ok) throw new Error("Failed to update profile");

      const updatedUser = await response.json();
      setProfile(updatedUser);
      setIsEditing(false);
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
          <h1 className="text-lg font-semibold">Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-full hover:bg-green-600 dark:hover:bg-green-700 transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
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

            {isEditing && profile?.avatar && (
              <Camera className="absolute bottom-1 right-1 w-4 h-4 bg-white rounded-full p-1 shadow-sm" />
            )}
          </div>

          {/* Edit Mode */}
          {isEditing ? (
            <div className="mt-6 space-y-4">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-center text-xl"
                placeholder="Your name"
              />
              <Input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="text-center"
                placeholder="Your status"
              />
              <div className="flex space-x-3 justify-center mt-4">
                <Button
                  onClick={handleSave}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <h2 className="text-2xl font-semibold">{name}</h2>
              <p className="text-muted-foreground mt-2">{status}</p>
            </div>
          )}
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
    </div>
  );
}
