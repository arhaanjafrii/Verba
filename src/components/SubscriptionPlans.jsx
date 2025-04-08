import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '../services/stripeService';

const SubscriptionPlans = ({ onStartTrial }) => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: 16.99,
      interval: 'month',
      features: [
        'Unlimited transcriptions',
        'Advanced AI processing',
        'Priority support',
        'Cancel anytime'
      ],
      stripePriceId: 'price_monthly' // This would be the actual Stripe price ID in production
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: 156,
      interval: 'year',
      features: [
        'Unlimited transcriptions',
        'Advanced AI processing',
        'Priority support',
        'Cancel anytime'
      ],
      stripePriceId: 'price_yearly' // This would be the actual Stripe price ID in production
    }
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const handleStartTrial = async () => {
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      navigate('/login');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const selectedPlanData = plans.find(plan => plan.id === selectedPlan);
      
      if (onStartTrial) {
        onStartTrial(selectedPlanData);
      } else {
        // If no callback is provided, proceed to checkout directly
        const checkoutUrl = await createCheckoutSession(
          selectedPlanData.stripePriceId,
          user.id,
          user.email,
          true // isTrial
        );
        
        // Redirect to Stripe checkout
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      console.error('Error starting trial:', err);
      setError('Failed to start trial. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <h3 className="text-xl font-semibold mb-6 text-center">Choose Your Plan</h3>
      
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-full">
          <button
            className={`px-6 py-2 rounded-full ${selectedPlan === 'monthly' ? 'bg-white shadow-md' : 'text-gray-600'}`}
            onClick={() => handlePlanSelect('monthly')}
          >
            Monthly
          </button>
          <button
            className={`px-6 py-2 rounded-full ${selectedPlan === 'yearly' ? 'bg-white shadow-md' : 'text-gray-600'}`}
            onClick={() => handlePlanSelect('yearly')}
          >
            Yearly
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {plans
          .filter(plan => plan.id === selectedPlan)
          .map(plan => (
            <motion.div
              key={plan.id}
              className="border border-primary-200 rounded-xl p-6 bg-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-4">
                <h4 className="text-2xl font-bold mb-2">{plan.name}</h4>
                <div className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-lg text-gray-500 font-normal">/{plan.interval}</span>
                </div>
                {plan.id === 'yearly' && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    Save over $47 compared to monthly
                  </div>
                )}
              </div>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
      </div>
      
      <div className="mt-8 text-center">
        <button
          className={`btn-primary w-full py-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={handleStartTrial}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Start Free Trial'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          No credit card required for trial. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;