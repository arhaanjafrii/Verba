// Transcription service for Verba - AI-powered audio transcription
import { pipeline } from '@xenova/transformers';

/**
 * Transcribes audio using the speech-to-text API
 * @param {File} audioFile - The audio file to transcribe
 * @param {Object} options - Additional options for transcription
 * @returns {Promise<string>} - The transcribed text
 */
export const transcribeAudio = async (audioFile, options = {}) => {
  try {
    // Validate audio file
    if (!audioFile) {
      throw new Error('No audio file provided');
    }

    // Check file size (max 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (audioFile.size > maxSize) {
      throw new Error('Audio file size exceeds 25MB limit');
    }

    // Validate file type
    const baseTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/m4a', 'audio/x-m4a'];
    const validTypes = [
      ...baseTypes,
      'audio/webm;codecs=opus',
      'audio/webm;codecs=vorbis'
    ];
    
    // Check if the file type matches any valid type or starts with a valid base type
    const isValidType = validTypes.includes(audioFile.type) || 
      baseTypes.some(type => audioFile.type.startsWith(type));
    
    if (!isValidType) {
      throw new Error(`Unsupported audio format: ${audioFile.type}. Please use WAV, MP3, WebM (including Opus/Vorbis codecs), or M4A format.`);
    }

    // Create form data to send the audio file
    const formData = new FormData();
    formData.append('file', audioFile);
    
    // Add any additional options
    Object.entries(options).forEach(([key, value]) => {
      if (key !== 'processTask') { // Skip processTask as it's not for the API
        formData.append(key, value);
      }
    });
    
    // Get API key from environment or use a default one for development
    // In production, this should be properly secured
    const apiKey = import.meta.env.VITE_HF_API_KEY || '';
    
    if (!apiKey) {
      throw new Error('API key is required for transcription');
    }
    
    // For recorded audio, we need to ensure it's in a format Whisper can process
    // The "Malformed soundfile" error often occurs when the audio format isn't properly recognized
    
    // Create a properly formatted audio data using whisper.load_audio
    let processedAudioFile = audioFile;
    let audioData = null;
    
    try {
      // Convert the audio file to an ArrayBuffer
      const audioBuffer = await audioFile.arrayBuffer();
      
      // Create a temporary URL for the audio file
      const tempBlob = new Blob([audioBuffer], { type: audioFile.type || 'audio/wav' });
      const tempURL = URL.createObjectURL(tempBlob);
      
      try {
        // Load the audio using whisper's pipeline to properly format it
        // This is a workaround for the "Malformed soundfile" error
        const pipe = await pipeline('automatic-speech-recognition');
        
        // Process the audio data
        const result = await pipe(tempURL, {
          chunk_length_s: 30,
          stride_length_s: [6, 0],
          return_timestamps: true,
          ignore_warning: true
        });
        
        // Extract the transcribed text
        if (result && result.text) {
          return result.text;
        }
      } finally {
        // Clean up the temporary URL
        URL.revokeObjectURL(tempURL);
      }
    } catch (whisperError) {
      console.warn('Whisper direct processing failed, falling back to API:', whisperError);
      // If whisper processing fails, fall back to the original method
    }
    
    // If whisper processing failed or wasn't attempted, continue with the original method
    // If this is a Blob from recording (not a File from upload), ensure proper formatting
    if (audioFile instanceof Blob && !(audioFile instanceof File)) {
      const audioBuffer = await audioFile.arrayBuffer();
      
      // For recorded audio, explicitly use WAV format which Whisper handles well 
      const mimeType = 'audio/wav';
      
      // Create a new blob with the proper MIME type
      processedAudioFile = new Blob([audioBuffer], { type: mimeType });
      
      // Give it a filename to help with MIME type detection on the server
      processedAudioFile = new File([processedAudioFile], 'recording.wav', { type: mimeType });
    }
    
    // Update formData with the properly formatted audio file
    formData.delete('file');
    formData.append('file', processedAudioFile);
    
    // Make the API request to our transcription service
    const response = await fetch('https://api-inference.huggingface.co/models/openai/whisper-large-v3', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
        // Don't set Content-Type when sending FormData
        // The browser will set it automatically with the correct boundary
      },
      body: formData // Send the FormData directly, not as JSON
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to transcribe audio';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the error text directly
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.text || data.generated_text || '';
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

/**
 * Process the transcription with AI for formatting, summarization, etc.
 * @param {string} text - The transcribed text to process
 * @param {string} task - The processing task (format, summarize, email, etc.) or custom instructions
 * @returns {Promise<string>} - The processed text
 */
export const processTranscription = async (text, task = 'format') => {
  try {
    // Define the prompt based on the task
    let prompt = '';
    
    // Check if task is a built-in option or custom instructions
    if (task.startsWith('custom:')) {
      // Extract custom instructions from the task string
      const customInstructions = task.substring(7).trim();
      prompt = `${customInstructions}:\n\n${text}`;
    } else {
      // Use predefined prompts for built-in options - each with distinct output styles
      switch (task) {
        case 'format':
        case 'transcript':
          prompt = `IMPORTANT: Create a verbatim transcript of this audio with minimal edits. Only fix grammar, punctuation, and capitalization. Maintain the exact wording and speaking style of the original. Create proper paragraphs where natural pauses occur. DO NOT summarize or change any content. DO NOT add any interpretations. The result should look like a professional transcript that preserves the speaker's exact words and style:\n\n${text}`;
          break;
        case 'summarize':
        case 'summary': // Added 'summary' as an alias for summarize
          prompt = `IMPORTANT: Create a concise executive summary (30-40% of original length) that captures ONLY the most essential points. Start with a one-sentence overview. Then include 3-5 key takeaways as short paragraphs. Focus on conclusions and main arguments, NOT supporting details. The summary should be significantly shorter than the original while capturing its essence. Use formal, professional language:\n\n${text}`;
          break;
        case 'email':
          prompt = `IMPORTANT: Transform this transcription into a formal business email with these EXACT components: 1) Professional subject line, 2) Formal greeting with recipient name if mentioned, 3) Brief introduction paragraph, 4) 2-3 body paragraphs with the main content organized logically, 5) Clear closing paragraph with any requested actions, 6) Professional sign-off and signature with sender's name and position if mentioned. Use business email conventions and formal language throughout:\n\n${text}`;
          break;
        case 'meeting_notes':
          prompt = `IMPORTANT: Convert this transcription into structured meeting notes with EXACTLY this format: 1) "MEETING SUMMARY" section with date, time, and objective if mentioned, 2) "PARTICIPANTS" section listing all mentioned attendees, 3) "DISCUSSION TOPICS" section with H3 headings for each major topic and bullet points underneath, 4) "ACTION ITEMS" section with assigned tasks, owners, and deadlines in a table format, 5) "NEXT STEPS" section with upcoming meetings or follow-ups. Use professional, concise language throughout:\n\n${text}`;
          break;
        case 'bullet_points':
        case 'bullets': // Added 'bullets' as an alias for bullet_points
          prompt = `IMPORTANT: Transform this transcription into a hierarchical bullet point structure with these EXACT elements: 1) Main topics as level 1 bullets with emoji icons, 2) Subtopics as level 2 bullets (indented with dashes), 3) Key details as level 3 bullets (further indented with asterisks). Ensure bullets are concise (max 15 words each). Group related points together. Use parallel grammar structure for all bullets at the same level. The result should be a visually organized, scannable document:\n\n${text}`;
          break;
        case 'action_items':
          prompt = `IMPORTANT: Extract ONLY action items, tasks, and commitments from this transcription. Format as a numbered task list with EXACTLY these components for each item: 1) Task description starting with an action verb, 2) Assignee in [brackets], 3) Deadline in (parentheses) if mentioned, 4) Priority marked as [HIGH], [MEDIUM], or [LOW] based on urgency cues. Include ONLY actionable items, not general discussion points. The result should look like a project management task list:\n\n${text}`;
          break;
        case 'qa_format':
          prompt = `IMPORTANT: Restructure this transcription into a formal Q&A document with EXACTLY this format: 1) Each question prefixed with "Q:" in bold, 2) Each answer prefixed with "A:" in regular text, 3) Questions and answers grouped by topic with topic headings, 4) Similar questions consolidated, 5) Answers expanded to provide complete information. Ensure technical accuracy and professional language. The result should look like an official FAQ or interview transcript:\n\n${text}`;
          break;
        case 'note': // Added specific case for 'note' style
          prompt = `IMPORTANT: Transform this transcription into a concise, well-structured note. Format with clear headings, short paragraphs, and emphasis on key points. Maintain the essential information while making it more readable and organized. The result should be a clean, professional note that captures the main ideas:\n\n${text}`;
          break;
        default:
          prompt = `Process the following transcription according to standard formatting rules:\n\n${text}`;
      }
    }
    
    try {
      // Use Hugging Face API for text processing
      console.log('Processing text with Hugging Face API...');
      
      // Get API key from environment
      const apiKey = import.meta.env.VITE_HF_API_KEY || '';
      
      if (!apiKey) {
        throw new Error('API key is required for text processing. Please add your Hugging Face API key to the .env file as VITE_HF_API_KEY.');
      }
      
      // Make the API request to Hugging Face
      // Using a more reliable model for text processing
      const response = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-xl', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 1024,
            temperature: 0.7,
            top_p: 0.95,
            do_sample: true
          }
        })
      });
      
      console.log('Processing API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to process text';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      return result[0]?.generated_text || formatBasicText(text);
      
    } catch (localError) {
      console.warn('Error using local model:', localError);
      // Fall back to basic formatting if local model fails
      return formatBasicText(text);
    }
  } catch (error) {
    console.error('Processing error:', error);
    // Return the original text if processing fails
    return text;
  }
};

/**
 * Basic text formatting function as a fallback
 * @param {string} text - The text to format
 * @returns {string} - The formatted text
 */
const formatBasicText = (text) => {
  // Simple formatting: capitalize sentences, add periods if missing
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  const formattedSentences = sentences.map(sentence => {
    // Trim whitespace
    let formatted = sentence.trim();
    
    // Capitalize first letter if not already capitalized
    if (formatted && formatted.length > 0) {
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    
    // Add period if missing ending punctuation
    if (formatted && !formatted.match(/[.!?]$/)) {
      formatted += '.';
    }
    
    return formatted;
  });
  
  // Join sentences with spaces
  return formattedSentences.join(' ');
};