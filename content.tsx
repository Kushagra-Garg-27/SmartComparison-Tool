import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

declare var chrome: any;

const MOUNT_POINT_ID = 'smartcompare-ai-extension-host';

// Check if already injected
if (!document.getElementById(MOUNT_POINT_ID)) {
  
  // 1. Create the Host Element (The container that lives in the light DOM)
  const hostElement = document.createElement('div');
  hostElement.id = MOUNT_POINT_ID;
  
  // High Z-Index to sit on top of everything
  Object.assign(hostElement.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '0',
    height: '0',
    zIndex: '2147483647', // Max safe integer
    pointerEvents: 'none' // Allow clicks to pass through the wrapper itself
  });

  document.body.appendChild(hostElement);

  // 2. Create Shadow DOM (Isolation Layer)
  const shadowRoot = hostElement.attachShadow({ mode: 'open' });

  // 3. Create the React Root inside Shadow DOM
  const appRoot = document.createElement('div');
  appRoot.id = 'smartcompare-app-root';
  // Re-enable pointer events for the actual app content
  appRoot.style.pointerEvents = 'auto'; 
  shadowRoot.appendChild(appRoot);

  // 4. Inject Styles
  // In a production extension, we would import a built CSS file.
  // For this setup, we inject the Tailwind CDN script into the Shadow DOM.
  const tailwindScript = document.createElement('script');
  tailwindScript.src = 'https://cdn.tailwindcss.com';
  shadowRoot.appendChild(tailwindScript);

  // Add global font to main document head (fonts don't load well inside shadow dom)
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
  fontLink.rel = 'stylesheet';
  if (!document.querySelector(`link[href="${fontLink.href}"]`)) {
    document.head.appendChild(fontLink);
  }

  // Add internal styles to reset inheritance
  const style = document.createElement('style');
  style.textContent = `
    :host { 
      all: initial; 
      font-family: 'Inter', sans-serif;
    }
    /* Ensure Tailwind defaults apply to our root */
    #smartcompare-app-root {
      position: relative;
      width: 100%;
      height: 100%;
    }
  `;
  shadowRoot.appendChild(style);

  // 5. Mount React App
  const root = createRoot(appRoot);
  // Pass explicit flag so App knows it's embedded
  root.render(<App isExtensionOverride={true} />);

  // 6. Listen for messages from background script
  chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
    if (request.action === "TOGGLE_OVERLAY") {
      // We can dispatch a custom event that App.tsx listens to, 
      // or rely on App's internal state management if it was mounted with a specific ref.
      // For simplicity in this React setup, we dispatch a DOM event on the window 
      // that the App component listens for.
      window.dispatchEvent(new CustomEvent('SMARTCOMPARE_TOGGLE'));
    }
  });
}