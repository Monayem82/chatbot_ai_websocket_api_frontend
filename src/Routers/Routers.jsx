import React from 'react';
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import Root from '../Root/Root';
// import Login from '../pages/Login/login.jsx';
import Login from '../pages/Login/Login.jsx';
import Dashboard from '../pages/Dashboard/Dashboard.jsx';
import Profile from '../pages/Profile/Profile.jsx';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute.jsx';
import ChatMsg from '../pages/ChatMsg/ChatMsg.jsx';
import ChatPage from '../components/ChatExplore/ChatPage.jsx';
import ChatContainer from '../components/RealChat/ChatContainer.jsx';


export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        path: '/login',
        Component: Login,
      },
      {
        path: '/register',
        Component: React.lazy(() => import('../pages/Register/Register.jsx')),
      },

      // ProtectedRoutes
      {
        element: <ProtectedRoute></ProtectedRoute>,
        children: [
          {
            path: '/dashboard',
            element: <Dashboard></Dashboard>
          },
          {
            path: '/profile',
            element: <Profile></Profile>
          },
          {
            path:'/chatmsg',
            element:<ChatMsg></ChatMsg>
          },
          {
            path:'/interactive-chatbox',
            element:<ChatPage></ChatPage>
          },
          {
            path:'/message',
            element:<ChatContainer></ChatContainer>
          }
        ]
      }

    ]
  },
]);

