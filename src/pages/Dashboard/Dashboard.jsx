import React, { useContext } from 'react';
import Chatbot from '../Chatbot/Chatbot';
import { AuthContext } from '../../context/AuthContext';

const Dashboard = () => {
    const userInfo=useContext(AuthContext)
    console.log(userInfo)
    return (
        <div>
            {userInfo.name}
            <Chatbot></Chatbot>
        </div>
    );
};

export default Dashboard;