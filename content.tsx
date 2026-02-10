import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ViewState } from './types';

declare var chrome: any;

const MOUNT_POINT_ID = 'smartcompare-ai-extension-host';

// Robust Amazon Product Page Detector
const isAmazonProductPage = (): boolean => {
  try {
    const url = window.location.href;
    const hostname = window.location.hostname;
    
    // 1. Must be Amazon
    if (!hostname.includes('amazon')) return false;

    // 2. Must not be a search page or category page
    if (url.includes('/s?') || url.includes('/search/') || url.includes('/b?')) return false;

    // 3. Must match Product URL patterns
    // /dp/ASIN or /gp/product/ASIN
    const isProductUrl = /\/dp\/|\/gp\/product\//.test(url);
    if (!isProductUrl) return false;

    // 4. DOM Confirmation (Crucial)
    // Most Amazon PDPs have a #productTitle
    const hasProductTitle = !!document.getElementById('productTitle');
    
    return hasProductTitle;
  } catch (e) {
    return false;
  }
};

console.log('[SmartCompare] Content script loaded.');

// Check if already injected
if (!document.getElementById(MOUNT_POINT_ID)) {
  
  // 1. Create the Host Element
  const hostElement = document.createElement('div');
  hostElement.id = MOUNT_POINT_ID;
  
  Object.assign(hostElement.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '0',
    height: '0',
    zIndex: '2147483647',
    pointerEvents: 'none' // Allows clicks to pass through when UI is hidden
  });

  document.body.appendChild(hostElement);

  // 2. Create Shadow DOM
  const shadowRoot = hostElement.attachShadow({ mode: 'open' });

  // 3. Create the React Root
  const appRoot = document.createElement('div');
  appRoot.id = 'smartcompare-app-root';
  appRoot.style.pointerEvents = 'auto'; // Re-enable pointer events for the app itself
  shadowRoot.appendChild(appRoot);

  // 4. Inject Styles
  const cssUrl = chrome.runtime.getURL('popup.css');
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  linkElement.href = cssUrl;
  shadowRoot.appendChild(linkElement);

  // Add global font to main document
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
  fontLink.rel = 'stylesheet';
  if (!document.querySelector(`link[href="${fontLink.href}"]`)) {
    document.head.appendChild(fontLink);
  }

  // Internal resets
  const resetStyle = document.createElement('style');
  resetStyle.textContent = `
    :host { 
      all: initial; 
      font-family: 'Inter', sans-serif;
    }
    #smartcompare-app-root {
      position: relative;
      width: 100%;
      height: 100%;
    }
  `;
  shadowRoot.appendChild(resetStyle);

  // 5. Detect & Mount React App
  const isProduct = isAmazonProductPage();
  if (isProduct) {
    console.log('[SmartCompare] Product detected - Auto-enabling UI.');
  }

  // If detected, start MINIMIZED (Bubble). If not, start HIDDEN (waiting for manual toggle).
  const initialViewState = isProduct ? ViewState.MINIMIZED : ViewState.HIDDEN;

  const root = createRoot(appRoot);
  // We pass isExtensionOverride=true so App knows it's embedded.
  root.render(<App isExtensionOverride={true} initialViewState={initialViewState} />);

  // 6. Message Listener
  chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
    if (request.action === "TOGGLE_OVERLAY") {
      console.log('[SmartCompare] Toggling Overlay UI...');
      // Dispatch a standard window event that App.tsx is listening for
      window.dispatchEvent(new CustomEvent('SMARTCOMPARE_TOGGLE'));
      sendResponse({ status: "toggled" });
    }
    return true;
  });
}