import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetMeQuery } from "./authApi";
import {
  logout,
  markAuthChecked,
  markAuthCheckedKeepUser,
  setUser,
} from "./authSlice";

// Verifies the session via one shared /auth/me request (RTK Query dedupes it).
export const useAuthSession = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { data, isSuccess, isError, isFetching, error } = useGetMeQuery();

  const settled = isSuccess || isError;

  useEffect(() => {
    if (!settled) {
      return;
    }

    if (data?.isAuthenticated && data.user) {
      dispatch(setUser(data.user));
      return;
    }

    // Only a real 401 means the session is gone.
    if (isError && error?.status === 401) {
      dispatch(user ? logout() : markAuthChecked());
      return;
    }

    // The server explicitly said there is no active session.
    if (isSuccess && !data?.isAuthenticated && user) {
      dispatch(logout());
      return;
    }

    // Network blips (FETCH_ERROR/TIMEOUT_ERROR/5xx) aren't a logout — keep the session.
    if (isError) {
      dispatch(markAuthCheckedKeepUser());
      return;
    }

    dispatch(markAuthChecked());
  }, [data, isError, isSuccess, settled, user, dispatch, error?.status]);

  return { isVerifying: isFetching && !settled };
};
