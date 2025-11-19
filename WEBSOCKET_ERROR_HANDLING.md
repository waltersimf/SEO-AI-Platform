# WebSocket Error Handling Guide

## Overview

The WebSocket chat gateway now includes comprehensive error handling for:
- **Connection errors** with client tracking
- **Message send failures** with validation and timeouts
- **Reconnection logic** with exponential backoff support
- **Real-time error notifications** to clients

## Server-Side Implementation

### File: `apps/api/src/chat/chat.gateway.ts`

### Features Added

#### 1. Connection Error Handling
- Tracks all connected clients with metadata
- Handles connection errors gracefully
- Sends connection acknowledgment with server info
- Notifies rooms when users go offline

#### 2. Message Send Failures
- Validates message payload (chatId, authorId, content required)
- Content length validation (1-10000 characters)
- Database timeout protection (5 seconds)
- Emits specific error events to clients
- Sends acknowledgment on successful send

#### 3. Reconnection Logic
- Maximum 5 reconnection attempts per client
- Tracks reconnection attempts per client
- Emits reconnection status to clients
- Disconnects clients exceeding max attempts

#### 4. Error Codes
| Code | Description |
|------|-------------|
| `CONNECTION_ERROR` | General connection error |
| `CONNECTION_FAILED` | Failed to establish connection |
| `INVALID_CHAT_ID` | Missing or invalid chat ID |
| `INVALID_PAYLOAD` | Invalid message payload |
| `EMPTY_MESSAGE` | Message content is empty |
| `MESSAGE_TOO_LONG` | Message exceeds 10000 characters |
| `MESSAGE_SEND_FAILED` | Failed to send message |
| `INVALID_TYPING_PAYLOAD` | Invalid typing event payload |
| `CLIENT_NOT_FOUND` | Client not found in tracking |
| `MAX_RECONNECT_EXCEEDED` | Too many reconnection attempts |
| `RECONNECT_FAILED` | Reconnection failed |

## Client-Side Integration

### 1. Connection Setup with Error Handling

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:4000', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

// Connection success
socket.on('connected', (data) => {
  console.log('Connected to server:', data);
  // { socketId, serverTime, maxReconnectAttempts }
});

// Connection errors
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Show user-friendly error message
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Handle specific error codes
  switch (error.code) {
    case 'CONNECTION_FAILED':
      // Show "Unable to connect" message
      break;
    case 'MAX_RECONNECT_EXCEEDED':
      // Show "Please refresh the page" message
      break;
    default:
      // Generic error handling
  }
});
```

### 2. Reconnection Logic

```typescript
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);

  if (reason === 'io server disconnect') {
    // Server disconnected the client, manual reconnect needed
    socket.connect();
  }

  // Automatic reconnection will be handled by socket.io
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`Reconnection attempt ${attemptNumber}`);
  reconnectAttempts = attemptNumber;

  // Show reconnection UI to user
  showReconnectingMessage(attemptNumber, MAX_RECONNECT_ATTEMPTS);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  reconnectAttempts = 0;

  // Notify server about reconnection
  socket.emit('reconnect_attempt', {
    userId: currentUserId,
    previousSocketId: previousSocketId,
  });

  // Hide reconnection UI
  hideReconnectingMessage();
});

socket.on('reconnected', (data) => {
  console.log('Server confirmed reconnection:', data);
  // { success, socketId, attempt, serverTime }

  // Rejoin all rooms
  rejoinAllRooms();
});

socket.on('reconnect_failed', () => {
  console.error('Reconnection failed after max attempts');
  // Show "Please refresh the page" message
  showRefreshPageMessage();
});
```

### 3. Join Room with Error Handling

```typescript
function joinChatRoom(chatId: string, userId: string, userName: string) {
  socket.emit('join_room',
    { chatId, userId, userName },
    (response) => {
      if (response.success) {
        console.log('Joined room:', response.data);
      } else {
        console.error('Failed to join room:', response.error);
        showError('Unable to join chat room');
      }
    }
  );
}

// Listen for other users joining
socket.on('user_joined', (data) => {
  console.log('User joined:', data);
  // { userId, userName, joinedAt }
  showNotification(`${data.userName} joined the chat`);
});

// Listen for users going offline
socket.on('user_offline', (data) => {
  console.log('User went offline:', data);
  // { userId, userName, disconnectedAt }
  updateUserStatus(data.userId, 'offline');
});
```

### 4. Send Message with Error Handling

```typescript
function sendMessage(chatId: string, authorId: string, content: string) {
  // Validate before sending
  if (!content.trim()) {
    showError('Message cannot be empty');
    return;
  }

  if (content.length > 10000) {
    showError('Message is too long (max 10000 characters)');
    return;
  }

  socket.emit('send_message',
    { chatId, authorId, content },
    (response) => {
      if (response.success) {
        console.log('Message sent:', response.message);
      } else {
        console.error('Failed to send message:', response.error);
        showError('Failed to send message. Please try again.');
      }
    }
  );
}

// Listen for message acknowledgment
socket.on('message_sent', (data) => {
  console.log('Message delivered:', data);
  // { success, messageId, timestamp }
  markMessageAsDelivered(data.messageId);
});

// Listen for message errors
socket.on('message_error', (error) => {
  console.error('Message error:', error);
  // { message, code, details, timestamp }

  switch (error.code) {
    case 'INVALID_PAYLOAD':
      showError('Invalid message format');
      break;
    case 'EMPTY_MESSAGE':
      showError('Message cannot be empty');
      break;
    case 'MESSAGE_TOO_LONG':
      showError('Message is too long');
      break;
    case 'MESSAGE_SEND_FAILED':
      showError('Failed to send message. Please try again.');
      break;
    default:
      showError('An error occurred');
  }
});

// Listen for received messages
socket.on('receive_message', (message) => {
  console.log('New message:', message);
  displayMessage(message);
});
```

### 5. Typing Indicators with Error Handling

```typescript
function startTyping(chatId: string, userId: string, userName: string) {
  socket.emit('typing_start',
    { chatId, userId, userName },
    (response) => {
      if (!response.success) {
        console.error('Failed to send typing indicator');
      }
    }
  );
}

function stopTyping(chatId: string, userId: string) {
  socket.emit('typing_stop',
    { chatId, userId },
    (response) => {
      if (!response.success) {
        console.error('Failed to stop typing indicator');
      }
    }
  );
}

// Listen for typing events
socket.on('user_typing', (data) => {
  // { userId, userName?, isTyping }
  if (data.isTyping) {
    showTypingIndicator(data.userId, data.userName);
  } else {
    hideTypingIndicator(data.userId);
  }
});
```

### 6. Health Check / Ping

```typescript
// Periodic health check
setInterval(() => {
  socket.emit('ping', null, (response) => {
    console.log('Server health:', response);
    // { success, pong, serverTime, connectedClients }
  });
}, 30000); // Every 30 seconds
```

## Example React Component

```tsx
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const newSocket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connected', (data) => {
      console.log('Connected:', data);
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionError('Unable to connect to server');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionError(error.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      setReconnectAttempts(attemptNumber);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
    });

    newSocket.on('reconnect_failed', () => {
      setConnectionError('Unable to reconnect. Please refresh the page.');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return {
    socket,
    isConnected,
    connectionError,
    reconnectAttempts,
  };
}
```

## Best Practices

### 1. User Feedback
- Show connection status indicator
- Display reconnection attempts with progress
- Show user-friendly error messages
- Provide retry/refresh options

### 2. Error Recovery
- Implement automatic retry with exponential backoff
- Store messages locally during disconnection
- Resend failed messages after reconnection
- Sync state after reconnection

### 3. Performance
- Implement message queuing for offline mode
- Use message acknowledgments
- Handle timeouts gracefully
- Limit reconnection attempts

### 4. Security
- Validate all user input
- Sanitize message content
- Implement rate limiting
- Use authentication tokens

## Testing Error Scenarios

### 1. Network Disconnection
```bash
# Simulate network failure (Linux/Mac)
sudo ifconfig en0 down
# Wait 5 seconds
sudo ifconfig en0 up
```

### 2. Server Restart
```bash
# Stop server
docker-compose stop api
# Wait 5 seconds
docker-compose start api
```

### 3. Invalid Payloads
```typescript
// Test empty message
socket.emit('send_message', { chatId: '1', authorId: '1', content: '' });

// Test missing fields
socket.emit('send_message', { chatId: '1' });

// Test long message
socket.emit('send_message', {
  chatId: '1',
  authorId: '1',
  content: 'a'.repeat(11000)
});
```

### 4. Multiple Reconnections
```typescript
// Force multiple disconnects/reconnects
for (let i = 0; i < 6; i++) {
  setTimeout(() => {
    socket.disconnect();
    setTimeout(() => socket.connect(), 1000);
  }, i * 3000);
}
```

## Monitoring & Logging

### Server Logs
All errors are logged with context:
```
[ChatGateway] Client connected: ABC123
[ChatGateway] Message from ABC123 (User: user-id): Hello world...
[ChatGateway] Error handling message from ABC123: Database timeout
[ChatGateway] Client disconnected: ABC123 (User: user-id, Connected: 2025-11-19T10:00:00.000Z)
```

### Metrics to Monitor
- Total connected clients
- Reconnection attempts
- Message send failures
- Average message latency
- Error rates by type

## Troubleshooting

### Issue: Clients can't connect
- Check CORS settings in gateway
- Verify WebSocket port is accessible
- Check firewall/proxy settings

### Issue: Messages not delivered
- Check database connection
- Verify room membership
- Check message payload format

### Issue: Reconnection fails
- Check reconnection limits
- Verify server is running
- Check network connectivity

### Issue: High error rates
- Review server logs
- Check database performance
- Monitor server resources

## Summary

The enhanced WebSocket gateway now provides:
- ✅ Robust connection error handling
- ✅ Message validation and timeout protection
- ✅ Automatic reconnection with limits
- ✅ Real-time error notifications
- ✅ Client connection tracking
- ✅ Health check endpoint
- ✅ Comprehensive logging

All error scenarios are handled gracefully with proper user feedback and recovery mechanisms.
