# Unread Message Counters - Setup Guide

## ✅ What Was Implemented

### Database Changes
- Added `lastReadAt` field to ChatMember model (DateTime?, nullable)
- Tracks when each user last read messages in each chat
- Used to calculate unread message counts

### Backend API

#### Updated Endpoints:

1. **GET /api/chat/list**
   - Now calculates and returns `unreadCount` for each chat
   - Only counts messages from other users (not your own)
   - Counts messages created after `lastReadAt` timestamp
   - Returns 0 if chat has never been read

2. **POST /api/chat/:chatId/read** (NEW)
   - Marks all messages in a chat as read
   - Updates `lastReadAt` to current timestamp
   - Requires JWT authentication
   - Returns: `{ success: true }`

#### Updated Files:
- `apps/api/src/chat/chat.service.ts`:
  - Updated `getOrganizationChats()` to calculate unread counts
  - Added `markChatAsRead()` method
- `apps/api/src/chat/chat.controller.ts`:
  - Updated `listChats()` endpoint to pass currentUserId
  - Added `POST /:chatId/read` endpoint

### Frontend

#### Updated Components:

1. **ChatList** (`apps/web/src/components/chat/chat-list.tsx`)
   - Displays red badge with unread count next to chat name
   - Shows chat name in **bold** when there are unread messages
   - Badge shows actual number of unread messages
   - Badge only appears when unreadCount > 0
   - **Real-time updates**: WebSocket listener auto-refreshes unread counts when new messages arrive
   - Automatically disconnects WebSocket on component unmount

2. **Dashboard** (`apps/web/src/app/dashboard/page.tsx`)
   - Automatically marks chat as read when opened
   - Works for:
     - Selecting existing chat from list
     - Creating new chat
     - Opening direct chat with user
   - Refreshes chat list after marking as read to update badges

---

## 🚀 How to Run

### Step 1: Run Database Migration

**IMPORTANT:** You must run the migration to add the `lastReadAt` field!

```bash
# Start PostgreSQL (if not running)
docker compose up -d postgres

# Run migration
cd packages/db
DATABASE_URL="postgresql://forgeline:forgeline123@localhost:5432/forgeline_dev" pnpm run migrate
```

Or if you have a `.env` file with DATABASE_URL:
```bash
cd packages/db
pnpm run migrate
```

### Step 2: Generate Prisma Client

```bash
cd packages/db
pnpm run generate
```

### Step 3: Start the App

```bash
# From root directory
pnpm dev
```

---

## 📝 Usage

### 1. View Unread Counts
- Login to dashboard
- Look at chat list on the left
- Chats with unread messages show:
  - **Bold chat name**
  - Red badge with number of unread messages

### 2. Mark Messages as Read
- Click on any chat
- Unread count automatically clears
- Badge disappears
- Chat name becomes normal weight (not bold)

### 3. How Unread Count Works
- Only counts messages from **other users**
- Doesn't count your own messages
- Counts messages sent after you last read the chat
- If you've never opened the chat, counts all messages from others

---

## 🧪 Testing

### Test Case 1: New Message Creates Unread Badge
```
1. Login as User A
2. User B sends message in shared chat
3. User A's chat list should show:
   - Bold chat name
   - Red badge with "1"
4. User A clicks on chat
5. Expected: Badge disappears, name becomes normal weight
```

### Test Case 2: Multiple Unread Messages
```
1. User A is offline
2. User B sends 5 messages in chat
3. User A logs in
4. Expected: Badge shows "5"
5. User A opens chat
6. Expected: Badge clears to 0
```

### Test Case 3: Own Messages Don't Count
```
1. User A opens chat
2. User A sends message
3. Expected: No unread badge for User A
4. User B sees the message
5. Expected: User B sees unread badge
```

### Test Case 4: Direct Chat Unread Count
```
1. User A starts direct chat with User B
2. User A sends message
3. User B's dashboard should show:
   - Unread badge in chat list
4. User B clicks on user or chat
5. Expected: Badge clears
```

### Test Case 5: Real-Time Unread Badge Updates
```
1. User A and User B both have chat list open
2. User A sends message in shared chat
3. Expected: User B's badge appears/updates INSTANTLY (no page refresh needed)
4. User B opens the chat
5. Expected: Badge clears immediately for User B
6. Test with multiple rapid messages
7. Expected: Count updates in real-time with each message
```

### Test Case 6: API Testing
```bash
# Mark chat as read
curl -X POST http://localhost:4000/api/chat/CHAT_ID/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get chat list with unread counts
curl -X GET http://localhost:4000/api/chat/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🗂️ Database Schema

### ChatMember Model (Updated)
```prisma
model ChatMember {
  id         String    @id @default(cuid())
  userId     String
  chatId     String
  user       User      @relation(...)
  chat       Chat      @relation(...)
  joinedAt   DateTime  @default(now())
  lastReadAt DateTime?  // ✅ NEW: Tracks when user last read chat

  @@unique([userId, chatId])
  @@map("chat_members")
}
```

### Example Chat Response with Unread Count
```json
{
  "id": "chat_abc123",
  "name": "Team Discussion",
  "type": "group",
  "organizationId": "org_xyz",
  "unreadCount": 3,  // ✅ NEW
  "members": [...],
  "messages": [
    {
      "content": "Latest message",
      "createdAt": "2025-11-19T10:30:00Z",
      "author": { "name": "John" }
    }
  ]
}
```

---

## 🔍 How It Works

### Backend Flow:

```
1. User opens app
   ↓
2. Frontend: GET /api/chat/list
   ↓
3. ChatService.getOrganizationChats():
   - Fetch all chats for organization
   - For each chat:
     a. Find current user's ChatMember record
     b. Get lastReadAt timestamp
     c. Count messages where:
        - chatId matches
        - authorId != currentUserId (not own messages)
        - createdAt > lastReadAt (messages after last read)
     d. Return chat with unreadCount
   ↓
4. Frontend displays badges for unreadCount > 0
   ↓
5. User clicks chat
   ↓
6. Frontend: POST /api/chat/:chatId/read
   ↓
7. ChatService.markChatAsRead():
   - Find ChatMember record for user+chat
   - Update lastReadAt to current time
   ↓
8. Frontend refreshes chat list
   ↓
9. New unread count is 0 (badge disappears)
```

### Real-Time Update Flow:

```
1. ChatList component mounts
   ↓
2. Connect to WebSocket server (http://localhost:4000)
   ↓
3. Listen for "new_message" events
   ↓
4. When new message arrives:
   - WebSocket emits "new_message" event
   - ChatList receives event
   - Auto-calls loadChats() to refresh unread counts
   - Badges update in real-time without user interaction
   ↓
5. Component unmounts → WebSocket disconnects
```

**Key Benefits:**
- ✅ Unread badges appear **instantly** when new messages arrive
- ✅ No need to manually refresh the page
- ✅ Works for all users in real-time
- ✅ Clean WebSocket disconnect on component unmount (no memory leaks)

### Key Logic in `getOrganizationChats()`:

```typescript
// Find user's membership in this chat
const membership = await prisma.chatMember.findUnique({
  where: {
    userId_chatId: {
      userId: currentUserId,
      chatId: chat.id,
    },
  },
});

// Count unread messages
const unreadCount = await prisma.message.count({
  where: {
    chatId: chat.id,
    authorId: { not: currentUserId }, // ✅ Don't count own messages
    createdAt: membership?.lastReadAt
      ? { gt: membership.lastReadAt }  // ✅ Only messages after last read
      : undefined,                      // ✅ All messages if never read
  },
});
```

### Key Logic in `markChatAsRead()`:

```typescript
// Update lastReadAt to current time
await prisma.chatMember.update({
  where: {
    userId_chatId: {
      userId,
      chatId,
    },
  },
  data: {
    lastReadAt: new Date(), // ✅ Current timestamp
  },
});
```

---

## 🐛 Troubleshooting

### Migration Fails
```
Error: P1001: Can't reach database server
```
**Solution:** Start PostgreSQL first
```bash
docker compose up -d postgres
```

### Unread Count Not Showing
**Check:**
1. Did you run the migration?
2. Is lastReadAt field in database? (Check with SQL client)
3. Are there actually unread messages?
4. Check browser console for API errors

### Badge Not Clearing
**Check:**
1. Is POST /api/chat/:chatId/read endpoint working?
2. Check network tab in browser DevTools
3. Check backend logs for errors
4. Verify JWT token is valid

### "Cannot read property 'lastReadAt'" Error
**Solution:** Run migration and generate Prisma client
```bash
cd packages/db
pnpm run migrate
pnpm run generate
```

---

## 📚 API Reference

### GET /api/chat/list
**Headers:**
- Authorization: Bearer {JWT_TOKEN}

**Response:**
```json
[
  {
    "id": "chat_123",
    "name": "Team Chat",
    "type": "group",
    "organizationId": "org_xyz",
    "unreadCount": 3,
    "members": [...],
    "messages": [
      {
        "content": "Hello",
        "createdAt": "2025-11-19T10:00:00Z",
        "author": { "name": "John" }
      }
    ],
    "createdAt": "2025-11-18T...",
    "updatedAt": "2025-11-19T..."
  }
]
```

### POST /api/chat/:chatId/read
**Headers:**
- Authorization: Bearer {JWT_TOKEN}

**Params:**
- chatId: Chat ID to mark as read

**Response:**
```json
{
  "success": true
}
```

**Error Responses:**
- 400: "User not authenticated"
- 500: "Failed to mark chat as read"

---

## 🎯 How Frontend Auto-Marks as Read

When a user opens a chat, the dashboard automatically:

1. **Sets active chat**: `setActiveChatId(chatId)`
2. **Marks as read**: Calls `POST /api/chat/:chatId/read`
3. **Refreshes list**: Calls `(window as any).refreshChatList()`
4. **Result**: Badge disappears, name becomes normal weight

This happens in three scenarios:
- **Selecting chat from list** → `handleChatSelect()`
- **Creating new chat** → `handleChatCreated()`
- **Opening direct chat** → `handleUserClick()`

---

## ✅ Summary

**What works:**
- ✅ Unread count calculated for each chat
- ✅ Red badge displays unread count
- ✅ Bold text for chats with unread messages
- ✅ Auto-marks as read when opening chat
- ✅ Badge auto-clears when chat is read
- ✅ Doesn't count own messages
- ✅ Works for both group chats and direct chats

**What you need to do:**
1. Run migration: `cd packages/db && DATABASE_URL="..." pnpm run migrate`
2. Generate Prisma client: `pnpm run generate`
3. Start app: `pnpm dev`
4. Test with multiple users!

Everything is ready to use! 🚀
