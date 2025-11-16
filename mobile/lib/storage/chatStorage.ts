import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const CHAT_HISTORY_PREFIX = '@chat_history_';

/**
 * Save chat history for a specific note
 * @param noteId - The ID of the note
 * @param messages - Array of chat messages to save
 */
export const saveChatHistory = async (
  noteId: string,
  messages: ChatMessage[]
): Promise<void> => {
  try {
    const key = `${CHAT_HISTORY_PREFIX}${noteId}`;
    // Convert Date objects to ISO strings for storage
    const serializedMessages = messages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(),
    }));
    await AsyncStorage.setItem(key, JSON.stringify(serializedMessages));
    console.log(`✅ Saved ${messages.length} messages for ${key}`);
  } catch (error) {
    console.error('Error saving chat history:', error);
    throw error;
  }
};

/**
 * Load chat history for a specific note
 * @param noteId - The ID of the note
 * @returns Array of chat messages, or null if no history exists
 */
export const loadChatHistory = async (
  noteId: string
): Promise<ChatMessage[] | null> => {
  try {
    const key = `${CHAT_HISTORY_PREFIX}${noteId}`;
    const data = await AsyncStorage.getItem(key);
    
    console.log(`📂 Loading chat history for ${key}`);
    
    if (!data) {
      console.log(`📂 No data found for ${key}`);
      return null;
    }

    const parsed = JSON.parse(data);
    // Convert ISO strings back to Date objects
    const messages = parsed.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
    
    console.log(`✅ Loaded ${messages.length} messages for ${key}`);
    return messages;
  } catch (error) {
    console.error('Error loading chat history:', error);
    return null;
  }
};

/**
 * Clear chat history for a specific note
 * @param noteId - The ID of the note
 */
export const clearChatHistory = async (noteId: string): Promise<void> => {
  try {
    const key = `${CHAT_HISTORY_PREFIX}${noteId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing chat history:', error);
    throw error;
  }
};

/**
 * Clear all chat histories (useful for logout or data cleanup)
 */
export const clearAllChatHistories = async (): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const chatKeys = allKeys.filter((key) => key.startsWith(CHAT_HISTORY_PREFIX));
    await AsyncStorage.multiRemove(chatKeys);
  } catch (error) {
    console.error('Error clearing all chat histories:', error);
    throw error;
  }
};

/**
 * Check if chat history exists for a specific note
 * @param noteId - The ID of the note
 * @returns true if history exists, false otherwise
 */
export const hasChatHistory = async (noteId: string): Promise<boolean> => {
  try {
    const key = `${CHAT_HISTORY_PREFIX}${noteId}`;
    const data = await AsyncStorage.getItem(key);
    return data !== null;
  } catch (error) {
    console.error('Error checking chat history:', error);
    return false;
  }
};
