import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { router } from './Routers/Routers.jsx'

import { RouterProvider } from "react-router/dom";
import Root from './Root/Root.jsx'

createRoot(document.getElementById('root')).render(

  <StrictMode>
    <RouterProvider router={router} >
      <Root></Root>
    </RouterProvider>
  </StrictMode>
  // <StrictMode>
  //   <App />
  // </StrictMode>,
)
