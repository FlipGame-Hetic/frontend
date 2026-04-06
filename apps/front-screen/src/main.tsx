import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/styles/index.css"
import App from "./App"
import { WebsocketTest } from "./websocket-test/WebsocketTest"

const isTestMode = new URLSearchParams(window.location.search).has("wstest")

const root = document.getElementById("root")
if (!root) throw new Error("Root element not found")

createRoot(root).render(<StrictMode>{isTestMode ? <WebsocketTest /> : <App />}</StrictMode>)
