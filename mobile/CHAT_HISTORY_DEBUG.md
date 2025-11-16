# Chat History Debugging Guide

## Issue
Chat history is lost when navigating back from `/notes/{id}/chat` to `/notes/{id}` and returning.

## Debugging Steps Added

### 1. Console Logging
Added detailed console logs in:
- **ChatbotView.tsx**: Load history, save history, message counts
- **chatStorage.ts**: Save/load operations with success confirmations

### 2. What to Check

#### Open React Native Debugger and check console logs:

**When opening chat screen:**
```
📂 Loading chat history for @chat_history_{noteId}
✅ Loaded X messages for @chat_history_{noteId}
Loading chat history for noteId: {noteId}
History loaded: X messages
Setting messages from history
```

**When sending a message:**
```
Auto-saving chat history, messages count: X
✅ Saved X messages for @chat_history_{noteId}
```

**When returning to chat:**
```
📂 Loading chat history for @chat_history_{noteId}
✅ Loaded X messages for @chat_history_{noteId}
```

### 3. Testing Steps

1. **Clear existing data (fresh start):**
   ```javascript
   // In React Native Debugger console:
   import AsyncStorage from '@react-native-async-storage/async-storage';
   AsyncStorage.getAllKeys().then(keys => {
     const chatKeys = keys.filter(k => k.startsWith('@chat_history_'));
     console.log('Chat keys:', chatKeys);
   });
   ```

2. **Test flow:**
   - Open note (e.g., note ID: `123`)
   - Click "Chat" button
   - Check console: Should see "No data found" or "Loaded X messages"
   - Send a message (e.g., "Hello")
   - Check console: Should see "Saved 2 messages" (welcome + your message)
   - Go back to note
   - Click "Chat" again
   - Check console: Should see "Loaded 2 messages"

3. **Verify storage:**
   ```javascript
   // In React Native Debugger console:
   AsyncStorage.getItem('@chat_history_YOUR_NOTE_ID').then(data => {
     console.log('Stored data:', JSON.parse(data));
   });
   ```

### 4. Common Issues & Solutions

#### Issue: "No data found" every time
**Possible causes:**
- noteId is different each time (check the noteId in logs)
- AsyncStorage permissions issue
- Storage is being cleared somewhere

**Solution:**
- Check console logs for noteId consistency
- Verify noteId format matches

#### Issue: "Loaded X messages" but messages don't show
**Possible causes:**
- State not updating correctly
- Component remounting with wrong initial state

**Solution:**
- Check React DevTools to see actual state
- Verify `setMessages()` is being called

#### Issue: Messages save but don't load on return
**Possible causes:**
- Wrong noteId on load
- Component not remounting properly

**Solution:**
- Add breakpoint in loadHistory useEffect
- Verify noteId matches between save and load

### 5. Expected Console Output

#### First Time Chat (No History):
```
📂 Loading chat history for @chat_history_123
📂 No data found for @chat_history_123
Loading chat history for noteId: 123
History loaded: null
No history found, setting welcome message
Auto-saving chat history, messages count: 1
✅ Saved 1 messages for @chat_history_123
```

#### After Sending Message:
```
Auto-saving chat history, messages count: 2
✅ Saved 2 messages for @chat_history_123
Auto-saving chat history, messages count: 3
✅ Saved 3 messages for @chat_history_123
```

#### Returning to Chat:
```
📂 Loading chat history for @chat_history_123
✅ Loaded 3 messages for @chat_history_123
Loading chat history for noteId: 123
History loaded: 3 messages
Setting messages from history
```

### 6. Manual Testing Commands

Open React Native Debugger and try these:

```javascript
// Check all stored chat keys
import AsyncStorage from '@react-native-async-storage/async-storage';

AsyncStorage.getAllKeys().then(keys => {
  const chatKeys = keys.filter(k => k.startsWith('@chat_history_'));
  console.log('Found chat histories for:', chatKeys);
  
  // Print each one
  chatKeys.forEach(key => {
    AsyncStorage.getItem(key).then(data => {
      const parsed = JSON.parse(data);
      console.log(`${key}: ${parsed.length} messages`);
    });
  });
});

// Clear specific chat
AsyncStorage.removeItem('@chat_history_YOUR_NOTE_ID');

// Clear all chats
AsyncStorage.getAllKeys().then(keys => {
  const chatKeys = keys.filter(k => k.startsWith('@chat_history_'));
  AsyncStorage.multiRemove(chatKeys);
});
```

### 7. What Should Happen

✅ **Correct Behavior:**
1. Open chat for note `123`
2. See welcome message (or loaded history)
3. Send message "Hello"
4. Console shows: "Saved 2 messages"
5. Go back to note detail
6. Return to chat for note `123`
7. Console shows: "Loaded 2 messages"
8. Messages appear in UI (welcome + "Hello")

❌ **Current Issue (if still happening):**
1. Steps 1-4 work
2. Step 5 works
3. Step 6 works
4. Step 7 shows: "Loaded 2 messages" in console
5. But UI shows only welcome message (or empty)

### 8. Next Steps Based on Logs

#### If logs show "Loaded X messages" but UI is wrong:
- Problem is in state management
- Check React DevTools for `messages` state
- Verify `setMessages(history)` is executing

#### If logs show "No data found" on return:
- Problem is in storage or noteId
- Check noteId consistency
- Verify storage permissions

#### If logs show errors:
- Check error messages
- Verify AsyncStorage is properly installed
- Check for TypeScript type mismatches

### 9. Quick Fix to Try

If the issue persists, try this more aggressive save approach:

```typescript
// In ChatbotView.tsx, after adding a message:
const handleSend = async () => {
  // ... existing code ...
  
  setMessages(prev => {
    const newMessages = [...prev, aiMessage];
    // Force save immediately
    saveChatHistory(noteId, newMessages);
    return newMessages;
  });
}
```

### 10. File to Share for Debugging

If issue persists, please share:
1. Full console output from the test flow
2. noteId value (check console logs)
3. Output from `AsyncStorage.getAllKeys()`

---

## Summary

With the added logging, you should now see:
- ✅ When chat history is loaded
- ✅ When chat history is saved  
- ✅ How many messages are in storage
- ✅ What noteId is being used

**Test it now and check the console logs!** The logs will tell us exactly where the issue is.
