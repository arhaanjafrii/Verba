import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <h1 className="text-9xl font-bold text-purple-600">404</h1>
        
        <div className="relative">
          <div className="h-1 w-24 bg-gradient-to-r from-purple-400 to-purple-600 mx-auto my-6"></div>
        </div>
        
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        
        <p className="text-lg text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Link 
          to="/"
          className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg shadow-md hover:bg-purple-700 transition-colors duration-300 inline-flex items-center"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" 
              clipRule="evenodd" 
            />
          </svg>
          Return Home
        </Link>
      </div>
    </motion.div>
  );
};

export default NotFoundPage;