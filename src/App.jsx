import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Pages
import LandingPage from './pages/LandingPage';
import TranscribePage from './pages/TranscribePage';
import LoginPage from './pages/LoginPage';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Context
import { TranscriptionProvider } from './context/TranscriptionContext';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <TranscriptionProvider>
          <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            <main className="flex-grow">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/transcribe" element={<TranscribePage />} />
                  <Route path="/login" element={<LoginPage />} />
                </Routes>
              </AnimatePresence>
            </main>
            <Footer />
          </div>
        </TranscriptionProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;