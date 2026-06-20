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
import { createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VeilDataProvider } from "@/lib/dashboard/veilStore";
import { AuthProvider } from "@/lib/auth/AuthProvider";

const { networkConfig } = createNetworkConfig({
  testnet: { url: getJsonRpcFullnodeUrl("testnet"), network: "testnet" },
});

const testQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

/** Wallet + Sui client context required by AuthProvider in unit tests. */
export function TestProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={testQueryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect={false}>
          <AuthProvider>{children}</AuthProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

/**
 * Minimal router so components that use <Link> from @tanstack/react-router
 * have a router context. We register the two routes our tests link into
 * (orders detail + proofs detail) so type-safe Links don't blow up.
 */
function makeRouter(ui: ReactNode) {
  const rootRoute = createRootRoute({
    component: () => (
      <TestProviders>
        <VeilDataProvider>
          {ui}
          <Outlet />
        </VeilDataProvider>
      </TestProviders>
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
