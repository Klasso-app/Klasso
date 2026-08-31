import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import DevPreviewApp from "./DevPreviewApp";
import "../index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DevPreviewApp />
  </StrictMode>
);
