## Home Page

The Home Page serves as the central hub for note creation and management, featuring intuitive UI components and modals for various input methods.

### ✅ Common Components (Visible on All Pages)

- **Navbar**  
  - Positioned at the top.  
  - Left: Website name/logo  
  - Right: “Subscribe” button  

- **Sidebar (Left-aligned)**  
  - Menu Items:  
    - Home  
    - How to use  
    - Support  
    - Settings  
  - Each item includes an icon on the left.  
  - Animations:  
    - Hover animations on menu items  
    - Active page indicator with highlight or animation

---

### 📝 Main Sections of Home Page

#### 🔹 New Note Section
- **Section Title**: "New Note"
- **Subtitle**: Brief instructional text (e.g., “Choose input method”)
- **Buttons (with icons)**:
  1. Record Audio  
  2. Web Link  
  3. Upload PDF/Text  
  4. Upload Audio  

#### 🔹 My Notes Section
- **Dropdown**: "All Notes"
  - Options:
    - Create New Folder
    - Edit Folder
- **Search Bar**: Positioned to the right of dropdown
- **Note Blocks**:  
  - Horizontally stacked  
  - Each block includes:
    - Note icon/logo  
    - Note title  
    - Timestamp  

---

### 🎤 Record Audio Modal

- Title: "Record audio" (left-aligned), with a close button (right-aligned)
- **Dropdown**: Choose audio language
- **Buttons**:
  - Start Recording  
  - More Note Options  

**While Recording**:
- Timer appears
- “More Note Options” → “Stop Recording”  

**After Stopping**:
- Stop button transforms into:
  - Delete  
  - Resume  
  - Save  

---

### 🌐 Web Link Modal

- Title: "Web link", close button at right
- **Input**: Field for pasting a URL
- **Description**: Indicates supported link types
- **Buttons**:
  - Summarize Link  
  - More Note Options  

**After Clicking “Summarize Link”**:
- Summary is generated
- A new note block appears in "My Notes"

---

### 📄 Upload PDF/Text Modal

- Title: "Upload text", close button at right
- **Input Area**: Large text box for pasting raw text
- **Buttons** (vertically stacked):
  1. Submit Text  
  2. Import PDF  
  3. More Note Options  

**After Clicking “Submit Text”**:
- Summary is generated
- Note is added to "My Notes"

---

### 🔊 Upload Audio Modal

- Title: "Upload an audio file", close button at right
- **Dropdown**: Select audio language
- **Buttons**:
  - Select Audio File  
  - More Note Options  


## Note Details Page

This page is displayed when a user clicks on a note block from the **My Notes** section. It provides detailed views and advanced interactions with a specific note.

---

### 🧾 Note Information Section

- **Title**: Displayed at the top-left
- **Add to Folder**: Button to add the note to a folder
- **Date of Creation**: Displayed below the title
- **Embedded Video (iframe)**:  
  - Shown only if the note was generated from a video link (e.g., YouTube)
  - Responsive iframe embedded below the note title

---

### 🛠 Action Buttons (Grouped in Pairs)

Buttons available below the video (if present) or below the note details:

- **Edit Note**
- **View Transcript**
- **Create Quiz**
- **Create Flashcards**
- **Chat with Note**
- *(Additional actions can be added here)*

---

### 📄 Summary Display Section

- Rendered note summary content
- Located below the action buttons

---

### 👍 Feedback Section

- **Like / Dislike** toggle
- Used to collect user sentiment about the summary

---

### 🔘 Footer Action Buttons

Located at the bottom of the note detail page:

- **Edit Note and Transcript**
- **Full Transcript**
- **Translate**
- **Delete Note**

---

## ✏️ Modals & Sub-Features

---

### 📝 Edit Note Modal

- **Modal Title**: "Edit note details" (top-left)
- **Close Button**: Top-right
- **Avatar Display**:
  - Shows current avatar/logo of note
  - Editable via avatar edit button in circular UI
- **Input Field**: To edit note title
- **Action Buttons**:
  - Edit Notes
  - Edit Transcript

---

### 📜 View Transcript Page

- Displays the full transcript of the note
- Takes up the full screen
- No editing options on this view-only page

---

### ❓ Create Quiz Page

- Automatically generates multiple-choice questions (MCQs) from the note
- **Each quiz includes**:
  - Question
  - Four answer options
- **Navigation Buttons**:
  - Next
  - Previous
  - Report a Problem

---

### 🃏 Create Flashcards Page

- Dynamically generated flashcards from the note content
- **Flashcard Behavior**:
  - Question visible by default
  - Flips to show the answer on click/tap
- **Navigation Buttons**:
  - Next
  - Previous
  - Report a Problem

---

### 💬 Chat With Note (Chatbot Panel)

- Appears on right 40% of the screen
- **Top Bar Includes**:
  - Bot logo (left)
  - Maximize button (right)
  - Close button (right)
- **Below Top Bar**:
  - Title: “Chat with this note”
  - Chat display area showing conversation history
  - Text input field with “Send” button
