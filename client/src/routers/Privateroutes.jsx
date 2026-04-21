import React from 'react'
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom';

const Privateroutes = ({children,role}) => {
    const { user } = useSelector((state) => state.auth);
    const location = useLocation();

    if (!user) {
      // User is not authenticated, redirect to login page
       toast.error("Please login to access this page");
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (role && user.role !== role && user.role !== "admin") {
        toast.error("You do not have permission to access this page");
      // User does not have the required role, redirect to unauthorized page or home
      return <Navigate to="/" state={{from:location}} replace />;
    }

    return children;
}

export default Privateroutes