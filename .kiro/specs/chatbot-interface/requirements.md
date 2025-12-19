# Requirements Document

## Introduction

This document specifies the requirements for implementing a minimal chatbot interface in the React Native mobile application. The chatbot allows users to interact with AI about their notes through a clean, content-focused conversational UI. The interface follows a single-column vertical layout with a static header, scrollable chat body, and fixed bottom input bar. The design prioritizes clarity, accessibility, and smooth keyboard interactions.

## Glossary

- **Chat_System**: The chatbot interface component that enables conversational interaction between users and AI about note content
- **Message_Bubble**: A visual container displaying a single chat message with sender-specific styling
- **Input_Bar**: The fixed bottom component containing the text input field and send button
- **Chat_Body**: The scrollable container holding all message bubbles
- **Header**: The static top navigation bar with back button and title
- **Bot_Message**: A message sent by the AI assistant, displayed left-aligned with gray background
- **User_Message**: A message sent by the user, displayed right-aligned with purple background

## Requirements

### Requirement 1

**User Story:** As a user, I want to view a clean chat interface with a static header, so that I can always access navigation while chatting.

#### Acceptance Criteria

1. WHEN the chat screen loads THEN the Chat_System SHALL display a header with height 64-72px, white background (#FFFFFF), and 1px bottom border (#EAEAEA)
2. WHEN the chat screen loads THEN the Chat_System SHALL display a circular back button (40x40px) with 1px border (#D0D0D0) and left-arrow icon on the left side of the header
3. WHEN the chat screen loads THEN the Chat_System SHALL display "Chat" title centered in the header with 18-20px semibold font (#000000)
4. WHEN the keyboard appears THEN the Header SHALL remain in its exact position without any movement, transform, or opacity change
5. WHEN the user taps the back button THEN the Chat_System SHALL navigate to the previous screen

### Requirement 2

**User Story:** As a user, I want to see my messages and bot responses in distinct visual styles, so that I can easily distinguish between them.

#### Acceptance Criteria

1. WHEN a Bot_Message is displayed THEN the Chat_System SHALL render it left-aligned with #F2F2F2 background, 18-20px border radius, max-width 75-80%, and #222222 text color
2. WHEN a User_Message is displayed THEN the Chat_System SHALL render it right-aligned with #7A2EFF background, 20-22px border radius, max-width 60-70%, and #FFFFFF text color
3. WHEN messages are displayed THEN the Chat_System SHALL apply 10-12px vertical gap between consecutive messages
4. WHEN message text is rendered THEN the Chat_System SHALL use 15-16px font size with 1.5 line height for bot messages and 1.4 for user messages
5. WHEN a message contains long text THEN the Message_Bubble SHALL wrap text to multiple lines while maintaining padding (12px vertical, 14px horizontal)

### Requirement 3

**User Story:** As a user, I want to scroll through my chat history, so that I can review previous messages in the conversation.

#### Acceptance Criteria

1. WHEN the chat screen loads THEN the Chat_Body SHALL display all previous messages in chronological order
2. WHEN new messages exceed the visible area THEN the Chat_Body SHALL enable vertical scrolling
3. WHEN a new message is added while user is at the bottom THEN the Chat_Body SHALL auto-scroll to show the new message
4. WHEN a new message is added while user is scrolled up THEN the Chat_Body SHALL preserve the current scroll position
5. WHEN the keyboard appears THEN the Chat_Body SHALL compress vertically to accommodate the keyboard while maintaining message visibility

### Requirement 4

**User Story:** As a user, I want to type and send messages through an input bar, so that I can communicate with the AI assistant.

#### Acceptance Criteria

1. WHEN the chat screen loads THEN the Input_Bar SHALL display a pill-shaped input field (48-52px height, 24-26px border radius) with "Ask anything…" placeholder (#A0A0A0)
2. WHEN the input field is unfocused THEN the Input_Bar SHALL display 1px solid #333333 border
3. WHEN the input field is focused THEN the Input_Bar SHALL display 1.5px solid #000000 border
4. WHEN the input field is empty THEN the send button icon SHALL display with 50% opacity (#A0A0A0)
5. WHEN the input field contains text THEN the send button icon SHALL display with 100% opacity (#7A2EFF)
6. WHEN the user taps the send button with text entered THEN the Chat_System SHALL send the message and clear the input field
7. WHEN the user taps the send button with empty input THEN the Chat_System SHALL not perform any action

### Requirement 5

**User Story:** As a user, I want the keyboard interaction to be smooth and predictable, so that I can type messages without UI disruption.

#### Acceptance Criteria

1. WHEN the keyboard appears THEN the Input_Bar SHALL position directly above the keyboard with 0px gap
2. WHEN the keyboard appears THEN the Chat_Body SHALL reduce height by the keyboard height with smooth animation
3. WHEN the keyboard dismisses THEN the Input_Bar SHALL return to the bottom of the screen
4. WHEN the keyboard dismisses THEN the Chat_Body SHALL expand to fill the available space
5. WHEN keyboard transitions occur THEN the Chat_System SHALL maintain 60fps animation performance

### Requirement 6

**User Story:** As a user, I want my chat messages to be persisted locally, so that I can continue conversations when I return to the chat.

#### Acceptance Criteria

1. WHEN a message is sent THEN the Chat_System SHALL persist the message to local storage immediately
2. WHEN the chat screen loads THEN the Chat_System SHALL load and display previously saved messages for the current note
3. WHEN the user sends a message THEN the Chat_System SHALL display the user message immediately before receiving the bot response

### Requirement 7

**User Story:** As a user, I want the chat interface to be accessible, so that I can use it with assistive technologies.

#### Acceptance Criteria

1. WHEN a screen reader is active THEN the back button SHALL announce "Back, button"
2. WHEN a screen reader is active THEN Bot_Messages SHALL announce "Bot says, [message content]"
3. WHEN a screen reader is active THEN User_Messages SHALL announce "You said, [message content]"
4. WHEN a screen reader is active THEN the input field SHALL announce "Message input field, Ask anything"
5. WHEN a screen reader is active THEN the send button SHALL announce "Send message, button"
