import { useSelector } from "react-redux";
import ManageOrders from "../pages/dashboard/admin/manageOrders/ManageOrders.jsx";
import UserOrders from "../pages/dashboard/user/UserOrders.jsx";
import Privateroutes from "./Privateroutes.jsx";

const DashboardOrders = () => {
  const { user } = useSelector((state) => state.auth);

  if (user?.role === "admin") {
    return (
      <Privateroutes role="admin">
        <ManageOrders />
      </Privateroutes>
    );
  }

  return <UserOrders />;
};

export default DashboardOrders;
