import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { UpdateToast } from "./components/UpdateToast.tsx";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <UpdateToast />
  </StrictMode>,
);
