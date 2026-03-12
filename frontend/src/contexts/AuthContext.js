import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const finalize = () => {
      if (isMounted) {
        setLoading(false);
      }
    };

    const checkBootstrap = async (attempt = 0) => {
      try {
        const bootstrap = await api.get('/auth/bootstrap');
        if (!isMounted) return true;
        if (!bootstrap.data?.hasUsers) {
          localStorage.removeItem('token');
          setUser(null);
          setNeedsSetup(true);
          finalize();
          return true;
        }
        setNeedsSetup(false);
        return true;
      } catch (err) {
        if (attempt < 5) {
          setTimeout(() => checkBootstrap(attempt + 1), 500);
          return false;
        }
        if (isMounted) {
          setNeedsSetup(false);
        }
        finalize();
        return true;
      }
    };

    const init = async () => {
      const bootstrapReady = await checkBootstrap();
      if (!bootstrapReady) {
        return;
      }

      try {
        if (needsSetup) {
          return;
        }

        const token = localStorage.getItem('token');
        if (token) {
          api.get('/auth/profile')
            .then(response => {
              if (isMounted) {
                setUser(response.data);
              }
            })
            .catch(() => {
              localStorage.removeItem('token');
            })
            .finally(() => {
              finalize();
            });
        } else {
          finalize();
        }
      } catch (err) {
        finalize();
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const registerAdmin = async (name, email, password) => {
    try {
      await api.post('/auth/register-admin', { name, email, password });
      setNeedsSetup(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, needsSetup, registerAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
