import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranscription } from '../context/TranscriptionContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
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
  const [showSettings, setShowSettings] = useState(false);
  const [microphone, setMicrophone] = useState('default');
  const [defaultStyle, setDefaultStyle] = useState('note');
  const [customWords, setCustomWords] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const { currentSubscription } = useSubscription();
  const { user, isAuthenticated, logout } = useAuth();
  
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

  // Handle saving notes
  const handleSaveNote = () => {
    if (!processedText || !user) return;
    
    try {
      // Create a new note object
      const newNote = {
        id: Date.now(),
        title: uploadFileName || 'Untitled Note',
        content: processedText,
        date: new Date().toISOString(),
        duration: recordingTime ? formatTime(recordingTime) : 'Unknown',
      };
      
      // Get existing notes from localStorage
      const storedNotes = localStorage.getItem(`notes_${user.id}`);
      let notes = [];
      
      if (storedNotes) {
        notes = JSON.parse(storedNotes);
      }
      
      // Add new note to the array
      notes.unshift(newNote);
      
      // Save back to localStorage
      localStorage.setItem(`notes_${user.id}`, JSON.stringify(notes));
      
      // Show success message
      showToastMessage('Note saved successfully!');
    } catch (err) {
      console.error('Error saving note:', err);
      showToastMessage('Failed to save note. Please try again.');
    }
  };
  
  // Check authentication and subscription status
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!currentSubscription?.active) {
      navigate('/#pricing');
      return;
    }
  }, [isAuthenticated, currentSubscription, navigate]);

  // Initialize audio recorder
  useEffect(() => {
    recorderRef.current = new AudioRecorder();
    
    // Clean up on unmount
    return () => {
      if (recorderRef.current) {
        recorderRef.current.cleanup();
      }
      if (audioURL) {
        AudioRecorder.revokeAudioURL(audioURL);
      }
    };
  }, []);
  
  // Update audio visualization during recording
  useEffect(() => {
    if (!isRecording || !recorderRef.current) return;
    
    // Use requestAnimationFrame for smoother updates that sync with the browser's refresh rate
    let animationFrameId;
    
    const updateVisualization = () => {
      // This forces a re-render to get the latest audio levels
      setRecordingTime(prev => prev);
      // Continue the animation loop
      animationFrameId = requestAnimationFrame(updateVisualization);
    };
    
    // Start the animation loop
    animationFrameId = requestAnimationFrame(updateVisualization);
    
    return () => {
      // Clean up by canceling the animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRecording]);
  
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
      // Perform the actual transcription with processing
      console.log('Processing transcription with selected style:', processingTask);
      
      // Process the transcription with the selected style
      // Make sure we're using the Hugging Face model for processing
      // The raw Whisper output should never be displayed as the final result
      setIsProcessing(true);
      const result = await process(transcription, processingTask);
      setIsProcessing(false);
      
      // Return the result but don't automatically move to step 3
      // The button click handler will handle navigation
      return result;
    } catch (err) {
      console.error('Error processing transcription:', err);
      showToastMessage('Error processing transcription: ' + err.message);
      setIsProcessing(false);
      throw err; // Re-throw to allow the caller to handle it
    }
  };
  
  // Separate function to handle just the transcription without processing
  const handleInitialTranscribe = async () => {
    if (!audioFile) return;
    
    try {
      // Transcribe with basic formatting to ensure we don't show raw Whisper output
      console.log('Transcribing audio with basic formatting...');
      
      // Call the transcribe function with a default format processTask
      // This ensures we get properly formatted text, not raw Whisper output
      setIsProcessing(true);
      const result = await transcribe(audioFile, { processTask: 'format' });
      setIsProcessing(false);
      
      if (result) {
        // Move to the style selection step if successful
        setCurrentStep(2);
      } else if (error) {
        showToastMessage(error);
      }
    } catch (err) {
      console.error('Error transcribing audio:', err);
      showToastMessage('Error transcribing audio: ' + err.message);
      setIsProcessing(false);
    }
  };

  // Handle downloading transcribed text
  // Add this function somewhere in your component before it's used
  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle processing task change
  const handleProcessingTaskChange = async (task) => {
    setProcessingTask(task);
    
    // If we already have a transcription, process it with the new task
    if (transcription && !isProcessing) {
      try {
        await process(transcription, task);
      } catch (err) {
        console.error('Error processing with new style:', err);
        showToastMessage('Error applying style: ' + err.message);
      }
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
  
  // Settings modal component
  const SettingsModal = () => (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-4 overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Settings</h2>
            <button 
              onClick={() => setShowSettings(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Preferences */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Preferences</h3>
            <p className="text-sm text-gray-600 mb-4">These settings will be used as defaults for new notes.</p>
            
            <div className="space-y-6">
              {/* Microphone Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Microphone</label>
                <select
                  value={microphone}
                  onChange={(e) => setMicrophone(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="default">Default Microphone</option>
                </select>
              </div>
              
              {/* Language Selection - Disabled */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <div className="flex items-center space-x-2">
                  <select
                    disabled
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                  >
                    <option>Auto 🌐</option>
                  </select>
                </div>
              </div>
              
              {/* Default Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Style</label>
                <select
                  value={defaultStyle}
                  onChange={(e) => setDefaultStyle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="note">Note</option>
                  <option value="summary">Summary</option>
                  <option value="bullets">Bullet Points</option>
                </select>
              </div>
              
              {/* Custom Words */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom words</label>
                <textarea
                  value={customWords}
                  onChange={(e) => setCustomWords(e.target.value.slice(0, 240))}
                  placeholder="List of custom words/expressions the AI can use, separated by a comma (240 characters max)"
                  className="w-full p-2 border border-gray-300 rounded-md h-24"
                />
                <p className="text-sm text-gray-500 mt-1">{240 - customWords.length} characters remaining</p>
              </div>
            </div>
          </div>
          
          {/* Account Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Account Info</h3>
            <p className="text-sm text-gray-600 mb-4">Update your account information.</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First name</label>
                  <input
                    type="text"
                    value={user?.first_name || ''}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last name</label>
                  <input
                    type="text"
                    value={user?.last_name || ''}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Last name"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                  disabled
                />
              </div>
            </div>
          </div>
          
          {/* Password Change */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Create Password</h3>
            <p className="text-sm text-gray-600 mb-4">Define or change your account's permanent password.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="••••••••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password Confirmation</label>
                <input
                  type="password"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="••••••••••••••"
                />
              </div>
            </div>
          </div>
          
          {/* Subscription Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Plan</h3>
            <p className="text-sm text-gray-600 mb-3">Manage your subscription.</p>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              {currentSubscription?.active ? (
                <p>You are on the {currentSubscription.plan === 'yearly' ? 'Yearly' : 'Monthly'} plan.</p>
              ) : (
                <p>You are on the Free plan with basic features.</p>
              )}
            </div>
          </div>
          
          {/* Other Links */}
          <div className="space-y-2">
            <a href="/privacy" className="block text-primary-600 hover:text-primary-700">Privacy Policy</a>
            <a href="/terms" className="block text-primary-600 hover:text-primary-700">Terms of Service</a>
          </div>
          
          {/* Logout Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                // Close the settings modal first to prevent white screen
                setShowSettings(false);
                // Then logout after a short delay
                setTimeout(() => {
                  if (typeof logout === 'function') {
                    logout();
                  } else {
                    console.error('Logout function is not available');
                    // Fallback: redirect to login page
                    navigate('/login');
                  }
                }, 300); // Increased delay to ensure modal closes completely
              }}
              className="w-full p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log Out
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="pt-32 pb-20 px-4">
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && <SettingsModal />}
      </AnimatePresence>
      
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
                      {/* Audio Visualization */}
                      <div className="w-full h-24 bg-red-50 rounded-lg mb-6 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full">
                          <div className="h-full w-full flex items-center">
                            <div className="flex items-end justify-around w-full h-full px-2">
                              {Array.from({ length: 30 }).map((_, i) => {
                                // Get audio level and update every animation frame
                                const audioLevel = recorderRef.current?.getAudioLevel() || 0;
                                // Scale the audio level to a percentage (0-100%)
                                // Apply a more dynamic range to make visualization more responsive
                                const heightPercentage = Math.min(Math.max((audioLevel / 128) * 100, 5), 95);
                                
                                return (
                                  <div 
                                    key={i} 
                                    className="w-1 bg-red-400 rounded-full transition-all duration-50"
                                    style={{ 
                                      height: `${heightPercentage}%`,
                                      transitionDelay: `${i * 0.01}s`
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
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
                              onClick={startOver}
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
                            onClick={handleInitialTranscribe}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Transcribing...' : 'Next: Choose Format'}
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
                  {/* Delete recording button for step 2 */}
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={startOver}
                      className="text-red-500 hover:text-red-700 flex items-center"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Recording
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium mb-2">Text Formatting</h3>
                    
                    {/* Show a preview of the raw transcription */}
                    {transcription && (
                      <div className="mb-4 p-3 bg-white border border-gray-200 rounded-md">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Raw Transcription Preview:</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{transcription.substring(0, 150)}...</p>
                      </div>
                    )}
                    
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
                      disabled={isProcessing}
                    >
                      Back
                    </motion.button>
                    
                    <motion.button
                      className="btn-primary"
                      onClick={async () => {
                        try {
                          // Process with the selected style
                          await handleTranscribe();
                          // Only move to step 3 if processing was successful
                          if (!error) {
                            setCurrentStep(3);
                          }
                        } catch (err) {
                          console.error('Processing error:', err);
                          showToastMessage('Error processing: ' + (err.message || 'Unknown error'));
                        }
                      }}
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
                  {/* Delete recording button for step 3 */}
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={startOver}
                      className="text-red-500 hover:text-red-700 flex items-center"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Recording
                    </button>
                  </div>
                  
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
                          onClick={() => handleDownload(
                            new Blob([processedText], { type: 'text/plain' }),
                            `${uploadFileName.split('.')[0] || 'transcription'}.txt`
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Download Text
                        </motion.button>
                        
                        <motion.button
                          className="btn-primary flex-1 flex items-center justify-center"
                          onClick={handleSaveNote}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          Save Note
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
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

// Add this function near your other handler functions (around line 300)
const handleCopy = () => {
  if (!processedText) return;
  
  navigator.clipboard.writeText(processedText)
    .then(() => {
      showToastMessage('Text copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy text:', err);
      showToastMessage('Failed to copy text to clipboard');
    });
};