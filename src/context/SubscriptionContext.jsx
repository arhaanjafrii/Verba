import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getSubscriptionPlans, checkSubscriptionStatus } from '../services/stripeService';
import { supabase } from '../services/supabaseClient';

// Create the context
const SubscriptionContext = createContext();

// Custom hook to use the subscription context
export const useSubscription = () => useContext(SubscriptionContext);

// Provider component
export const SubscriptionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load subscription plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const availablePlans = await getSubscriptionPlans();
        setPlans(availablePlans);
      } catch (err) {
        console.error('Error loading subscription plans:', err);
        setError('Failed to load subscription plans');
      }
    };

    loadPlans();
  }, []);

  // Check user's subscription status when authenticated
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isAuthenticated || !user) {
        setCurrentSubscription(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // In a production environment, this would call your backend API
        // For development, we'll check for subscription data in Supabase
        // or use localStorage as a fallback
        
        // Try to get subscription from localStorage first (for development)
        const storedSubscription = localStorage.getItem(`subscription_${user.id}`);
        if (storedSubscription) {
          try {
            const parsedSubscription = JSON.parse(storedSubscription);
            setCurrentSubscription(parsedSubscription);
            setLoading(false);
            return;
          } catch (parseError) {
            console.error('Error parsing stored subscription:', parseError);
            // Continue to check with API if parsing fails
          }
        }
        
        // If no stored subscription, check with API
        const subscriptionData = await checkSubscriptionStatus(user.id);
        setCurrentSubscription(subscriptionData);
        
        // Store subscription data in localStorage for development
        localStorage.setItem(`subscription_${user.id}`, JSON.stringify(subscriptionData));
      } catch (err) {
        console.error('Error checking subscription:', err);
        setError('Failed to check subscription status');
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user, isAuthenticated]);

  // Context value
  const value = {
    plans,
    currentSubscription,
    loading,
    error,
    isSubscribed: currentSubscription?.active || false,
    currentPlan: currentSubscription?.plan || null,
    expiresAt: currentSubscription?.currentPeriodEnd || null,
    willCancel: currentSubscription?.cancelAtPeriodEnd || false
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};