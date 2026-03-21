import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useKeyboard } from '@10play/tentap-editor'

import { notesApi } from '@/lib/api'
import type { Note } from '@/lib/api/types'
import { useAlert } from '@/lib/contexts/AlertContext'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'
import { LAYOUT } from '@/lib/editor/constants'
import { markdownToTipTap } from '@/lib/editor/converters'
import type { BlockType, CursorPosition, EditorContent, TextAlignment } from '@/lib/editor/types'

import {
  EditorHeader,
  ContentEditor,
  RichTextToolbar,
  type ContentEditorRef,
} from './editor'

interface EditViewProps {
  noteId: string
}

export default function EditView({ noteId }: EditViewProps) {
  const router = useRouter()
  const { showAlert } = useAlert()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const editorRef = useRef<ContentEditorRef>(null)

  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [initialContent, setInitialContent] = useState('')

  const [currentBlockType, setCurrentBlockType] = useState<BlockType>('body')
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    blockIndex: 0,
    blockType: 'body',
    offset: 0,
  })

  const { keyboardHeight } = useKeyboard()

  const [isBoldActive, setIsBoldActive] = useState(false)
  const [isItalicActive, setIsItalicActive] = useState(false)
  const [isUnderlineActive, setIsUnderlineActive] = useState(false)
  const [isBulletListActive, setIsBulletListActive] = useState(false)
  const [isOrderedListActive, setIsOrderedListActive] = useState(false)
  const [currentAlignment, setCurrentAlignment] = useState<TextAlignment>('left')

  useEffect(() => {
    const fetchNote = async () => {
      try {
        setLoading(true)
        const fetchedNote = await notesApi.getNoteById(noteId)
        setNote(fetchedNote)
        const tipTapDoc = markdownToTipTap(fetchedNote.content || '')
        const htmlContent = tipTapDocToHTML(tipTapDoc)
        setInitialContent(htmlContent)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load note'
        showAlert('Error', msg)
        router.back()
      } finally {
        setLoading(false)
      }
    }
    if (noteId) fetchNote()
  }, [noteId, showAlert, router])

  const tipTapDocToHTML = (doc: ReturnType<typeof markdownToTipTap>): string => {
    if (!doc.content || doc.content.length === 0) return '<p></p>'
    return doc.content.map((block) => {
      const content = blockContentToHTML(block.content)
      switch (block.type) {
        case 'title': return `<h1>${content}</h1>`
        case 'h1Boxed': return `<h2>${content}</h2>`
        case 'h2Plain': return `<h3>${content}</h3>`
        case 'bulletList':
          return `<ul>${(block.content || []).map(item => {
            if (item.type === 'listItem' && item.content) {
              const p = item.content.find(n => n.type === 'paragraph')
              return `<li>${p ? blockContentToHTML(p.content) : ''}</li>`
            }
            return ''
          }).join('')}</ul>`
        case 'orderedList':
          return `<ol>${(block.content || []).map(item => {
            if (item.type === 'listItem' && item.content) {
              const p = item.content.find(n => n.type === 'paragraph')
              return `<li>${p ? blockContentToHTML(p.content) : ''}</li>`
            }
            return ''
          }).join('')}</ol>`
        default: return `<p>${content}</p>`
      }
    }).join('')
  }

  const blockContentToHTML = (content?: Array<{ type: string; text?: string; marks?: Array<{ type: string }> }>): string => {
    if (!content) return ''
    return content.map(node => {
      if (node.type === 'text' && node.text) {
        let text = node.text
        if (node.marks) {
          for (const mark of node.marks) {
            if (mark.type === 'bold') text = `<strong>${text}</strong>`
            else if (mark.type === 'italic') text = `<em>${text}</em>`
            else if (mark.type === 'underline') text = `<u>${text}</u>`
          }
        }
        return text
      }
      return ''
    }).join('')
  }

  const convertHTMLToMarkdown = (html: string): string => {
    let md = html
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**')
    md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*')
    md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*')
    md = md.replace(/<u>(.*?)<\/u>/gi, '__$1__')
    md = md.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_m, content) =>
      content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n'))
    md = md.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_m, content) => {
      let counter = 1
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. \n`)
    })
    md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n')
    md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    md = md.replace(/<br\s*\/?>/gi, '\n')
    md = md.replace(/<[^>]*>/g, '')
    md = md.replace(/\n{3,}/g, '\n\n').trim()
    md = md.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    return md
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const htmlContent = await editorRef.current?.getContent()
      if (!htmlContent) {
        showAlert('Error', 'Failed to get editor content.')
        return
      }
      const markdownContent = convertHTMLToMarkdown(htmlContent)
      let title = note?.title || 'Untitled'
      const titleMatch = markdownContent.match(/^#\s+(.+)$/m)
      if (titleMatch) title = titleMatch[1].trim()
      await notesApi.updateNote(noteId, { title, content: markdownContent })
      showAlert('Success', 'Note saved successfully')
      router.back()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save note'
      showAlert('Error', `Save failed: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const handleBack = useCallback(() => router.back(), [router])
  const handleContentChange = useCallback((_content: EditorContent) => {}, [])
  const handleBlockTypeChange = useCallback((blockType: BlockType) => {
    setCurrentBlockType(blockType)
    if (editorRef.current) {
      setIsBoldActive(editorRef.current.isBoldActive())
      setIsItalicActive(editorRef.current.isItalicActive())
      setIsUnderlineActive(editorRef.current.isUnderlineActive())
      setIsBulletListActive(editorRef.current.isBulletListActive())
      setIsOrderedListActive(editorRef.current.isOrderedListActive())
      setCurrentAlignment(editorRef.current.getCurrentAlignment())
    }
  }, [])
  const handleCursorChange = useCallback((position: CursorPosition) => setCursorPosition(position), [])
  const handleToggleBold = useCallback(() => { editorRef.current?.toggleBold(); setIsBoldActive(!isBoldActive) }, [isBoldActive])
  const handleToggleItalic = useCallback(() => { editorRef.current?.toggleItalic(); setIsItalicActive(!isItalicActive) }, [isItalicActive])
  const handleToggleUnderline = useCallback(() => { editorRef.current?.toggleUnderline(); setIsUnderlineActive(!isUnderlineActive) }, [isUnderlineActive])
  const handleToggleBulletList = useCallback(() => { editorRef.current?.toggleBulletList(); setIsBulletListActive(!isBulletListActive) }, [isBulletListActive])
  const handleToggleOrderedList = useCallback(() => { editorRef.current?.toggleOrderedList(); setIsOrderedListActive(!isOrderedListActive) }, [isOrderedListActive])
  const handleSetAlignment = useCallback((align: TextAlignment) => { editorRef.current?.setAlignment(align); setCurrentAlignment(align) }, [])
  const handleBlockTypeSelect = useCallback((type: BlockType) => { editorRef.current?.setBlockType(type); setCurrentBlockType(type) }, [])

  const pageBg = isDark ? neutral[950] : '#fff'

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: pageBg }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.loadingText, { color: c.mutedForeground }]}>Loading note...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: pageBg }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <EditorHeader onBack={handleBack} onSave={handleSave} saving={saving} />
        <View style={[styles.editorContainer, { backgroundColor: pageBg }]}>
          <ContentEditor
            ref={editorRef}
            initialContent={initialContent}
            onContentChange={handleContentChange}
            onBlockTypeChange={handleBlockTypeChange}
            onCursorChange={handleCursorChange}
          />
        </View>
        <RichTextToolbar
          currentBlockType={currentBlockType}
          isTitleBlock={cursorPosition.blockType === 'title'}
          keyboardHeight={keyboardHeight}
          onBlockTypeChange={handleBlockTypeSelect}
          onToggleBold={handleToggleBold}
          onToggleItalic={handleToggleItalic}
          onToggleUnderline={handleToggleUnderline}
          onToggleBulletList={handleToggleBulletList}
          onToggleOrderedList={handleToggleOrderedList}
          onSetAlignment={handleSetAlignment}
          isBoldActive={isBoldActive}
          isItalicActive={isItalicActive}
          isUnderlineActive={isUnderlineActive}
          isBulletListActive={isBulletListActive}
          isOrderedListActive={isOrderedListActive}
          currentAlignment={currentAlignment}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  editorContainer: {
    flex: 1,
  },
})
