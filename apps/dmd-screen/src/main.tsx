import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { registerDebugConsole } from "@frontend/ui"
import "./index.css"
import App from "./App"

const root = document.getElementById("root")
if (!root) throw new Error("Root element not found")

registerDebugConsole()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
