import { describe, it, expect } from "vitest";
import { Navigate } from "react-router-dom";
import { routes } from "./router.jsx";

describe("dashboard route aliases", () => {
  it("redirects /dashboard/manage-users to /dashboard/user-management", () => {
    const dashboard = routes.find((r) => r.path === "/dashboard");
    expect(dashboard).toBeDefined();

    const alias = dashboard.children.find((c) => c.path === "manage-users");
    expect(alias).toBeDefined();

    // The alias is wrapped in Privateroutes like every admin route; find the Navigate inside.
    const navigate = alias.element.props.children;
    expect(navigate.type).toBe(Navigate);
    expect(navigate.props.to).toBe("/dashboard/user-management");
    expect(navigate.props.replace).toBe(true);
  });
});
