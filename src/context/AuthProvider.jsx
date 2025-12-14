import React, { useState } from 'react';
import { AuthContext } from './AuthContext';

const AuthProvider = ({ children }) => {

    const [userInfo, setUser] = useState(null);
    const [tokens, setTokens] = useState({ accessToken: null, refreshToken: null });

    const login = (userData, accessToken, refreshToken) => {
        setUser(userData);
        setTokens({ accessToken, refreshToken });

        // persist in localStorage
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
    };

    const logout = () => {
        setUser(null);
        setTokens({ accessToken: null, refreshToken: null });
        localStorage.clear();
    };


    return (
        <AuthContext.Provider value={{ userInfo, tokens, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
