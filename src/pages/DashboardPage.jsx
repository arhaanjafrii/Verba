import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import Modal from '../components/Modal';
import SubscriptionPlans from '../components/SubscriptionPlans';

const DashboardPage = () => {
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [microphone, setMicrophone] = useState('default');
  const [defaultStyle, setDefaultStyle] = useState('note');
  const [customWords, setCustomWords] = useState('');
  
  const { user } = useAuth();
  const { currentSubscription } = useSubscription();

  // Fetch saved notes from localStorage or API
  useEffect(() => {
    if (user) {
      const storedNotes = localStorage.getItem(`notes_${user.id}`);
      if (storedNotes) {
        try {
          setSavedNotes(JSON.parse(storedNotes));
        } catch (error) {
          console.error('Error parsing saved notes:', error);
          setSavedNotes([]);
        }
      }
    }
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

  // Settings modal component
  const SettingsModal = () => {
    const { logout } = useAuth();
    
    return (
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
            <h3 className="text-lg font-semibold mb-3">Preferences</h3>
            <p className="text-sm text-gray-600 mb-3">These settings will be used as defaults for new notes.</p>
            
            <div className="space-y-4">
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
                    <option>English 🇬🇧</option>
                  </select>
                </div>
              </div>
              
              {/* Default Style and Custom Words sections removed as requested */}
            </div>
          </div>
          
          {/* Account Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Account Info</h3>
            <p className="text-sm text-gray-600 mb-3">Update your account information.</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First name</label>
                  <input
                    type="text"
                    value={user?.first_name || ''}
                    onChange={(e) => {
                      // This would normally update the user profile
                      console.log('First name updated:', e.target.value);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last name</label>
                  <input
                    type="text"
                    value={user?.last_name || ''}
                    onChange={(e) => {
                      // This would normally update the user profile
                      console.log('Last name updated:', e.target.value);
                    }}
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
            <h3 className="text-lg font-semibold mb-3">Create Password</h3>
            <p className="text-sm text-gray-600 mb-3">Define or change your account's permanent password.</p>
            
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
          
          {/* Other Links */}
          <div className="space-y-2">
            <a href="/privacy" className="block text-primary-600 hover:text-primary-700">Privacy Policy</a>
            <a href="/terms" className="block text-primary-600 hover:text-primary-700">Terms of Service</a>
          </div>
          
          {/* Logout Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={logout}
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
  };

  return (
    <div className="pt-32 pb-20 px-4">
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && <SettingsModal />}
      </AnimatePresence>
      
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <motion.div 
            className="w-full md:w-64 bg-white rounded-xl shadow-md overflow-hidden"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-6 bg-primary-50 border-b border-primary-100">
              <h2 className="text-xl font-bold text-primary-800">My Account</h2>
              <p className="text-sm text-primary-600 mt-1">{user?.email}</p>
            </div>
            
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => setActiveTab('recorder')}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${activeTab === 'recorder' ? 'bg-primary-100 text-primary-800' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"></path>
                    </svg>
                    Recorder
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('notes')}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${activeTab === 'notes' ? 'bg-primary-100 text-primary-800' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    My Notes
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('subscription')}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${activeTab === 'subscription' ? 'bg-primary-100 text-primary-800' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                    </svg>
                    Subscription
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowSettings(true)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${activeTab === 'settings' ? 'bg-primary-100 text-primary-800' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                </li>
              </ul>
            </nav>
          </motion.div>
          
          {/* Main Content */}
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {activeTab === 'recorder' && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants} className="card mb-8">
                  <h2 className="text-2xl font-bold mb-6">Welcome to Verba</h2>
                  <p className="text-gray-600 mb-6">
                    Your AI-powered transcription assistant. Record or upload audio files and get accurate transcriptions in seconds.
                  </p>
                  
                  {currentSubscription?.active ? (
                    <div className="bg-gray-50 rounded-xl p-8 flex flex-col items-center justify-center">
                      {/* Audio Visualization */}
                      <div className="w-full h-24 bg-blue-50 rounded-lg mb-6 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full">
                          <div className="h-full w-full flex items-center">
                            <div className="flex items-end justify-around w-full h-full px-2">
                              {Array.from({ length: 30 }).map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`w-1 bg-primary-400 rounded-full h-1`}
                                  style={{ 
                                    animationDelay: `${i * 0.05}s`
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-400 z-10">Click the microphone to start recording</p>
                      </div>
                      
                      {/* Timer */}
                      <div className="mb-6 text-center">
                        <p className="text-sm text-gray-500 mb-1">Limit: 02:00</p>
                        <p className="text-4xl font-mono font-bold">00:00</p>
                      </div>
                      
                      {/* Controls */}
                      <div className="flex items-center justify-center space-x-6 mb-6">
                        <button 
                          className="w-16 h-16 rounded-full bg-blue-100 text-primary-600 flex items-center justify-center"
                          disabled={true}
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        
                        <button 
                          className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg bg-primary-500 text-white"
                        >
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </button>
                        
                        <button 
                          className="w-16 h-16 rounded-full bg-blue-100 text-primary-600 flex items-center justify-center"
                          disabled={true}
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      <p className="text-center text-gray-400 text-sm mt-4">
                        <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Click the microphone to start recording (2 hour limit)
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            You need a subscription to access the transcription features. 
                            <button 
                              onClick={() => setShowPlansModal(true)}
                              className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1"
                            >
                              Upgrade now
                            </button>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
                
                <motion.div variants={itemVariants} className="card">
                  <h3 className="text-xl font-semibold mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <p className="text-sm text-primary-600">Saved Notes</p>
                      <p className="text-2xl font-bold text-primary-800">{savedNotes.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600">Subscription</p>
                      <p className="text-2xl font-bold text-green-800">
                        {currentSubscription?.active ? (
                          currentSubscription.plan === 'yearly' ? 'Yearly' : 'Monthly'
                        ) : (
                          'Free'
                        )}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-600">Account Status</p>
                      <p className="text-2xl font-bold text-purple-800">Active</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
            
            {activeTab === 'notes' && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants} className="card mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">My Saved Notes</h2>
                    {currentSubscription?.active && (
                      <Link to="/transcribe">
                        <button className="btn-primary text-base px-4 py-2">
                          New Transcription
                        </button>
                      </Link>
                    )}
                  </div>
                  
                  {savedNotes.length > 0 ? (
                    <div className="space-y-4">
                      {savedNotes.map((note) => (
                        <motion.div 
                          key={note.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                          whileHover={{ y: -2 }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg">{note.title}</h3>
                            <div className="text-sm text-gray-500">{new Date(note.date).toLocaleDateString()}</div>
                          </div>
                          <p className="text-gray-600 mb-3 line-clamp-2">{note.content}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Duration: {note.duration}</span>
                            <button className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                              View Full Note
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                      </div>
                      <p className="text-gray-600 mb-4">You don't have any saved notes yet.</p>
                      {currentSubscription?.active ? (
                        <Link to="/transcribe">
                          <button className="btn-primary text-base px-4 py-2">
                            Create Your First Note
                          </button>
                        </Link>
                      ) : (
                        <button 
                          onClick={() => setShowPlansModal(true)}
                          className="btn-primary text-base px-4 py-2"
                        >
                          Upgrade to Create Notes
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
            
            {activeTab === 'subscription' && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants} className="card mb-8">
                  <h2 className="text-2xl font-bold mb-6">Your Subscription</h2>
                  
                  {currentSubscription?.active ? (
                    <div>
                      <div className="bg-green-50 border border-green-100 rounded-lg p-6 mb-6">
                        <div className="flex items-center mb-4">
                          <svg className="w-8 h-8 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <h3 className="text-xl font-semibold text-green-800">
                            {currentSubscription.plan === 'yearly' ? 'Yearly' : 'Monthly'} Plan - Active
                          </h3>
                        </div>
                        <p className="text-green-700 mb-2">
                          Your subscription renews on {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-green-600">
                          Enjoy unlimited access to all Verba features.
                        </p>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold mb-4">Manage Subscription</h3>
                        <div className="flex flex-wrap gap-3">
                          <button className="btn-secondary text-sm px-4 py-2">
                            Update Payment Method
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                            Cancel Subscription
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6 mb-6">
                        <div className="flex items-center mb-4">
                          <svg className="w-8 h-8 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <h3 className="text-xl font-semibold text-yellow-800">No Active Subscription</h3>
                        </div>
                        <p className="text-yellow-700 mb-4">
                          You currently don't have an active subscription. Upgrade to access all Verba features.
                        </p>
                        <button 
                          onClick={() => setShowPlansModal(true)}
                          className="btn-primary text-base px-4 py-2"
                        >
                          View Plans
                        </button>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold mb-4">Why Upgrade?</h3>
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Unlimited transcriptions</span>
                          </li>
                          <li className="flex items-start">
                            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Advanced AI processing</span>
                          </li>
                          <li className="flex items-start">
                            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Save and organize your notes</span>
                          </li>
                          <li className="flex items-start">
                            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Priority support</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
      
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

export default DashboardPage;