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
      
      // IMPORTANT: Always process the transcription through the Google Flan model
      // Never display the raw Whisper output directly
      const processTask = options.processTask || 'format';
      console.log('Processing transcription with task:', processTask);
      
      // Process the transcription with Google Flan model
      const processed = await processTranscription(text, processTask);
      setProcessedText(processed);
      
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