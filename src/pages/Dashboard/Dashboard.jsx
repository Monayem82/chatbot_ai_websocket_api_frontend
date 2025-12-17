import React from 'react';
import Chatbot from '../Chatbot/Chatbot';
import { Outlet } from 'react-router';

const Dashboard = () => {

    return (
        <div>
            <h1>This is dashboard</h1>

            <Chatbot></Chatbot>
        </div>
    );
};

export default Dashboard;