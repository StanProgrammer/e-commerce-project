import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom';
import { logout, markAuthChecked, setUser } from '../store/features/auth/authSlice';
import getBaseUrl from '../utils/baseUrl';

const Privateroutes = ({children,role}) => {
    const { user, authChecked } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const location = useLocation();
    const [isVerifyingSession, setIsVerifyingSession] = useState(true);

    // Keep the latest user in a ref so the verify effect below does not
    // depend on the changing `user` value (avoiding re-verification loops).
    const userRef = useRef(user);

    useEffect(() => {
      userRef.current = user;
    }, [user]);

    useEffect(() => {
      let cancelled = false;

      const verifySession = async () => {
        try {
          const response = await fetch(`${getBaseUrl()}/api/auth/me`, {
            credentials: "include",
          });
          const data = await response.json().catch(() => ({}));

          if (cancelled) return;

          if (response.ok && data.isAuthenticated && data.user) {
            dispatch(setUser(data.user));
          } else if (userRef.current) {
            dispatch(logout());
          } else {
            dispatch(markAuthChecked());
          }
        } catch {
          if (!cancelled) {
            dispatch(userRef.current ? logout() : markAuthChecked());
          }
        } finally {
          if (!cancelled) {
            setIsVerifyingSession(false);
          }
        }
      };

      verifySession();

      return () => {
        cancelled = true;
      };
    }, [dispatch]);

    useEffect(() => {
      if (user && role && user.role !== role && user.role !== "admin") {
        toast.error("You do not have permission to view this page. Use an authorized account.", {
          id: "route-permission-denied",
        });
      }
    }, [role, user]);

    if (!authChecked || isVerifyingSession) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">
          Checking your session...
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (role && user.role !== role && user.role !== "admin") {
      // User does not have the required role, redirect to unauthorized page or home
      return <Navigate to="/" state={{from:location}} replace />;
    }

    return children;
}

export default Privateroutes
