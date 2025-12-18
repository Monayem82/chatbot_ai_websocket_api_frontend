import React from 'react';
import Chatbot from '../Chatbot/Chatbot';
import { Outlet } from 'react-router';

const Dashboard = () => {

    return (
        <div>
            <Chatbot></Chatbot>
        </div>
    );
};

export default Dashboard;