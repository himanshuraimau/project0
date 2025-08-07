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


## How to Use Page

This page guides users through getting started with the platform.

---

### 🚀 Getting Started Section

- **Main Title**: "Get started in 20 seconds"
- **Instructional Video**:  
  - Embedded YouTube iframe  
  - Provides a quick overview of the platform and its core features

---

## Support Page

The Support page provides users with helpful FAQs, categorized support topics, and a way to contact the support team.

---

### 🆘 Help Centre Section

- **Main Title**: "Help Centre"
- **Short Description**: Brief sentence explaining the purpose of the support page

---

### ⭐ Most Popular FAQs

- **Subtitle**: "Most Popular"
- **UI Component**: Horizontal accordion-style collapsible blocks
- **FAQ Entries**:
  - **Family plan?**: Details about multi-user access or family sharing
  - **Gift coconote?**: Information on gifting subscriptions
  - **Do you support my language?**: List of supported languages or request process
  - **Feature request/improvement!**: How to suggest features or report ideas

---

### 📁 Other FAQ Categories

Each section uses the same horizontal collapsible block style as "Most Popular":

- **Recording & Notes**
- **Subscription & Payments**

Each contains relevant questions with expand/collapse support for viewing answers.

---

### 📧 Support Email Section

- **Subtitle**: "Support Email"
- **Description Box**:  
  - Provides official support email  
  - Brief explanation on expected response times or usage guidelines

---

### 📞 Contact Us Section

- **Title**: "Contact Us"
- **Message Box**:  
  - Text input area for users to type their concerns or questions  
- **Send Button**:  
  - Submits the user's message to support team


## Settings Page

The Settings page provides user options related to account management, sharing, and legal actions.

---

### ⚙️ Settings Menu

- **Main Title**: "Settings" (top-left of the page)
- **Buttons** (stacked vertically, each with an icon):
  - **Gift**: Send a subscription gift
  - **Share with a Friend**: Referral or invite system
  - **Redeem Code**: Apply a promo or gift code
  - **Privacy Policy**: View legal terms and privacy details
  - **Sign Out**: Log out of current session
  - **Delete Account**: Permanently remove the user account

---

## Subscription Modal / Free Trial UI

This modal opens when the **Subscribe** button is clicked and allows users to start a free trial and view subscription benefits.

---

### 🟣 Trial Offer Section

- **Title**: “Try Coconote **free for 7 days**”
- **Features Highlighted**:
  - ✅ Unlimited AI notes, recordings, uploads
  - ✅ Quizzes, videos, podcasts, & more
  - ✅ YouTube, PDF, audio, files, websites
  - ✅ Chat with your notes
  - ✅ Private and secure usage

- **Plan Options**:
  - **Yearly**: $129 (46% savings badge)
  - **Monthly**: $19 (grayed out, non-selectable in free trial modal)

- **Call-to-Action Button**:  
  - Text: “Try Coconote for $0”
  - Subtext: “No risk, no payment today”

- **Live Join Counter**: Shows how many users have started today (e.g., *2,246 others started today*)

---

### 🧠 Trial Timeline (Right Section)

- Cartoon mascot illustration beside plan details
- **Reminder Message**: “psst.. we’ll remind you before your trial ends!”
- **Timeline Info**:
  - **Today**: Unlimited Pass unlocked, instantly
  - **August 12**: Reminder will be sent before the trial ends
  - **August 14**: Trial ends and subscription starts

- **Free Trial Countdown Timer**:
  - Top-right badge showing time left to reserve free trial (e.g., `00:00`)

- **Close Button**: Top-right of modal to exit the offer view