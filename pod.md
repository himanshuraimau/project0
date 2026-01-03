### Podcast Page — Detailed UI Description (Main Content Area Only)

---

## Overall Layout Structure

The page uses a **two-column main layout** excluding the sidebar:

* **Left column (content navigation)**: section-based breakdown of the podcast.
* **Right column (media player)**: visual-rich podcast playback card with controls and interaction.

The layout is clean, white-dominant, and spaced for readability, following a **modern SaaS / knowledge-product design language**.

---

## Header Area

At the top of the page:

* **Breadcrumb-style navigation text**:

  * `My Podcasts > Understanding the Many Meanings of 'Cell'`
  * Light-weight font, muted gray color, non-dominant.
* **Main title**:

  * “Understanding the Many Meanings of ‘Cell’”
  * Medium-to-large font size, regular to semi-bold weight.
* **Top-right actions**:

  * “Share” button with icon
  * Star/Favorite icon
  * Both are subtle, icon-led, not visually heavy.

---

## Tab Switcher

Directly below the title:

* Two tabs:

  * **Sections** (active)
  * Full Transcript (inactive)
* Active tab is emphasized using:

  * A **thin purple outline/border**
  * Slight contrast against the background
* Tabs are rectangular with soft corners, minimal height, no heavy shadows.

This establishes a **content-mode toggle** between structured summaries and raw transcript.

---

## Left Column — Sections List

This column contains **stacked content cards**, each representing a podcast section.

### Section Card Design

Each card includes:

* **Section title**

  * Purple text
  * Slightly larger than body text
  * Left-aligned
* **Timestamp**

  * Right-aligned
  * Same purple color
  * Smaller font size
* **Description**

  * 2–3 lines of muted gray text
  * Explains the content of that segment in plain language

### Example Sections Shown

1. **The Multifaceted ‘Cell’ (0:00)**

   * Describes multiple meanings across biology, technology, law, and religion.
2. **Historical Discovery of Cells (1:15)**

   * Focused on scientific history and Robert Hooke.
3. **Types of Cells (2:30)**

   * Prokaryotic vs eukaryotic.
4. **Cell Functions and Life (3:45)**

   * Metabolism, growth, reproduction, stimuli response.

### Visual Style

* Cards have:

  * Soft rounded corners
  * Very light border or subtle shadow
  * White background
* Generous vertical spacing between cards.
* Designed for scanning, not dense reading.

---

## Right Column — Podcast Player Card

This is the **visual anchor** of the page.

### Player Container

* Large rounded rectangle card
* Light gray background distinct from the page
* Centered content alignment

---

### Cover Image

* Large rectangular image at the top of the card
* Shows **fluorescent microscopy-style cells**:

  * Deep black background
  * Purple, blue, and pink glowing cell structures
* Rounded corners
* Overlay **share icon** in the top-right of the image

---

### Podcast Metadata

Below the image:

* **Podcast title** repeated

  * Medium font size
  * Center-aligned
* **Speakers/hosts**

  * Two circular avatars
  * Names shown below each avatar:

    * Leo
    * Maya
  * Neutral illustration-style avatars

---

### Playback Progress Bar

* Horizontal slider
* Left shows current time: `0:00`
* Right shows total duration: `5:04`
* Minimal contrast track with circular scrub handle

---

### Playback Controls

Centered below the progress bar:

* Speaker/volume icon
* Previous track button
* **Primary play button**

  * Dark circular background
  * White play icon
  * Largest control visually
* Next track button
* Playback speed indicator (`1x`)

Controls are evenly spaced, circular, and icon-only.

---

## Bottom Interaction Field

At the bottom of the player card:

* **Input field** with placeholder:

  * “Ask about this podcast…”
* Left side shows a subtle sparkle icon indicating AI assistance
* Right side has a purple send button
* Rounded input with light border

This positions the page as **interactive and AI-augmented**, not passive media.

---

## Design Language Summary

* **Color palette**:

  * White base
  * Soft gray containers
  * Purple as the primary accent
* **Typography**:

  * Sans-serif
  * Clean hierarchy
  * No heavy bold usage
* **UI style**:

  * Calm, academic, product-oriented
  * No visual clutter
  * Optimized for learning and reference
* **Intent**:

  * Structured consumption
  * Quick navigation
  * AI-assisted understanding
