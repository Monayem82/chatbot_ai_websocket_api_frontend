import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router';

const Profile = () => {
    const {user}=useContext(AuthContext)
    const navigate=useNavigate()
    if (!user){
        return navigate('/login')
    }
    console.log("call form context",user)
    return (
        <div>
            <h2>Hi this is profile</h2>
        </div>
    );
};

export default Profile;