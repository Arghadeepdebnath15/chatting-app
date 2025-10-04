import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, MicOff, PhoneOff } from 'lucide-react';
import { Button } from './ui/button';
import { useSocket } from '../contexts/SocketContext';

interface VoiceCallScreenProps {
  onBack: () => void;
  selectedUserId: string;
  userId: string;
  isCaller: boolean;
  pendingOffer?: RTCSessionDescriptionInit | null;
}

export function VoiceCallScreen({ onBack, selectedUserId, userId, isCaller, pendingOffer }: VoiceCallScreenProps) {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callState, setCallState] = useState<'calling' | 'ringing' | 'connected' | 'ended'>('calling');
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [pendingOfferState, setPendingOfferState] = useState<RTCSessionDescriptionInit | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (socket) {
      socket.on('call-offer', handleCallOffer);
      socket.on('call-answer', handleCallAnswer);
      socket.on('ice-candidate', handleIceCandidate);
      socket.on('call-ended', handleCallEnded);
      socket.on('call-declined', handleCallDeclined);
    }

    return () => {
      if (socket) {
        socket.off('call-offer', handleCallOffer);
        socket.off('call-answer', handleCallAnswer);
        socket.off('ice-candidate', handleIceCandidate);
        socket.off('call-ended', handleCallEnded);
        socket.off('call-declined', handleCallDeclined);
      }
    };
  }, [socket]);

  useEffect(() => {
    if (pendingOffer && !isCaller) {
      setIsIncomingCall(true);
      setPendingOfferState(pendingOffer);
      setCallState('ringing');
    }
  }, [pendingOffer, isCaller]);

  useEffect(() => {
    if (isCaller) {
      startCall();
    }
    return () => {
      endCall();
    };
  }, [isCaller]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        console.log('ontrack fired for caller', event.streams[0]);
        setRemoteStream(event.streams[0]);
        setCallState('connected');
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice-candidate', { candidate: event.candidate, to: selectedUserId });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socket) {
        socket.emit('call-offer', { offer, to: selectedUserId, callType: 'voice' });
      }
    } catch (error) {
      console.error('Error starting call:', error);
      setCallState('ended');
    }
  };

  const handleCallOffer = async (data: { offer: RTCSessionDescriptionInit; from: string; callType: string }) => {
    if (data.from !== selectedUserId || data.callType !== 'voice') return;

    if (!isCaller) {
      setIsIncomingCall(true);
      setPendingOfferState(data.offer);
      setCallState('ringing');
    }
  };

  const acceptCall = async () => {
    if (!pendingOfferState) return;

    setIsIncomingCall(false);
    setCallState('connected');

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnectionRef.current = pc;

    pc.ontrack = (event) => {
      console.log('ontrack fired for receiver', event.streams[0]);
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', { candidate: event.candidate, to: selectedUserId });
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferState));

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (socket) {
      socket.emit('call-answer', { answer, to: selectedUserId });
    }
  };

  const declineCall = () => {
    setIsIncomingCall(false);
    setPendingOfferState(null);
    if (socket) {
      socket.emit('call-decline', { to: selectedUserId });
    }
    onBack();
  };

  const handleCallAnswer = async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
    if (peerConnectionRef.current && data.from === selectedUserId) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      setCallState('connected');
    }
  };

  const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; from: string }) => {
    if (peerConnectionRef.current && data.from === selectedUserId) {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  };

  const handleCallEnded = () => {
    setCallState('ended');
    endCall();
  };

  const handleCallDeclined = () => {
    setCallState('ended');
    endCall();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (socket) {
      socket.emit('end-call', { to: selectedUserId });
    }
    onBack();
  };

  return (
    <div className="h-full bg-black flex flex-col">
      {/* Call Info */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-32 h-32 bg-gray-600 rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Voice Call</h2>
          <p className="text-lg text-gray-300 mb-4">
            {callState === 'calling' && 'Calling...'}
            {callState === 'ringing' && 'Incoming call'}
            {callState === 'connected' && 'Connected'}
            {callState === 'ended' && 'Call ended'}
          </p>
          {callState === 'connected' && (
            <p className="text-sm text-gray-400">Tap to mute/unmute</p>
          )}
        </div>
      </div>

      {/* Incoming Call Actions */}
      {callState === 'ringing' && isIncomingCall && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center text-white">
            <div className="w-24 h-24 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-lg mb-6">Incoming voice call</p>
            <div className="flex space-x-4 justify-center">
              <Button onClick={declineCall} className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-full">
                Decline
              </Button>
              <Button onClick={acceptCall} className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded-full">
                Accept
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-900 p-6">
        <div className="flex justify-center space-x-6">
          <Button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-600'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>
          <Button
            onClick={endCall}
            className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
