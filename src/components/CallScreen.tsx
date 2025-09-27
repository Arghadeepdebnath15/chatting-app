import React, { useState } from 'react';
import { ArrowLeft, Phone, Video, PhoneOff, Search, Plus } from 'lucide-react';
import { Call } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CallScreenProps {
  calls: Call[];
  onBack: () => void;
}

export function CallScreen({ calls, onBack }: CallScreenProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'missed'>('all');

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getCallIcon = (call: Call) => {
    if (call.type === 'video') {
      return <Video className="w-4 h-4" />;
    }
    return <Phone className="w-4 h-4" />;
  };

  const getCallColor = (call: Call) => {
    switch (call.direction) {
      case 'missed':
        return 'text-red-500';
      case 'incoming':
        return 'text-green-500';
      case 'outgoing':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getCallDirectionIcon = (call: Call) => {
    switch (call.direction) {
      case 'missed':
        return '📞❌';
      case 'incoming':
        return '📞↙️';
      case 'outgoing':
        return '📞↗️';
      default:
        return '📞';
    }
  };

  const filteredCalls = activeTab === 'missed' 
    ? calls.filter(call => call.direction === 'missed')
    : calls;

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-green-500 text-white px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button 
              onClick={onBack}
              className="mr-3 p-1 hover:bg-green-600 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg">Calls</h1>
          </div>
          <Button
            className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 p-0"
          >
            <Plus className="w-5 h-5 text-white" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search calls..." 
            className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder-white/70"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 px-4 text-center transition-colors ${
            activeTab === 'all'
              ? 'bg-green-50 text-green-600 border-b-2 border-green-500'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Calls
        </button>
        <button
          onClick={() => setActiveTab('missed')}
          className={`flex-1 py-3 px-4 text-center transition-colors ${
            activeTab === 'missed'
              ? 'bg-red-50 text-red-600 border-b-2 border-red-500'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Missed
        </button>
      </div>

      {/* Call List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Phone className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg mb-2">No {activeTab === 'missed' ? 'missed' : ''} calls</p>
            <p className="text-sm text-center px-8">
              {activeTab === 'missed' 
                ? 'You have no missed calls' 
                : 'Your call history will appear here'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="mr-3">
                  <img
                    src={call.contactAvatar}
                    alt={call.contactName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>

                {/* Call Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-gray-900 truncate">{call.contactName}</h3>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatTime(call.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`${getCallColor(call)}`}>
                      {getCallIcon(call)}
                    </span>
                    <span className="text-sm text-gray-600 capitalize">
                      {call.direction}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm text-gray-600">
                      {call.duration || 'No answer'}
                    </span>
                  </div>
                </div>

                {/* Call Actions */}
                <div className="flex items-center space-x-2 ml-3">
                  <button className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex justify-center space-x-4">
          <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3">
            <Phone className="w-5 h-5 mr-2" />
            Voice Call
          </Button>
          <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3">
            <Video className="w-5 h-5 mr-2" />
            Video Call
          </Button>
        </div>
      </div>
    </div>
  );
}