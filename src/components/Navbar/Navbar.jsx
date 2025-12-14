import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const Navbar = () => {

    // const {userInfo} =useContext(AuthContext)

    const {logout} =useContext(AuthContext)
    const navigate = useNavigate();


    const userInfoData = localStorage.getItem('user')
    const userInfo = JSON.parse(userInfoData)

    console.log(" Navbar call to user info into localstorage  ", userInfo)



    const handleLogout = async () => {

        try {
            // localStorage থেকে refresh token নেওয়া
            const refreshToken = localStorage.getItem("refreshToken");

            // Django Logout API কল করা
            await axios.post("http://localhost:8000/auth-info/logout/", {
                refresh: refreshToken,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                }
            });
            // Context variable or function logout
            logout()
            alert("Successfully logged out!");
            // চাইলে redirect করতে পারো
            navigate("/login",{ replace: true });
        } catch (error) {
            console.error("Logout failed:", error);
            alert("Logout failed!");
        }
    };


    const links = <>
        {
            userInfo ? <>
                <li><NavLink to={'/dashboard'}>Dashboard</NavLink></li>
                <li> <NavLink to={'/contact'}>Contact</NavLink></li>
                <li><NavLink to={'/chatbot'}>Chatbot</NavLink></li>
                <li><button className='btn' onClick={()=>handleLogout()}>Logout</button></li>
            </> :
                <>
                    <li> <NavLink to={'/login'}>Login</NavLink> </li>
                    <li> <NavLink to={'/register'}>Register</NavLink> </li>
                </>
        }


    </>

    return (
        <div className="navbar bg-base-100 shadow-sm">
            <div className="navbar-start">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /> </svg>
                    </div>
                    <ul
                        tabIndex="-1"
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
                        {links}
                    </ul>
                </div>
                <a className="btn btn-ghost text-xl">AI Assistant</a>
            </div>
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    {links}
                </ul>
            </div>
            <div className="navbar-end">
                {
                    userInfo ? <NavLink to={'/profile'}><button className='btn'>{userInfo.username}</button></NavLink> : <button>  </button>
                }
            </div>
        </div>
    );
};

export default Navbar;