# TODO: Add Block, Delete Chat, and Report User Options in Profile Screen

## Overview
Implement options to block user, delete user from chat, and report user in the ProfileScreen component when viewing another user's profile. This includes frontend UI updates, backend API endpoints, and type definitions.

## Steps
- [x] Update src/types.ts: Extend User type with isBlocked and blockedBy fields, add Report type.
- [x] Update server/server.js: Add POST endpoints for /api/block/:userId, /api/delete-chat/:userId, and /api/report/:userId.
- [x] Update src/components/ProfileScreen.tsx: Add conditional action buttons for Block User, Delete Chat, and Report User with confirmation dialogs and API calls.
- [ ] Test UI: Run dev server, navigate to user profile, verify buttons appear for other users, test dialogs and API interactions.
- [ ] Test Backend: Start server, test new endpoints with Postman or curl.
- [ ] Handle Edge Cases: Ensure no actions for self-profile, handle API errors, update chat list after delete.
- [ ] Full Integration: Update chat screens to respect blocked users (e.g., hide in ChatListScreen).
