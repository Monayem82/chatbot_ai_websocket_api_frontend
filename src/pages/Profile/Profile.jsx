import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Profile = () => {
    const {userInfo}=useContext(AuthContext)
    console.log("call form context",userInfo)
    return (
        <div>
            <h2>Hi this is profile</h2>
        </div>
    );
};

export default Profile;