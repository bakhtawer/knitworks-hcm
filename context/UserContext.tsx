
import React from 'react';
import { User } from '../types';

export const UserContext = React.createContext<{ user: User | null; logout: () => void }>({ 
    user: null, 
    logout: () => {} 
});
