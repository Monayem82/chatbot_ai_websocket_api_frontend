import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { router } from './Routers/Routers.jsx'

import { RouterProvider } from "react-router/dom";
import Root from './Root/Root.jsx'
import AuthProvider from './context/AuthProvider.jsx'

createRoot(document.getElementById('root')).render(

  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} >
        <Root></Root>
      </RouterProvider>
    </AuthProvider>
  </StrictMode>
  // <StrictMode>
  //   <App />
  // </StrictMode>,
)
