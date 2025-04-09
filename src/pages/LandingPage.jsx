import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/Modal';
import SubscriptionPlans from '../components/SubscriptionPlans';
import { useAuth } from '../context/AuthContext';
import { useTranscription } from '../context/TranscriptionContext';
import AudioRecorder from '../utils/audioRecorder';

const LandingPage = () => {
  const [showPlansModal, setShowPlansModal] = useState(false);
  const { isAuthenticated, user } = useAuth();
  
  // Interactive demo state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState('');
  const [demoTranscription, setDemoTranscription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('note');
  const [isProcessing, setIsProcessing] = useState(false);
  const [demoError, setDemoError] = useState('');
  const [demoStep, setDemoStep] = useState(1); // 1: Recording, 2: Style Selection
  const [demoAudioBlob, setDemoAudioBlob] = useState(null);
  const [processedText, setProcessedText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioPlayerRef = useRef(null);
  
  // Refs for recording
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  
  const { transcribe, process } = useTranscription();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };
  
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Format time for display (MM:SS)
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle recording start for demo
  const startDemoRecording = async () => {
    // Reset previous recording state
    setDemoTranscription('');
    setRecordingTime(0);
    setDemoError('');
    setDemoStep(1);
    setDemoAudioBlob(null);
    setProcessedText('');
    
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
        setRecordingTime(prev => {
          // Automatically stop at 20 seconds for the demo
          if (prev >= 20) {
            stopDemoRecording();
            return 20;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setDemoError('Could not access microphone. Please check permissions.');
    }
  };
  
  // Handle recording stop for demo
  const stopDemoRecording = async () => {
    if (!isRecording) return;
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop recording
    const audioBlob = await recorderRef.current.stop();
    setIsRecording(false);
    
    if (audioBlob) {
      // Create audio URL for playback
      const url = AudioRecorder.createAudioURL(audioBlob);
      setAudioURL(url);
      setDemoAudioBlob(audioBlob);
      
      // Don't automatically process - wait for user to click Continue
      // This follows the two-step process requested
    }
  };
  
  // Process recorded audio for demo
  const processDemoAudio = async () => {
    if (!demoAudioBlob) return;
    
    setIsProcessing(true);
    
    try {
      // Create a File object from the Blob
      const audioFile = new File([demoAudioBlob], 'demo-recording.webm', {
        type: demoAudioBlob.type || 'audio/webm',
      });
      
      // Transcribe the audio
      const text = await transcribe(audioFile);
      setDemoTranscription(text);
      
      // Move to style selection step
      setDemoStep(2);
      
      // Clear processed text when moving to style selection
      // This ensures results aren't displayed until a style is selected
      setProcessedText('');
    } catch (error) {
      console.error('Demo transcription error:', error);
      setDemoError('Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle style change for demo
  const handleStyleChange = async (style) => {
    setSelectedStyle(style);
    
    if (demoTranscription) {
      setIsProcessing(true);
      setDemoError(''); // Clear any previous errors
      
      try {
        // Process with selected style
        console.log(`Processing text with style: ${style}`);
        const processed = await process(demoTranscription, style);
        
        if (processed) {
          setProcessedText(processed);
          console.log('Style processing completed successfully');
        } else {
          // If process returns null or undefined, use original text
          setProcessedText(demoTranscription);
          console.warn('Process returned empty result, using original text');
        }
      } catch (error) {
        console.error('Style processing error:', error);
        setDemoError(`Failed to process with selected style: ${error.message || 'Unknown error'}`);
        // Fall back to original text on error
        setProcessedText(demoTranscription);
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  // Reset demo to recording step
  const resetDemo = () => {
    setDemoStep(1);
    setDemoTranscription('');
    setProcessedText('');
    if (audioURL) {
      // Keep the audio URL for playback
      // but reset the processing state
    }
    setDemoError('');
  };
  
  const featureItems = [
    {
      title: 'AI-Powered Transcription',
      description: 'Accurate speech-to-text conversion with support for multiple languages.',
      icon: (
        <svg className="w-12 h-12 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
        </svg>
      ),
    },
    {
      title: 'Advanced Text Processing',
      description: 'Advanced AI capabilities for enhanced text processing and analysis.',
      icon: (
        <svg className="w-12 h-12 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
      ),
    },
    {
      title: 'Real-time Processing',
      description: 'Transcribe audio in real-time with minimal latency for immediate results and feedback.',
      icon: (
        <svg className="w-12 h-12 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section with Interactive Demo */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-0 right-0 bg-primary-100 w-2/3 h-2/3 rounded-bl-full opacity-30 transform translate-x-1/4 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 bg-primary-100 w-1/2 h-1/2 rounded-tr-full opacity-30 transform -translate-x-1/4 translate-y-1/4"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-6"
              variants={itemVariants}
            >
              <span className="gradient-text">Transform</span> Your Audio <br />
              Into Perfect Text
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
              variants={itemVariants}
            >
              Modern AI-powered transcription.
              Fast, accurate, and effortless.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
              variants={itemVariants}
            >
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <motion.button 
                    className="btn-primary glow-effect text-lg px-8 py-4"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Go to App
                  </motion.button>
                </Link>
              ) : (
                <Link to="/transcribe">
                  <motion.button 
                    className="btn-primary glow-effect text-lg px-8 py-4"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Transcribing
                  </motion.button>
                </Link>
              )}
              
              <motion.a 
                href="#features" 
                className="btn-secondary text-lg px-8 py-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Interactive Demo - Moved to top of page and made larger */}
          <motion.div 
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-purple-glow rounded-xl blur-md opacity-75"></div>
              <div className="relative bg-white rounded-xl shadow-xl overflow-hidden border border-primary-100">
                <div className="p-2 bg-gray-50 border-b border-gray-100">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                <div className="p-6 bg-white">
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-semibold">Interactive demo</h3>
                  </div>
                  
                  {/* Demo Recording UI */}
                  <div className="bg-gray-50 rounded-xl p-8 flex flex-col items-center justify-center">
                    {/* Audio Visualization */}
                    <div className="w-full h-24 bg-blue-50 rounded-lg mb-6 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-full">
                        <div className="h-full w-full flex items-center">
                          <div className="flex items-end justify-around w-full h-full px-2">
                            {Array.from({ length: 30 }).map((_, i) => (
                              <div 
                                key={i} 
                                className={`w-1 bg-primary-400 rounded-full ${isRecording ? 'animate-sound-wave' : 'h-1'}`}
                                style={{ 
                                  height: isRecording ? `${Math.random() * 70 + 10}%` : '5%',
                                  animationDelay: `${i * 0.05}s`
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {!isRecording && !audioURL && (
                        <p className="text-gray-400 z-10">Click the microphone to start recording</p>
                      )}
                    </div>
                    
                    {/* Timer */}
                    <div className="mb-6 text-center">
                      <p className="text-sm text-gray-500 mb-1">Limit: 00:20</p>
                      <p className="text-4xl font-mono font-bold">{formatTime(recordingTime)}</p>
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center justify-center space-x-6 mb-6">
                      <button 
                        className="w-16 h-16 rounded-full bg-blue-100 text-primary-600 flex items-center justify-center"
                        onClick={() => {
                          if (audioURL) {
                            if (!audioPlayerRef.current) {
                              // Create audio element if it doesn't exist
                              audioPlayerRef.current = new Audio(audioURL);
                              audioPlayerRef.current.onended = () => setIsPlaying(false);
                            }
                            
                            if (isPlaying) {
                              // Pause the audio
                              audioPlayerRef.current.pause();
                              setIsPlaying(false);
                            } else {
                              // Play the audio
                              audioPlayerRef.current.play().catch(err => console.error('Audio playback error:', err));
                              setIsPlaying(true);
                            }
                          }
                        }}
                        disabled={!audioURL}
                      >
                        {isPlaying ? (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                      
                      <button 
                        onClick={isRecording ? stopDemoRecording : startDemoRecording}
                        className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg ${isRecording ? 'bg-red-500 text-white' : 'bg-primary-500 text-white'}`}
                        disabled={isProcessing}
                      >
                        {isRecording ? (
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
                          </svg>
                        ) : (
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        )}
                      </button>
                      
                      <button 
                        className="w-16 h-16 rounded-full bg-blue-100 text-primary-600 flex items-center justify-center"
                        onClick={() => {
                          if (audioURL) {
                            AudioRecorder.revokeAudioURL(audioURL);
                            setAudioURL('');
                            setDemoTranscription('');
                            setRecordingTime(0);
                          }
                        }}
                        disabled={!audioURL}
                      >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Continue Button - Only show in step 1 when audio is recorded */}
                    {audioURL && !isProcessing && demoStep === 1 && (
                      <button 
                        className="btn-primary w-full py-3 flex items-center justify-center"
                        onClick={processDemoAudio}
                      >
                        <span className="mr-2">Continue</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Processing Indicator */}
                    {isProcessing && (
                      <div className="flex justify-center items-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                        <span className="ml-3">Processing...</span>
                      </div>
                    )}
                    
                    {/* Help Text - Only show in step 1 */}
                    {demoStep === 1 && (
                      <p className="text-center text-gray-400 text-sm mt-4">
                        <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Try it out! Click the <svg className="w-4 h-4 inline-block mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg> to start recording
                      </p>
                    )}
                    
                    {/* Style Selection - Only show in step 2 */}
                    {demoStep === 2 && demoTranscription && !isProcessing && (
                      <div className="w-full mt-4">
                        <h4 className="text-lg font-semibold mb-3">2. Choose a style (4 options)</h4>
                        
                        <div className="space-y-3">
                          {/* Note Style */}
                          <button 
                            onClick={() => handleStyleChange('note')}
                            className={`w-full p-4 rounded-lg border text-left flex items-center ${selectedStyle === 'note' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                          >
                            <span className="text-primary-600 mr-3">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </span>
                            <div>
                              <p className="font-medium">Note</p>
                              <p className="text-sm text-gray-500">A short note with the core ideas.</p>
                            </div>
                          </button>
                          
                          {/* Transcript Style */}
                          <button 
                            onClick={() => handleStyleChange('transcript')}
                            className={`w-full p-4 rounded-lg border text-left flex items-center ${selectedStyle === 'transcript' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                          >
                            <span className="text-primary-600 mr-3">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </span>
                            <div>
                              <p className="font-medium">Transcript</p>
                              <p className="text-sm text-gray-500">Cleaned up transcript, with punctuation.</p>
                            </div>
                          </button>
                          
                          {/* Summarize Style */}
                          <button 
                            onClick={() => handleStyleChange('summarize')}
                            className={`w-full p-4 rounded-lg border text-left flex items-center ${selectedStyle === 'summarize' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                          >
                            <span className="text-primary-600 mr-3">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </span>
                            <div>
                              <p className="font-medium">Summarize</p>
                              <p className="text-sm text-gray-500">Concise summary of key points.</p>
                            </div>
                          </button>
                          
                          {/* Email Style */}
                          <button 
                            onClick={() => handleStyleChange('email')}
                            className={`w-full p-4 rounded-lg border text-left flex items-center ${selectedStyle === 'email' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                          >
                            <span className="text-primary-600 mr-3">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </span>
                            <div>
                              <p className="font-medium">Email</p>
                              <p className="text-sm text-gray-500">Formatted as a professional email.</p>
                            </div>
                          </button>
                          
                          {/* Bullet Points Style */}
                          <button 
                            onClick={() => handleStyleChange('bullets')}
                            className={`w-full p-4 rounded-lg border text-left flex items-center ${selectedStyle === 'bullets' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                          >
                            <span className="text-primary-600 mr-3">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                              </svg>
                            </span>
                            <div>
                              <p className="font-medium">Bullet Points</p>
                              <p className="text-sm text-gray-500">Hierarchical bullet point structure with main topics and subtopics.</p>
                            </div>
                          </button>
                          
                          <p className="text-center text-sm text-primary-600 mt-2">Plus many more styles in the full version!</p>
                        </div>
                        
                        <div className="flex justify-between mt-6">
                          <button 
                            onClick={resetDemo}
                            className="btn-secondary px-6 py-2 flex items-center"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                          </button>
                          
                          <button 
                            onClick={() => handleStyleChange(selectedStyle)}
                            className="btn-primary px-6 py-2 flex items-center"
                          >
                            Continue
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Results Display - After processing */}
                    {demoStep === 2 && !isProcessing && processedText && (
                      <div className="w-full mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="text-lg font-semibold mb-3">Result:</h4>
                        <p className="whitespace-pre-wrap">{processedText}</p>
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-700">This is just a demo. The full experience includes more advanced styles and customization.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-6">
              <span className="gradient-text">Powerful</span> Features
            </h2>
            <p className="text-xl text-gray-600">
              Our cutting-edge AI technology makes transcription faster and more accurate than ever before.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featureItems.map((feature, index) => (
              <motion.div
                key={index}
                className="card hover:border-primary-200 border border-transparent"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                whileHover={{ y: -5 }}
              >
                <div className="mb-6 bg-primary-50 w-20 h-20 rounded-full flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Removed duplicate interactive demo section */}

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-6">
              <span className="gradient-text">Simple</span> Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that works best for you. No hidden fees or complicated tiers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <motion.div
              className="card border border-gray-200 hover:border-primary-300 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4">Monthly</h3>
                <div className="flex items-end mb-6">
                  <span className="text-5xl font-bold">$16.99</span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Unlimited transcriptions</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Advanced AI processing</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Priority processing</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Cancel anytime</span>
                  </li>
                </ul>
                <button className="btn-secondary w-full py-3" onClick={() => setShowPlansModal(true)}>
                  Get Started
                </button>
              </div>
            </motion.div>

            {/* Annual Plan */}
            <motion.div
              className="card border border-primary-300 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="absolute top-0 right-0 bg-primary-500 text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
                Save 13%
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4">Annual</h3>
                <div className="flex items-end mb-6">
                  <span className="text-5xl font-bold">$156.00</span>
                  <span className="text-gray-500 ml-2">/year</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Everything in monthly plan</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>2 months free</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Higher usage limits</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Premium support</span>
                  </li>
                </ul>
                <button className="btn-primary w-full py-3 glow-effect" onClick={() => setShowPlansModal(true)}>
                  Get Started
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-6">
              How <span className="gradient-text">It Works</span>
            </h2>
            <p className="text-xl text-gray-600">
              Verba makes it easy to convert your audio to text in just a few simple steps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <span className="text-2xl font-bold text-primary-600">1</span>
                <div className="absolute -inset-1 bg-primary-300 rounded-full blur opacity-30 animate-pulse"></div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload or Record</h3>
              <p className="text-gray-600">Upload an audio file or record directly in your browser.</p>
            </motion.div>

            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <span className="text-2xl font-bold text-primary-600">2</span>
                <div className="absolute -inset-1 bg-primary-300 rounded-full blur opacity-30 animate-pulse"></div>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Processing</h3>
              <p className="text-gray-600">Our AI analyzes your audio using Whisper and Hugging Face models.</p>
            </motion.div>

            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <span className="text-2xl font-bold text-primary-600">3</span>
                <div className="absolute -inset-1 bg-primary-300 rounded-full blur opacity-30 animate-pulse"></div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Results</h3>
              <p className="text-gray-600">Receive accurate transcription that you can edit, download, or share.</p>
            </motion.div>
          </div>

          {/* 'Try it now' button removed as requested */}
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <motion.div 
            className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-12 flex flex-col justify-center">
                <h2 className="text-3xl font-bold mb-6">
                  Ready to <span className="gradient-text">Transform</span> Your Audio?
                </h2>
                <p className="text-gray-600 mb-8">
                  Join thousands of users who are already saving time with our AI-powered transcription service.
                </p>
                <Link to="/transcribe">
                  <motion.button 
                    className="btn-primary glow-effect w-full"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Start Transcribing Now
                  </motion.button>
                </Link>
              </div>
              <div className="bg-purple-glow p-12 flex items-center justify-center">
                <motion.div 
                  className="text-white text-center"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <svg className="w-24 h-24 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                  </svg>
                  <h3 className="text-2xl font-bold">Start Today</h3>
                  <p className="opacity-80 mt-2">No credit card required</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Subscription Plans Modal */}
      <Modal
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        title="Choose Your Plan"
        maxWidth="max-w-xl"
      >
        <SubscriptionPlans 
          onStartTrial={(plan) => {
            setShowPlansModal(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default LandingPage;
