# Verba

A modern, minimalistic AI-powered transcription web application that converts speech to text with advanced processing capabilities using free, open-source models.

## Features

- Clean, modern UI with white background and purple accents
- Smooth animations and gradient effects
- Audio file upload for transcription
- Audio recording directly in browser
- AI-powered speech-to-text transcription using free Whisper model
- Advanced text processing (formatting, summarization) using free AI models
- Audio playback of recordings
- Download and copy transcription results
- No API keys required - works out of the box!

## Technologies Used

- React with Vite for fast development
- Framer Motion for smooth animations
- TailwindCSS for styling
- Free Whisper model for speech-to-text via Hugging Face
- Free FLAN-T5 model for text processing via Hugging Face

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. API keys (optional):
   - The application works without API keys using free models
   - If you want to use the paid API versions:
     - Copy `.env.example` to `.env`
     - Add your API keys to the `.env` file

4. Start the development server:

```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Free Models Information

### Transcription
- Uses OpenAI's Whisper base model via Hugging Face's free inference API
- No API key required
- Subject to Hugging Face's free tier rate limits
- Includes fallback mechanisms when the API is unavailable

### Text Processing
- Uses Google's FLAN-T5-base model via Hugging Face's free inference API
- Provides formatting and summarization capabilities
- No API key required
- Includes basic fallback processing when the API is unavailable

## Fallback Mechanisms

The application includes fallback mechanisms for when the free APIs are unavailable or rate-limited:

1. **Transcription**: If the Whisper API is unavailable, the application will display a message asking the user to try again later.

2. **Text Processing**: If the AI processing API is unavailable, the application will use basic text formatting rules to process the transcription.

## Project Structure

- `/src/pages` - Main application pages
- `/src/components` - Reusable UI components
- `/src/assets` - Static assets like images
- `/src/services` - API and service integrations
- `/src/utils` - Utility functions and helpers
- `/src/context` - React context providers

## Usage

1. Navigate to the Transcribe page
2. Upload an audio file or record directly in your browser
3. Click "Transcribe Now" to process the audio
4. View, download, or copy the transcription results

## API Keys

This application requires the following API keys:

1. Speech-to-text API key - For transcribing audio files
2. AI processing API key - For advanced text processing

Add these keys to your `.env` file after copying from `.env.example`.

## Note

For production use, you should:

1. Implement proper user authentication
2. Add server-side processing for larger files
3. Consider adding a backend for better security of API keys