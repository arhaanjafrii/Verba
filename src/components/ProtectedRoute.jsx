import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';

const ProtectedRoute = ({ element, requireSubscription }) => {
  const { isAuthenticated } = useAuth();
  const { currentSubscription } = useSubscription();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireSubscription && (!currentSubscription || !currentSubscription.active)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return element;
};

export default ProtectedRoute;