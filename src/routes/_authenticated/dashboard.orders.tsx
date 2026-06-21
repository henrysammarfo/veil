import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Layout shell so /dashboard/orders/$orderId child routes can render. */
export const Route = createFileRoute("/_authenticated/dashboard/orders")({
  component: () => <Outlet />,
});
