import React from 'react';
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import Root from '../Root/Root';
// import Login from '../pages/Login/login.jsx';
import Login from '../pages/Login/Login';
import Dashboard from '../pages/Dashboard/Dashboard.jsx';


export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children:[
        {
            path:'/login',
            Component:Login,
        },
        {
          path:'/register',
          Component:React.lazy(()=>import('../pages/Register/Register.jsx')),
        },
        {
          path:'/dashboard',
          Component:Dashboard,
        }
    ]
  },
]);

