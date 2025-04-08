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
      try {
        if (!isAuthenticated || !user) {
          setCurrentSubscription(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null); // Reset error state
        
        // Safely check subscription status
        const subscriptionData = await checkSubscriptionStatus(user.id);
        
        if (subscriptionData) {
          setCurrentSubscription(subscriptionData);
          // Only store in localStorage if we have valid data
          try {
            localStorage.setItem(`checkout_${user.id}`, JSON.stringify(subscriptionData));
          } catch (storageError) {
            console.warn('Failed to store subscription data:', storageError);
            // Continue without storing - not a critical error
          }
        } else {
          // Handle case where no subscription data is returned
          setCurrentSubscription({
            active: false,
            plan: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            trialEnd: null
          });
        }
      } catch (err) {
        console.error('Error checking subscription:', err);
        setError('Failed to check subscription status');
        // Set a safe default state
        setCurrentSubscription({
          active: false,
          plan: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          trialEnd: null
        });
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