import React, { createContext, useState, useContext } from 'react';
import { transcribeAudio, processTranscription } from "../services/transcriptionService";

// Create the context
const TranscriptionContext = createContext();

// Custom hook to use the transcription context
export const useTranscription = () => useContext(TranscriptionContext);

// Provider component
export const TranscriptionProvider = ({ children }) => {
  const [transcription, setTranscription] = useState('');
  const [processedText, setProcessedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Transcribe an audio file
   * @param {File} audioFile - The audio file to transcribe
   * @param {Object} options - Additional options for transcription
   */
  const transcribe = async (audioFile, options = {}) => {
    if (!audioFile) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Perform the transcription
      const text = await transcribeAudio(audioFile, options);
      setTranscription(text);
      
      // Process the transcription if needed
      if (options.processTask) {
        const processed = await processTranscription(text, options.processTask);
        setProcessedText(processed);
      } else {
        // Always apply at least basic formatting to the transcription
        // This ensures the raw Whisper output is never displayed as the final result
        const processed = await processTranscription(text, 'format');
        setProcessedText(processed);
      }
      
      return text;
    } catch (err) {
      setError(err.message || 'Failed to transcribe audio');
      console.error('Transcription error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Process existing transcription text
   * @param {string} text - The text to process
   * @param {string} task - The processing task
   */
  const process = async (text = transcription, task = 'format') => {
    if (!text) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const processed = await processTranscription(text, task);
      setProcessedText(processed);
      return processed;
    } catch (err) {
      setError(err.message || 'Failed to process transcription');
      console.error('Processing error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Reset the transcription state
   */
  const reset = () => {
    setTranscription('');
    setProcessedText('');
    setError(null);
  };

  // Context value
  const value = {
    transcription,
    processedText,
    isProcessing,
    error,
    transcribe,
    process,
    reset
  };

  return (
    <TranscriptionContext.Provider value={value}>
      {children}
    </TranscriptionContext.Provider>
  );
};