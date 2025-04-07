import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranscription } from '../context/TranscriptionContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';
import AudioRecorder from '../utils/audioRecorder';

const TranscribePage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [audioURL, setAudioURL] = useState('');
  const [processingTask, setProcessingTask] = useState('format');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // Track the current step (1: Record, 2: Format, 3: Result)
  const [customInstructions, setCustomInstructions] = useState('');
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const { currentSubscription } = useSubscription();
  
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);
  const recorderRef = useRef(null);
  
  const { 
    transcription, 
    processedText, 
    isProcessing, 
    error, 
    transcribe, 
    process, 
    reset 
  } = useTranscription();
  
  // Initialize audio recorder
  useEffect(() => {
    recorderRef.current = new AudioRecorder();
    
    // Clean up on unmount
    // Checkout success message component
  const CheckoutSuccessMessage = () => {
    const planName = checkoutPlan?.includes('yearly') ? 'Yearly' : 'Monthly';
    
    return (
      <motion.div
        className="fixed top-20 right-4 bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-lg z-50 max-w-md"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-green-800">Payment Successful!</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Thank you for subscribing to our {planName} plan. Your account has been upgraded successfully.</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowCheckoutSuccess(false)}
                className="text-sm font-medium text-green-600 hover:text-green-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };
  
  return () => {
      if (recorderRef.current) {
        recorderRef.current.cleanup();
      }
      if (audioURL) {
        AudioRecorder.revokeAudioURL(audioURL);
      }
    };
  }, []);
  
  // Check for checkout success in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const checkoutStatus = searchParams.get('checkout');
    const plan = searchParams.get('plan');
    
    if (checkoutStatus === 'success') {
      setShowCheckoutSuccess(true);
      setCheckoutPlan(plan || '');
      
      // Remove the query parameters after processing
      setTimeout(() => {
        navigate('/transcribe', { replace: true });
      }, 5000); // Clear URL after 5 seconds
    }
  }, [location, navigate]);

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setUploadFileName(file.name);
      reset();
      
      // Create URL for audio preview if needed
      if (audioURL) {
        AudioRecorder.revokeAudioURL(audioURL);
      }
      setAudioURL(URL.createObjectURL(file));
    }
  };

  // Handle recording start
  const startRecording = async () => {
    // Reset previous recording state
    setAudioFile(null);
    setUploadFileName('');
    reset();
    setRecordingTime(0);
    
    if (audioURL) {
      AudioRecorder.revokeAudioURL(audioURL);
      setAudioURL('');
    }
    
    // Start recording
    const success = await recorderRef.current.start();
    
    if (success) {
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      console.log('Recording started...');
    } else {
      showToastMessage('Could not access microphone. Please check permissions.');
    }
  };

  // Handle recording stop
  const stopRecording = async () => {
    setIsRecording(false);
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop recording and get audio blob
    const audioBlob = await recorderRef.current.stop();
    
    if (audioBlob) {
      setAudioFile(audioBlob);
      setUploadFileName('recording.wav');
      
      // Create URL for audio preview
      const url = AudioRecorder.createAudioURL(audioBlob);
      setAudioURL(url);
      
      console.log('Recording stopped, audio blob created');
    } else {
      showToastMessage('Failed to capture recording');
    }
  };

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show toast message
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  
  // Handle transcription process
  const handleTranscribe = async () => {
    if (!audioFile) return;
    
    try {
      // Perform the actual transcription
      console.log('Transcribing audio...');
      
      const result = await transcribe(audioFile, {
        processTask: processingTask
      });
      
      if (result) {
        // Move to the next step if successful
        setCurrentStep(3);
      } else if (error) {
        showToastMessage(error);
      }
    } catch (err) {
      console.error('Error transcribing audio:', err);
      showToastMessage('Error transcribing audio: ' + err.message);
    }
  };

  // Handle text download
  const handleDownload = () => {
    if (!processedText) return;
    
    const element = document.createElement('a');
    const file = new Blob([processedText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'transcription.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    // Clean up
    URL.revokeObjectURL(element.href);
  };
  
  // Handle processing task change
  const handleProcessingTaskChange = async (task) => {
    setProcessingTask(task);
    
    // If we already have a transcription, process it with the new task
    if (transcription && !isProcessing) {
      await process(transcription, task);
    }
  };

  // Handle custom instructions change
  const handleCustomInstructionsChange = (e) => {
    setCustomInstructions(e.target.value);
  };

  // Apply custom instructions
  const applyCustomInstructions = async () => {
    if (!customInstructions.trim()) return;
    
    const customTask = `custom:${customInstructions}`;
    setProcessingTask(customTask);
    
    if (transcription && !isProcessing) {
      await process(transcription, customTask);
    }
  };

  // Navigate to next step
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Start over
  const startOver = () => {
    setAudioFile(null);
    setUploadFileName('');
    reset();
    setCurrentStep(1);
    setProcessingTask('format');
    setCustomInstructions('');
    
    if (audioURL) {
      AudioRecorder.revokeAudioURL(audioURL);
      setAudioURL('');
    }
  };

  // Checkout success message component
  const CheckoutSuccessMessage = () => {
    const planName = checkoutPlan?.includes('yearly') ? 'Yearly' : 'Monthly';
    
    return (
      <motion.div
        className="fixed top-20 right-4 bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-lg z-50 max-w-md"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-green-800">Payment Successful!</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Thank you for subscribing to our {planName} plan. Your account has been upgraded successfully.</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowCheckoutSuccess(false)}
                className="text-sm font-medium text-green-600 hover:text-green-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };
  
  return (
    <div className="pt-32 pb-20 px-4">
      {/* Checkout success message */}
      <AnimatePresence>
        {showCheckoutSuccess && <CheckoutSuccessMessage />}
      </AnimatePresence>
      <div className="container mx-auto max-w-5xl">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Transcribe</span> Your Audio
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload an audio file or record directly in your browser to get started.
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              1
            </div>
            <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              2
            </div>
            <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              3
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Record/Upload Audio */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              className="card max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-2xl font-semibold mb-6 text-center">Record or Upload Audio</h2>
              
              {/* Recording Section */}
              <div className="mb-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  {/* Audio player if we have a recording */}
                  {audioURL && !isRecording && (
                    <div className="mb-4">
                      <audio src={audioURL} controls className="w-full" />
                    </div>
                  )}
                  {isRecording ? (
                    <div className="text-center">
                      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                        <div className="absolute w-20 h-20 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="absolute w-16 h-16 bg-white rounded-full flex items-center justify-center">
                          <span className="text-red-500 font-medium text-xl">{formatTime(recordingTime)}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4">Recording in progress...</p>
                      <motion.button
                        className="btn-primary bg-red-500 hover:bg-red-600"
                        onClick={stopRecording}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Stop Recording
                      </motion.button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="flex justify-center space-x-6 mb-6">
                        {/* Record button */}
                        <div className="text-center">
                          <motion.button
                            className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center hover:bg-primary-200 transition-colors"
                            onClick={startRecording}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                            </svg>
                          </motion.button>
                          <p className="text-sm text-gray-600 mt-2">Record</p>
                        </div>
                        
                        {/* Upload button */}
                        <div className="text-center">
                          <motion.button
                            className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center hover:bg-primary-200 transition-colors"
                            onClick={() => fileInputRef.current.click()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleFileChange} 
                              accept="audio/*" 
                              className="hidden" 
                            />
                          </motion.button>
                          <p className="text-sm text-gray-600 mt-2">Upload</p>
                        </div>
                        
                        {/* Delete button - only show if we have audio */}
                        {audioFile && (
                          <div className="text-center">
                            <motion.button
                              className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                              onClick={() => {
                                setAudioFile(null);
                                setUploadFileName('');
                                if (audioURL) {
                                  AudioRecorder.revokeAudioURL(audioURL);
                                  setAudioURL('');
                                }
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </motion.button>
                            <p className="text-sm text-gray-600 mt-2">Delete</p>
                          </div>
                        )}
                      </div>
                      
                      {/* File name display */}
                      {uploadFileName && (
                        <div className="mt-4 text-center">
                          <p className="text-sm text-gray-600">Selected file: <span className="font-medium">{uploadFileName}</span></p>
                        </div>
                      )}
                      
                      {/* Next button - only show if we have audio */}
                      {audioFile && (
                        <div className="mt-6">
                          <motion.button
                            className="btn-primary w-full"
                            onClick={goToNextStep}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Next: Choose Format
                          </motion.button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Step 2: Format Selection */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              className="card max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-2xl font-semibold mb-6 text-center">Choose Processing Format</h2>
              
              <div className="mb-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium mb-2">Text Formatting</h3>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="format-standard" 
                        name="processing-task" 
                        value="format" 
                        checked={processingTask === 'format'} 
                        onChange={() => handleProcessingTaskChange('format')} 
                        className="w-4 h-4 text-primary-600"
                      />
                      <label htmlFor="format-standard" className="text-gray-700">Standard Formatting</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="format-paragraphs" 
                        name="processing-task" 
                        value="paragraphs" 
                        checked={processingTask === 'paragraphs'} 
                        onChange={() => handleProcessingTaskChange('paragraphs')} 
                        className="w-4 h-4 text-primary-600"
                      />
                      <label htmlFor="format-paragraphs" className="text-gray-700">Paragraph Structure</label>
                    </div>
                    
                    <h3 className="text-lg font-medium mb-2 mt-6">Content Enhancement</h3>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="format-grammar" 
                        name="processing-task" 
                        value="grammar" 
                        checked={processingTask === 'grammar'} 
                        onChange={() => handleProcessingTaskChange('grammar')} 
                        className="w-4 h-4 text-primary-600"
                      />
                      <label htmlFor="format-grammar" className="text-gray-700">Grammar Correction</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="format-summarize" 
                        name="processing-task" 
                        value="summarize" 
                        checked={processingTask === 'summarize'} 
                        onChange={() => handleProcessingTaskChange('summarize')} 
                        className="w-4 h-4 text-primary-600"
                      />
                      <label htmlFor="format-summarize" className="text-gray-700">Summarize Content</label>
                    </div>
                    
                    <h3 className="text-lg font-medium mb-2 mt-6">Special Formats</h3>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="format-bullets" 
                        name="processing-task" 
                        value="bullets" 
                        checked={processingTask === 'bullets'} 
                        onChange={() => handleProcessingTaskChange('bullets')} 
                        className="w-4 h-4 text-primary-600"
                      />
                      <label htmlFor="format-bullets" className="text-gray-700">Bullet Points</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="format-markdown" 
                        name="processing-task" 
                        value="markdown" 
                        checked={processingTask === 'markdown'} 
                        onChange={() => handleProcessingTaskChange('markdown')} 
                        className="w-4 h-4 text-primary-600"
                      />
                      <label htmlFor="format-markdown" className="text-gray-700">Markdown Format</label>
                    </div>
                    
                    <h3 className="text-lg font-medium mb-2 mt-6">Custom Instructions</h3>
                    
                    <div className="mt-2">
                      <textarea 
                        placeholder="Enter custom instructions for processing..."
                        value={customInstructions}
                        onChange={handleCustomInstructionsChange}
                        className="input min-h-[100px] resize-y"
                      ></textarea>
                      <motion.button
                        className="btn-secondary mt-2 w-full"
                        onClick={applyCustomInstructions}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!customInstructions.trim()}
                      >
                        Apply Custom Instructions
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-8">
                    <motion.button
                      className="btn-secondary"
                      onClick={goToPreviousStep}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Back
                    </motion.button>
                    
                    <motion.button
                      className="btn-primary"
                      onClick={handleTranscribe}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Transcribe Now'}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Step 3: Results */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              className="card max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-2xl font-semibold mb-6 text-center">Transcription Results</h2>
              
              <div className="mb-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  {isProcessing ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-700">Processing your audio...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <p className="text-red-500 font-medium mb-2">Error</p>
                      <p className="text-gray-700">{error}</p>
                    </div>
                  ) : processedText ? (
                    <div>
                      <div className="flex items-center justify-center mb-6">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-800">Transcription Complete</p>
                      </div>
                      
                      <div className="border border-gray-200 rounded-lg p-4 mb-6 max-h-[300px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-gray-700 font-sans">{processedText}</pre>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <motion.button
                          className="btn-secondary flex-1"
                          onClick={startOver}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Start Over
                        </motion.button>
                        
                        <motion.button
                          className="btn-primary flex-1"
                          onClick={handleDownload}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Download Text
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-700">No transcription available. Please go back and try again.</p>
                      <motion.button
                        className="btn-secondary mt-4"
                        onClick={goToPreviousStep}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Back to Format Selection
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        {showToast && (
          <motion.div 
            className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            {toastMessage}
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          className="mt-16 bg-gray-50 rounded-xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-2xl font-semibold mb-6">About Our Transcription Technology</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <svg className="w-6 h-6 text-primary-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
                Advanced Speech Recognition
              </h3>
              <p className="text-gray-600">Our transcription service uses state-of-the-art AI models to accurately convert speech to text, handling different accents and background noise.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <svg className="w-6 h-6 text-primary-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                Privacy Focused
              </h3>
              <p className="text-gray-600">Your audio files are processed securely and never stored longer than necessary. We prioritize your privacy and data security.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <svg className="w-6 h-6 text-primary-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Fast Processing
              </h3>
              <p className="text-gray-600">Our optimized transcription pipeline delivers results quickly, allowing you to work with your transcribed content without long waits.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <svg className="w-6 h-6 text-primary-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Smart Formatting
              </h3>
              <p className="text-gray-600">Choose from multiple formatting options or create custom instructions to get your transcription exactly how you need it.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TranscribePage;