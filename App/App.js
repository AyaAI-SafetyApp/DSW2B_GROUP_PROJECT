import React, { useState, useEffect } from "react";
import AuthScreen from "./screens/AuthScreen.jsx";
import BiometricPrompt from "./screens/BiometricPrompt.jsx";
import { supabase } from "./lib/supabase";

export default function App() {
  const [showBiometrics, setShowBiometrics] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    // After login/signup success, show biometrics screen
    setShowBiometrics(true);
  };

  const handleBiometricsDone = () => {
    // Navigate to home screen or do nothing for now
    alert("Biometric setup completed (UI only)");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowBiometrics(false);
  };

  // If user is authenticated and biometrics are done, show a simple home screen
  if (session && showBiometrics) {
    return <BiometricPrompt onDone={handleBiometricsDone} />;
  }

  // If user is authenticated but hasn't done biometrics, show biometrics setup
  if (session && !showBiometrics) {
    setShowBiometrics(true);
    return <BiometricPrompt onDone={handleBiometricsDone} />;
  }

  // If user is not authenticated, show auth screen
  return <AuthScreen onSuccess={handleAuthSuccess} />;
}
