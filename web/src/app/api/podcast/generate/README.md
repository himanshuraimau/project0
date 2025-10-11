# Podcast Generation API

This API endpoint handles podcast generation from note content using the ElevenLabs Podcast API.

## Endpoints

### POST /api/podcast/generate

Generates a new podcast from note content.

#### Request Body

```json
{
  "noteId": "string",
  "mode": "CONVERSATION" | "BULLETIN",
  "voiceSettings": {
    "hostVoiceId": "string",
    "guestVoiceId": "string" // Required for CONVERSATION mode
  },
  "qualityPreset": "STANDARD" | "HIGH" | "HIGHEST" | "ULTRA" | "ULTRA_LOSSLESS",
  "durationScale": "SHORT" | "DEFAULT" | "LONG",
  "language": "string", // Optional
  "intro": "string", // Optional, max 1000 chars
  "outro": "string" // Optional, max 1000 chars
}
```

#### Response

**Success (201):**
```json
{
  "success": true,
  "data": {
    "podcast": {
      "id": "string",
      "noteId": "string",
      "status": "GENERATING",
      "mode": "CONVERSATION",
      // ... other podcast fields
    },
    "message": "Podcast generation started successfully"
  }
}
```

**Error (400/401/403/404/500/502/503):**
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

### GET /api/podcast/generate

Returns configuration information for podcast generation.

#### Response

```json
{
  "success": true,
  "data": {
    "modes": [
      {
        "value": "CONVERSATION",
        "label": "Conversation",
        "description": "Two-person conversation format with host and guest",
        "requiresGuestVoice": true
      },
      {
        "value": "BULLETIN",
        "label": "Bulletin", 
        "description": "Single-host news bulletin format",
        "requiresGuestVoice": false
      }
    ],
    "qualityPresets": [...],
    "durationScales": [...],
    "limits": {
      "maxIntroLength": 1000,
      "maxOutroLength": 1000,
      "maxContentLength": 50000
    },
    "supportedLanguages": ["en", "es", "fr", ...]
  }
}
```

## Authentication

All endpoints require authentication via Clerk. The user ID is automatically extracted from the authentication context.

## Validation

- Request body is validated using Zod schema
- Conversation mode requires both host and guest voice IDs
- Bulletin mode only requires host voice ID
- Intro/outro text limited to 1000 characters each

## Error Handling

- 400: Invalid request data or validation errors
- 401: Authentication required
- 403: Unauthorized access to note
- 404: Note not found
- 500: Internal server error
- 502: ElevenLabs API error
- 503: Database service unavailable

## Requirements Satisfied

- **1.3**: Direct integration with ElevenLabs Podcast API
- **1.4**: Input validation for generation options and note content
- **6.1**: Proper error handling and user-friendly error messages