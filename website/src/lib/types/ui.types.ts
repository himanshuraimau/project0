/**
 * UI component and interaction types
 */

import { ReactNode, ComponentProps } from 'react';
import type { QuizQuestion } from './quiz.types';
import type { FlashcardItem } from './flashcards.types';

// Common UI component props
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// Loading states for UI components
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Button variant types
export type ButtonVariant = 
  | 'default' 
  | 'destructive' 
  | 'outline' 
  | 'secondary' 
  | 'ghost' 
  | 'link';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

// Component size variants
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';

// Theme and appearance
export type Theme = 'light' | 'dark' | 'system';

// Modal and dialog props
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

// Form field props
export interface FormFieldProps extends BaseComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// Input component props
export interface InputProps extends ComponentProps<'input'> {
  error?: string;
  label?: string;
}

// Textarea component props
export interface TextareaProps extends ComponentProps<'textarea'> {
  error?: string;
  label?: string;
}



// Sidebar component props
export interface SidebarProps extends BaseComponentProps {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Navigation item
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  active?: boolean;
  disabled?: boolean;
}

// Navbar props
export type NavbarProps = BaseComponentProps;

// Dashboard layout props
export interface DashboardLayoutProps extends BaseComponentProps {
  children: ReactNode;
}

// Chatbot component props
export interface ChatbotProps extends BaseComponentProps {
  noteId: string;
  onClose: () => void;
}

export interface InlineChatbotProps extends BaseComponentProps {
  noteId: string;
}

export interface ChatWithNoteButtonProps extends BaseComponentProps {
  noteId: string;
}

// Audio recorder props
export interface AudioRecorderProps extends BaseComponentProps {
  onTranscriptionComplete: (result: {
    transcript: { id: string; content: string };
  }) => void;
}

export interface RecordAudioProps extends BaseComponentProps {
  onTranscriptionComplete: (result: {
    transcript: { id: string; content: string };
  }) => void;
}

// PDF processor props
export interface PDFProcessorProps extends BaseComponentProps {
  onProcessComplete?: (result: ProcessPDFResult) => void;
}

export interface SimplePDFProcessorProps extends BaseComponentProps {
  onProcessComplete?: (result: ProcessPDFResult) => void;
  onClose?: () => void;
}

// YouTube processor props
export interface YouTubeProcessorProps extends BaseComponentProps {
  onProcessComplete?: (result: {
    transcript: { id: string; content: string; originalName: string };
  }) => void;
}

// Notes viewer props
export interface NotesViewerProps extends BaseComponentProps {
  transcriptId?: string;
  searchQuery?: string;
}

// Quiz viewer props
export interface QuizViewerProps extends BaseComponentProps {
  quiz: QuizQuestion[];
  onClose: () => void;
}

// Flashcard viewer props
export interface FlashcardViewerProps extends BaseComponentProps {
  flashcards: FlashcardItem[];
  onClose: () => void;
  onGenerate?: () => void;
  noteTitle?: string;
}

// MDX renderer props
export interface MDXRendererProps extends BaseComponentProps {
  content: string;
}

// User control props
export interface UserControlProps extends BaseComponentProps {
  showName?: boolean;
}

// Theme provider props
export interface ThemeProviderProps extends BaseComponentProps {
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

// Progress component props
export interface ProgressProps extends BaseComponentProps {
  value: number;
  max?: number;
}

// Badge component props
export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

// Card component props
export type CardProps = BaseComponentProps;

// Accordion component props
export interface AccordionProps extends BaseComponentProps {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
}

// Avatar component props
export interface AvatarProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  fallback?: string;
}

// Dropdown menu props
export interface DropdownMenuProps extends BaseComponentProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
}

export interface DropdownMenuItem {
  id: string;
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
}

// Error message props
export interface ErrorMessageProps extends BaseComponentProps {
  message: string;
  title?: string;
}

// Processing result types (referenced in component props)
export interface ProcessPDFResult {
  transcript: {
    id: string;
    fileName: string;
    originalName: string;
  };
}



// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Toast props
export interface ToastProps extends BaseComponentProps {
  type: NotificationType;
  title: string;
  message?: string;
  onClose: () => void;
}