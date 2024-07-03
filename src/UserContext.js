import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [cookieUserId, setCookieUserId] = useState('Unknown User');

    return (
        <UserContext.Provider value={{ cookieUserId, setCookieUserId }}>
            {children}
        </UserContext.Provider>
    );
};