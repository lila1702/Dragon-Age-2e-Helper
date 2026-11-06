import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@extension/index.css";
import "@extension/presentation/styles/sheet.css";

import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
