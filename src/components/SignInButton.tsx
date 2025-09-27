import React, { useEffect } from 'react';
import { API_BASE } from '../config';

declare global {
  interface Window {
    phoneEmailListener?: (userObj: { user_json_url: string }) => void;
  }
}

interface SignInButtonProps {
  onSuccess: (user: { id: string; name: string; mobile: string }, token: string) => void;
}

const SignInButton: React.FC<SignInButtonProps> = ({ onSuccess }) => {
  useEffect(() => {
    // Load the external script
    const script = document.createElement('script');
    script.src = "https://www.phone.email/sign_in_button_v1.js";
    script.async = true;
    const container = document.querySelector('.pe_signin_button');
    if (container && !container.querySelector('script')) {
      container.appendChild(script);
    }

    // Define the listener function
    window.phoneEmailListener = async function(userObj) {
      const user_json_url = userObj.user_json_url;
      try {
        const response = await fetch(`${API_BASE}/api/login-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_json_url }),
        });

        const loginData = await response.json();

        if (response.ok) {
          onSuccess(loginData.user, loginData.token);
        } else {
          console.error('Login failed:', loginData.error);
        }
      } catch (err) {
        console.error('Error in phone verification:', err);
      }
    };

    return () => {
      // Cleanup the listener function when the component unmounts
      delete window.phoneEmailListener;
    };
  }, [onSuccess]);

  return (
    <div className="pe_signin_button mb-6" data-client-id="15695407177920574360"></div>
  );
};

export default SignInButton;
