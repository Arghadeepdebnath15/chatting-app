# Voice Call Feature Implementation

## Overview
Implement voice call functionality similar to the existing video call feature, using WebRTC for peer-to-peer audio communication. This includes creating a dedicated VoiceCallScreen, updating navigation and UI triggers, and enhancing server signaling to distinguish between voice and video calls.

## Steps

1. **[Completed]** Update `src/types.ts` to add `'voiceCall'` to the `Screen` type.

2. Create `src/components/VoiceCallScreen.tsx` - A new component for handling audio-only calls, adapted from `VideoCallScreen.tsx` (remove video elements, focus on audio tracks).

3. Update `src/App.tsx` - Add handling for the `'voiceCall'` screen, including state for voice call initiator and pending offers, and render the VoiceCallScreen when navigated to.

4. Update `src/components/ChatScreen.tsx` - Modify the Phone button to initiate a voice call by setting appropriate state and navigating to `'voiceCall'`.

5. Update `src/components/CallScreen.tsx` - Modify the "Voice Call" quick action button to initiate a voice call for a selected contact (may need to handle contact selection).

6. Update `server/server.js` - Enhance Socket.IO events to include a `callType` ('voice' or 'video') in signaling payloads (offer, answer, etc.) to differentiate call types.

7. Update `src/contexts/SocketContext.tsx` if needed - Ensure socket events handle `callType` for voice calls.

8. Test the implementation:
   - Start a voice call from ChatScreen and CallScreen.
   - Verify audio-only connection, mute/unmute, and end call.
   - Ensure signaling works with existing video calls without breaking them.
   - Check for any permission issues with microphone access.

9. Update call history in `CallScreen.tsx` and related logic to log voice calls properly (reuse existing Call type).

## Dependencies
- No new npm packages needed (uses built-in WebRTC).
- Relies on existing STUN server for ICE candidates.

## Potential Issues
- Browser compatibility for audio-only WebRTC.
- Handling call type in peer connection setup (disable video tracks for voice calls).
- UI adjustments for audio-only interface (e.g., show contact avatar prominently instead of video).

Progress: 7/9 completed.
