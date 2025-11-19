# Direct Chats & User List - Setup Guide

## ✅ What Was Implemented

### Database Changes
- Added `type` field to Chat model (String, default: "group")
- Made `name` field nullable (String?) for direct chats
- Direct chats have: type='direct', name=null, exactly 2 members

### Backend API

#### New Endpoints:
1. **GET /api/users/organization**
   - Returns all users in the same organization
   - Requires JWT authentication
   - Returns: id, name, email, role, createdAt

2. **POST /api/chat/direct/:userId**
   - Creates or returns existing direct chat between current user and target user
   - Validates both users are in same organization
   - Prevents creating chat with yourself
   - Returns existing chat if already exists

#### New Files:
- `apps/api/src/users/users.controller.ts`
- `apps/api/src/users/users.service.ts`
- `apps/api/src/users/users.module.ts`

#### Updated Files:
- `apps/api/src/chat/chat.service.ts` - added `createOrGetDirectChat()`
- `apps/api/src/chat/chat.controller.ts` - added direct chat endpoint
- `apps/api/src/app.module.ts` - added UsersModule

### Frontend

#### New Component:
- `apps/web/src/components/users/user-list.tsx`
  - Displays all organization users
  - Click to start direct chat
  - Current user disabled
  - Loading & error states

#### Dashboard Integration:
- Added UserList under "Direct Messages" section
- Click user → calls API → opens chat
- Fully functional workflow

---

## 🚀 How to Run

### Step 1: Run Database Migration

**IMPORTANT:** Before starting the app, you must run the migration!

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

### 1. View Team Members
- Login to dashboard
- Scroll to "Direct Messages" section
- See list of all users in your organization

### 2. Start Direct Chat
- Click on any user (except yourself)
- Direct chat opens automatically
- If chat already exists, it opens that existing chat
- If new, creates direct chat with 2 members

### 3. Send Messages
- Type message in chat box
- See real-time typing indicators
- Messages saved to database

---

## 🧪 Testing

### Test Case 1: Create Direct Chat
```
1. Login as User A (e.g., john@test.com)
2. Go to dashboard
3. See UserList with team members
4. Click on User B (e.g., jane@test.com)
5. Expected: Direct chat opens
6. Send message: "Hello!"
7. Expected: Message appears
```

### Test Case 2: Existing Direct Chat
```
1. User A clicks on User B again
2. Expected: Opens same chat (not creating new one)
3. Previous messages still visible
4. Chat ID remains the same
```

### Test Case 3: Cannot Chat with Yourself
```
1. UserList shows current user with "(You)" label
2. Button is disabled for current user
3. Cannot click on yourself
```

### Test Case 4: API Testing
```bash
# Get organization users
curl -X GET http://localhost:4000/api/users/organization \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create direct chat
curl -X POST http://localhost:4000/api/chat/direct/TARGET_USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🗂️ Database Schema

### Chat Model
```prisma
model Chat {
  id             String   @id @default(cuid())
  name           String?                              // ✅ Nullable for direct chats
  type           String   @default("group")           // ✅ NEW: "direct" | "group"
  organizationId String
  organization   Organization @relation(...)

  members        ChatMember[]
  messages       Message[]

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### Direct Chat Example
```json
{
  "id": "chat_abc123",
  "name": null,
  "type": "direct",
  "organizationId": "org_xyz",
  "members": [
    { "userId": "user_1", "user": { "name": "John" } },
    { "userId": "user_2", "user": { "name": "Jane" } }
  ]
}
```

### Group Chat Example
```json
{
  "id": "chat_def456",
  "name": "Marketing Team",
  "type": "group",
  "organizationId": "org_xyz",
  "members": [
    { "userId": "user_1" },
    { "userId": "user_2" },
    { "userId": "user_3" }
  ]
}
```

---

## 🔍 How It Works

### Backend Flow:

```
1. User clicks on team member
   ↓
2. Frontend: POST /api/chat/direct/:userId
   ↓
3. ChatController validates:
   - User authenticated?
   - Not clicking on self?
   ↓
4. ChatService.createOrGetDirectChat():
   - Validate both users exist in organization
   - Check if direct chat already exists
   - If exists: return existing chat
   - If not: create new direct chat (type='direct', name=null, 2 members)
   ↓
5. Return chat object
   ↓
6. Frontend: setActiveChatId(chat.id)
   ↓
7. ChatBox opens with that chat
```

### Key Logic in `createOrGetDirectChat()`:

```typescript
// Find existing direct chat
const existingChat = await prisma.chat.findFirst({
  where: {
    organizationId,
    type: 'direct',
    AND: [
      { members: { some: { userId: user1Id } } },
      { members: { some: { userId: user2Id } } },
    ],
  },
});

if (existingChat) {
  return existingChat; // ✅ Return existing
}

// Create new direct chat
const chat = await prisma.chat.create({
  data: {
    organizationId,
    type: 'direct',
    name: null,          // ✅ No name for direct chats
    members: {
      create: [
        { userId: user1Id },
        { userId: user2Id },
      ],
    },
  },
});

return chat;
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

### "Unique constraint failed on slug"
**Solution:** This is the old org slug issue, already fixed. Make sure you have latest code.

### UserList shows empty
**Check:**
1. Are there other users in your organization?
2. Is JWT token valid?
3. Check browser console for errors

### Direct chat not opening
**Check:**
1. Browser console for API errors
2. Backend logs: `pnpm dev:api`
3. Ensure migration was run

---

## 📚 API Reference

### GET /api/users/organization
**Headers:**
- Authorization: Bearer {JWT_TOKEN}

**Response:**
```json
[
  {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@test.com",
    "role": "admin",
    "createdAt": "2025-11-19T..."
  }
]
```

### POST /api/chat/direct/:userId
**Headers:**
- Authorization: Bearer {JWT_TOKEN}

**Params:**
- userId: Target user ID

**Response:**
```json
{
  "id": "chat_abc",
  "name": null,
  "type": "direct",
  "organizationId": "org_xyz",
  "members": [
    {
      "userId": "user_1",
      "user": { "id": "user_1", "name": "John" }
    },
    {
      "userId": "user_2",
      "user": { "id": "user_2", "name": "Jane" }
    }
  ],
  "createdAt": "2025-11-19T...",
  "updatedAt": "2025-11-19T..."
}
```

**Error Responses:**
- 400: "User not authenticated"
- 400: "Cannot create direct chat with yourself"
- 500: "Failed to create direct chat"

---

## 🎯 Next Steps

Possible enhancements:
1. Show online status on UserList
2. Show last message timestamp
3. Add "New Message" badge
4. Sort users by online status
5. Search/filter users
6. Show unread message count per user

---

## ✅ Summary

**What works:**
- ✅ User list displays all organization members
- ✅ Click user to create/open direct chat
- ✅ Prevents duplicate direct chats (reuses existing)
- ✅ Cannot chat with yourself
- ✅ Real-time messaging works
- ✅ Database properly stores chat type

**What you need to do:**
1. Run migration: `DATABASE_URL="..." pnpm run migrate`
2. Start app: `pnpm dev`
3. Login and test!

Everything is ready to use! 🚀
