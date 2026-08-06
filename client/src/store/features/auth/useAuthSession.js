import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGetMeQuery } from "./authApi";
import { logout, markAuthChecked, setUser } from "./authSlice";

/**
 * Verifies the session via a single shared RTK Query request (`/api/auth/me`).
 * Because App and every protected route call this hook, the query is fetched
 * once (RTK Query dedupes in-flight requests) and re-used everywhere.
 */
export const useAuthSession = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { data, isSuccess, isError, isFetching } = useGetMeQuery();

  const settled = isSuccess || isError;

  useEffect(() => {
    if (!settled) {
      return;
    }

    if (data?.isAuthenticated && data.user) {
      dispatch(setUser(data.user));
    } else if (user) {
      // The persisted session is no longer valid (expired/revoked token).
      dispatch(logout());
    } else {
      dispatch(markAuthChecked());
    }
  }, [data, settled, user, dispatch]);

  return { isVerifying: isFetching && !settled };
};
