import { useLocalSearchParams } from 'expo-router'
import ChatbotView from '@/components/notes/ChatbotView'

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  
  return <ChatbotView noteId={id} />
}
