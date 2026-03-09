import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ViewState } from "./types";
import type { DetectedProduct } from "./detectors/types";
import "./style.css";

declare var chrome: any;

const STORAGE_ACTIVE_PRODUCT_KEY = "activeProduct";

const PanelRoot: React.FC = () => {
  const [detectedProduct, setDetectedProduct] =
    useState<DetectedProduct | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFromStorage = useCallback(async () => {
    try {
      const stored = await chrome.storage.local.get(STORAGE_ACTIVE_PRODUCT_KEY);
      setDetectedProduct(stored?.[STORAGE_ACTIVE_PRODUCT_KEY] || null);
    } catch (error) {
      console.warn("[SmartCompare] Failed to read active product:", error);
      setDetectedProduct(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFromStorage();

    const onStorageChanged = (changes: any, areaName: string) => {
      if (
        areaName === "local" &&
        Object.prototype.hasOwnProperty.call(
          changes,
          STORAGE_ACTIVE_PRODUCT_KEY,
        )
      ) {
        setDetectedProduct(
          changes[STORAGE_ACTIVE_PRODUCT_KEY]?.newValue || null,
        );
      }
    };

    const onRuntimeMessage = (message: any) => {
      if (message?.action === "PRODUCT_DETECTED" && message.payload) {
        setDetectedProduct(message.payload as DetectedProduct);
      }
      return false;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadFromStorage();
      }
    };

    chrome.storage.onChanged.addListener(onStorageChanged);
    chrome.runtime.onMessage.addListener(onRuntimeMessage);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      chrome.storage.onChanged.removeListener(onStorageChanged);
      chrome.runtime.onMessage.removeListener(onRuntimeMessage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadFromStorage]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0B0F1A] px-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 border border-[#6366F1]/20 flex items-center justify-center">
            <div className="h-5 w-5 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-white/40 font-display">Loading SmartCompare AI...</p>
        </div>
      </div>
    );
  }

  if (!detectedProduct) {
    return (
      <div className="h-screen w-full bg-surface px-4 py-6 overflow-y-auto">
        <div className="max-w-xl mx-auto rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
          <div className="flex items-center space-x-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg
                className="h-3.5 w-3.5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <h1 className="text-base font-bold text-white">
              SmartCompare <span className="text-gradient-primary">AI</span>
            </h1>
          </div>
          <p className="text-sm text-white/40 leading-6">
            Open an Amazon, Flipkart, or supported product page to populate this
            panel with live comparison data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <App
      initialViewState={ViewState.EXPANDED}
      detectedProduct={detectedProduct}
    />
  );
};

const rootElement = document.getElementById("panel-root");
if (!rootElement) {
  throw new Error("Could not find panel-root element to mount to");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <PanelRoot />
  </React.StrictMode>,
);
