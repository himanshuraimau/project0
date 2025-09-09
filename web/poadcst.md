
## **Podcast Creation Feature - 5 Key Points**

### **1. Input & Configuration**
User selects existing notes/documents → clicks "Generate Podcast" → chooses language, 2 host voices, duration (3-30 mins), and custom instructions

### **2. Script Generation** 
Vercel AI SDK converts notes into natural 2-person conversational dialogue with personality-based speaking patterns and transitions

### **3. Voice Synthesis**
ElevenLabs API generates realistic audio for each host separately using selected voices with conversational settings

### **4. Storage & Delivery**
Generated podcast audio stored in Vercel Blob with global CDN URLs for fast worldwide playback

### **5. Interactive Experience**
Users get podcast player with timestamped transcripts, speaker identification, playback controls, and AI chatbot for content-specific Q&A

**Simple Pipeline:** Notes → AI Script → Voice Generation → Cloud Storage → Interactive Player

Podcast Creation Workflow
Initial Trigger
The podcast generation process begins when users interact with an existing note or document in the database. A prominent "Generate Podcast" button serves as the entry point, likely positioned within the note interface or as part of a content transformation toolkit.
Configuration Interface
Upon clicking the podcast button, users are presented with a multi-step configuration modal or panel:
Language Selection Module:

Dropdown or grid-based language selector
Support for multiple languages (English, Spanish, French, German, etc.)
Language selection affects both speech synthesis and content adaptation
Potential accent/regional variations within each language

Voice Selection Interface:

Visual voice picker displaying avatar representations of available speakers
Two mandatory selections for Host 1 and Host 2
Each voice option includes:

Sample audio preview (3-5 second clips)
Voice characteristics (gender, age range, tone style)
Personality descriptors (professional, casual, energetic, calm)


Voice pairing suggestions to ensure complementary conversational dynamics

Duration Configuration:

Three preset options with specific time ranges:

Short: 3-7 minutes (ideal for quick summaries)
Medium: 8-15 minutes (comprehensive coverage)
Long: 16-30 minutes (deep-dive analysis)


Visual indicators showing approximate word count and content depth for each option

Custom Instructions Panel:

Free-form text area for specific user requirements
Preset instruction templates:

"Focus on practical applications"
"Include relevant examples and case studies"
"Maintain beginner-friendly explanations"
"Emphasize key takeaways and action items"


Tone and style preferences (conversational, academic, entertaining, informative)
Content emphasis options (prioritize certain sections of the original note)

Processing Phase
After configuration submission, the system displays a progress indicator showing:

Content analysis and structuring
Conversational flow generation
Voice synthesis and audio compilation
Quality assurance and final rendering

Detailed Interface Layout
Right Panel - Comprehensive Media Center
Primary Podcast Player:

Large, prominent audio waveform visualization showing real-time playback progress
Album art/podcast thumbnail (auto-generated or customizable)
Current timestamp display (MM:SS format) and total duration
Loading states and buffering indicators

Speaker Identity Section:

Dual speaker cards positioned side-by-side
Each speaker card contains:

AI-generated avatar or icon representation
Speaker name (AI-assigned or user-customizable)
Voice characteristic tags (e.g., "Professional Male Voice" or "Energetic Female Voice")
Individual speaker logos or branding elements


Visual indicators showing which speaker is currently talking (highlighting, pulsing effects)

Advanced Playback Controls:

Primary Controls:

Large circular play/pause button (changes icon state dynamically)
Skip backward/forward buttons (15-second increments)
Restart/replay entire podcast option


Secondary Controls:

Volume slider with mute/unmute toggle
Playback speed adjustment (0.25x, 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x)
Loop/repeat options for specific segments
Download audio file option


Navigation Features:

Scrub bar with hover tooltips showing timestamp and content preview
Chapter markers for major topic transitions
Bookmark functionality for saving favorite moments



Left Panel - Interactive Content Hub
Timestamped Transcript Section:

Real-time Synchronization:

Auto-scrolling transcript that follows audio playback
Currently spoken text highlighted in real-time
Click-to-jump functionality (clicking any sentence jumps audio to that moment)


Speaker Differentiation:

Color-coded or icon-tagged speaker identification
Distinct typography or styling for each speaker's dialogue
Speaker transition indicators


Enhanced Navigation:
Search functionality within transcript text
Topic-based section headers automatically generated from content
Expandable/collapsible segments for easier browsing
Export transcript options (PDF, TXT, DOCX)


Interactive Features:

Highlight important quotes or segments
Personal note-taking directly linked to specific timestamps
Share specific segments via unique URLs



AI Chatbot Integration:

Contextual Intelligence:

Deep understanding of the entire podcast content
Ability to reference specific speakers, quotes, and timestamps
Cross-referencing with original source document/note


Query Capabilities:

"What did [Speaker Name] say about [topic]?"
"Summarize the key points from minutes 5-10"
"What examples were given for [concept]?"
"Find contradictions or disagreements between speakers"


Response Features:

Detailed answers with timestamp references
Direct links to relevant transcript sections
Follow-up question suggestions
Related topic recommendations


Interface Design:

Chat bubble interface similar to modern messaging apps
Quick action buttons for common queries
Voice input option for hands-free interaction
Conversation history preservation




technical guide :
- use bun and shadncn ui for compoennts 
- use elevenlabs and vercel ai sdk for ai realted stuff




---
title: Developer quickstart
subtitle: Learn how to make your first ElevenLabs API request.
---

The ElevenLabs API provides a simple interface to state-of-the-art audio [models](/docs/models) and [features](/docs/api-reference/introduction). Follow this guide to learn how to create lifelike speech with our Text to Speech API. See the [developer guides](/docs/quickstart#explore-our-developer-guides) for more examples with our other products.

## Using the Text to Speech API

<Steps>
    <Step title="Create an API key">
      [Create an API key in the dashboard here](https://elevenlabs.io/app/settings/api-keys), which you’ll use to securely [access the API](/docs/api-reference/authentication).
      
      Store the key as a managed secret and pass it to the SDKs either as a environment variable via an `.env` file, or directly in your app’s configuration depending on your preference.
      
      ```js title=".env"
      ELEVENLABS_API_KEY=<your_api_key_here>
      ```
      
    </Step>
    <Step title="Install the SDK">
      We'll also use the `dotenv` library to load our API key from an environment variable.
      
      <CodeBlocks>
          ```python
          pip install elevenlabs
          pip install python-dotenv
          ```
      
          ```typescript
          npm install @elevenlabs/elevenlabs-js
          npm install dotenv
          ```
      
      </CodeBlocks>
      

      <Note>
        To play the audio through your speakers, you may be prompted to install [MPV](https://mpv.io/)
      and/or [ffmpeg](https://ffmpeg.org/).
      </Note>
    </Step>
    <Step title="Make your first request">
      Create a new file named `example.py` or `example.mts`, depending on your language of choice and add the following code:
       {/* This snippet was auto-generated */}
       <CodeBlocks>
       ```python
       from dotenv import load_dotenv
       from elevenlabs.client import ElevenLabs
       from elevenlabs import play
       import os
       
       load_dotenv()
       
       elevenlabs = ElevenLabs(
         api_key=os.getenv("ELEVENLABS_API_KEY"),
       )
       
       audio = elevenlabs.text_to_speech.convert(
           text="The first move is what sets everything in motion.",
           voice_id="JBFqnCBsd6RMkjVDRZzb",
           model_id="eleven_multilingual_v2",
           output_format="mp3_44100_128",
       )
       
       play(audio)
       
       ```
       
       ```typescript
       import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';
       import 'dotenv/config';
       
       const elevenlabs = new ElevenLabsClient();
       const audio = await elevenlabs.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
         text: 'The first move is what sets everything in motion.',
         modelId: 'eleven_multilingual_v2',
         outputFormat: 'mp3_44100_128',
       });
       
       await play(audio);
       
       ```
       
       </CodeBlocks>
    </Step>
    <Step title="Run the code">
        <CodeBlocks>
            ```python
            python example.py
            ```

            ```typescript
            npx tsx example.mts
            ```
        </CodeBlocks>

        You should hear the audio play through your speakers.
    </Step>

</Steps>

## Explore our developer guides

Now that you've made your first ElevenLabs API request, you can explore the other products that ElevenLabs offers.

<CardGroup cols={2}>
  <Card
    title="Speech to Text"
    icon="duotone pen-clip"
    href="/docs/cookbooks/speech-to-text/quickstart"
  >
    Convert spoken audio into text
  </Card>
  <Card title="ElevenLabs Agents" icon="duotone comments" href="/docs/agents-platform/quickstart">
    Deploy conversational voice agents
  </Card>
  <Card title="Music" icon="duotone music" href="/docs/cookbooks/music/quickstart">
    Generate studio-quality music
  </Card>
  <Card
    title="Voice cloning"
    icon="duotone clone"
    href="/docs/cookbooks/voices/instant-voice-cloning"
  >
    Clone a voice
  </Card>
  <Card title="Sound effects" icon="duotone explosion" href="/docs/cookbooks/sound-effects">
    Generate sound effects from text
  </Card>
  <Card title="Voice Changer" icon="duotone message-pen" href="/docs/cookbooks/voice-changer">
    Transform the voice of an audio file
  </Card>
  <Card title="Voice Isolator" icon="duotone ear" href="/docs/cookbooks/voice-isolator">
    Isolate background noise from audio
  </Card>
  <Card title="Voice Design" icon="duotone paint-brush" href="/docs/cookbooks/voices/voice-design">
    Generate voices from a single text prompt
  </Card>
  <Card title="Dubbing" icon="duotone language" href="/docs/cookbooks/dubbing">
    Dub audio/video from one language to another
  </Card>
  <Card
    title="Forced Alignment"
    icon="duotone objects-align-left"
    href="/docs/cookbooks/forced-alignment"
  >
    Generate time-aligned transcripts for audio
  </Card>
</CardGroup>

