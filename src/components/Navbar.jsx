import React, { useState, useEffect } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import FeaturesPopup from './FeaturesPopup';
import SubscriptionPlans from './SubscriptionPlans';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const location = useLocation();
  
  const { user, isAuthenticated, logout } = useAuth();
  const { currentSubscription } = useSubscription();

  // Change navbar style on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <motion.div 
            className="w-8 h-8"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="16" fill="url(#paint0_linear)" />
              <path d="M32 16C25.373 16 20 21.373 20 28V36C20 42.627 25.373 48 32 48C38.627 48 44 42.627 44 36V28C44 21.373 38.627 16 32 16ZM40 36C40 40.418 36.418 44 32 44C27.582 44 24 40.418 24 36V28C24 23.582 27.582 20 32 20C36.418 20 40 23.582 40 28V36Z" fill="white"/>
              <path d="M32 24C29.791 24 28 25.791 28 28V36C28 38.209 29.791 40 32 40C34.209 40 36 38.209 36 36V28C36 25.791 34.209 24 32 24Z" fill="white"/>
              <path d="M20 40H16V36C16 34.895 15.105 34 14 34C12.895 34 12 34.895 12 36V40C12 42.209 13.791 44 16 44H20C21.105 44 22 43.105 22 42C22 40.895 21.105 40 20 40Z" fill="white"/>
              <path d="M50 34C48.895 34 48 34.895 48 36V40H44C42.895 40 42 40.895 42 42C42 43.105 42.895 44 44 44H48C50.209 44 52 42.209 52 40V36C52 34.895 51.105 34 50 34Z" fill="white"/>
              <defs>
                <linearGradient id="paint0_linear" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#C4B5FD" />
                  <stop offset="1" stop-color="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
          <motion.div 
            className="text-2xl font-bold gradient-text"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            Verba
          </motion.div>
        </Link>

        <nav>
          <ul className="flex space-x-8">
            <motion.li whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Link 
                to="/" 
                className={`font-medium transition-colors duration-300 ${location.pathname === '/' ? 'text-primary-600' : 'text-gray-600 hover:text-primary-500'}`}
              >
                Home
              </Link>
            </motion.li>
            <motion.li whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <a 
                href={location.pathname === '/' ? '#pricing' : '/#pricing'}
                className="font-medium text-gray-600 hover:text-primary-500 transition-colors duration-300"
              >
                Pricing
              </a>
            </motion.li>
            <motion.li whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <a 
                href={location.pathname === '/' ? '#features' : '/#features'}
                className="font-medium text-gray-600 hover:text-primary-500 transition-colors duration-300"
              >
                Features
              </a>
            </motion.li>
          </ul>
        </nav>

        <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden sm:block"
                >
                  <Link to="/transcribe" className="text-gray-600 hover:text-primary-600 font-medium">
                    Dashboard
                  </Link>
                </motion.div>
                {currentSubscription?.active ? (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="hidden sm:block"
                  >
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {currentSubscription.plan === 'yearly' ? 'Yearly' : 'Monthly'} Plan
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="hidden sm:block"
                  >
                    <button 
                      onClick={() => setShowPlansModal(true)}
                      className="text-primary-600 hover:text-primary-800 font-medium"
                    >
                      Upgrade
                    </button>
                  </motion.div>
                )}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden sm:block"
                >
                  <button 
                    onClick={() => logout()}
                    className="text-gray-600 hover:text-primary-600 font-medium"
                  >
                    Logout
                  </button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden sm:block"
                >
                  <Link to="/login" className="text-gray-600 hover:text-primary-600 font-medium">
                    Login
                  </Link>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden sm:block"
                >
                  <button 
                    onClick={() => setShowFeaturesModal(true)} 
                    className="btn-primary glow"
                  >
                    Get Verba
                  </button>
                </motion.div>
              </>
            )}
          </div>
      </div>
      
      {/* Features Modal */}
      <Modal
        isOpen={showFeaturesModal}
        onClose={() => setShowFeaturesModal(false)}
        title="Verba Features"
        maxWidth="max-w-2xl"
      >
        <FeaturesPopup 
          onGetVerba={() => {
            setShowFeaturesModal(false);
            setShowPlansModal(true);
          }}
        />
      </Modal>
      
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
            // If user is not authenticated, they will be redirected to login page
            // by the SubscriptionPlans component
          }}
        />
      </Modal>
    </motion.header>
  );
};

export default Navbar;