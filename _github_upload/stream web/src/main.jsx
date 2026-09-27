import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter کل اپ رو تو یه "زمینه‌ی روتینگ" می‌ذاره تا هر کامپوننتی داخلش
        بتونه بفهمه الان تو کدوم URL هستیم و بین صفحه‌ها جابه‌جا بشه */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
