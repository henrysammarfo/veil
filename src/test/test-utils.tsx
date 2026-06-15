import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { MockDataProvider } from "@/lib/dashboard/mockStore";

/**
 * Minimal router so components that use <Link> from @tanstack/react-router
 * have a router context. We register the two routes our tests link into
 * (orders detail + proofs detail) so type-safe Links don't blow up.
 */
function makeRouter(ui: ReactNode) {
  const rootRoute = createRootRoute({
    component: () => (
      <MockDataProvider>
        {ui}
        <Outlet />
      </MockDataProvider>
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => null,
  });
  const orderRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/dashboard/orders/$orderId",
    component: () => null,
  });
  const proofRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/dashboard/proofs/$proofId",
    component: () => null,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([indexRoute, orderRoute, proofRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
}

export function renderWithProviders(ui: ReactNode) {
  const router = makeRouter(ui);
  return render(<RouterProvider router={router as never} />);
}
