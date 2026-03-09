import React from "react";
import ReactDOM from "react-dom/client";
import { SmartCompareApp } from "./components/v2/SmartCompareApp";
import "./components/v2/styles/globals.css";

const root = document.getElementById("panel-root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <SmartCompareApp />
    </React.StrictMode>,
  );
}
