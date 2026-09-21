import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('shop_token'));

  const handleLogin = (newToken) => {
    localStorage.setItem('shop_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('shop_token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}