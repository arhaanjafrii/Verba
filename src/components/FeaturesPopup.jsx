import React from 'react';
import { motion } from 'framer-motion';

const FeaturesPopup = ({ onGetVerba }) => {
  const features = [
    {
      title: 'Unlimited Notes',
      description: 'Create as many notes as you want, and get up to 2 hours of recording time per note.',
      icon: (
        <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      ),
    },
    {
      title: 'Improved Styling',
      description: 'Unlock more styles, create your own styles prompts and more!',
      icon: (
        <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
        </svg>
      ),
    },
    {
      title: 'File Upload',
      description: 'Create notes from your own audio files. Multiple formats supported!',
      icon: (
        <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
        </svg>
      ),
    },
    {
      title: 'Organize Your Notes',
      description: 'Sort and filter your notes with ease by adding custom tags.',
      icon: (
        <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
        </svg>
      ),
    },
    {
      title: 'Integrations',
      description: 'Connect Verba with Zapier to send your notes anywhere you want!',
      icon: (
        <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      ),
    },
  ];

  return (
    <div className="py-4">
      <h3 className="text-2xl font-bold mb-6 text-center gradient-text">Unlock Verba Plus</h3>
      <p className="text-center text-gray-600 mb-8">Get unlimited access to all premium features</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="flex items-start p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <div className="mr-4 bg-primary-100 p-2 rounded-lg">
              {feature.icon}
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-1">{feature.title}</h4>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="text-center">
        <button
          className="btn-primary w-full py-3 glow-effect"
          onClick={onGetVerba}
        >
          Get Verba
        </button>
      </div>
    </div>
  );
};

export default FeaturesPopup;