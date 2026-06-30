import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/styles/index.css"
import App from "./App"
import { registerDebugConsole } from "./debug/registerDebugConsole"

const root = document.getElementById("root")
if (!root) throw new Error("Root element not found")

registerDebugConsole()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
