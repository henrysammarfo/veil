import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const TEST_TRADER = "0x" + "a".repeat(64);

vi.mock("@mysten/dapp-kit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mysten/dapp-kit")>();
  return {
    ...actual,
    useCurrentAccount: () => ({
      address: TEST_TRADER,
      publicKey: new Uint8Array(32),
      chains: ["sui:testnet"],
    }),
    useWallets: () => [],
    useConnectWallet: () => ({ mutateAsync: vi.fn(), mutate: vi.fn(), isPending: false }),
    useDisconnectWallet: () => ({ mutate: vi.fn() }),
  };
});

import { ProofConsole } from "@/components/dashboard/ProofConsole";
import { VeilDataProvider } from "@/lib/dashboard/veilStore";
import { TestProviders } from "@/test/test-utils";
import { clipboardWriteText } from "@/test/setup";

const SEED_PROOFS = [
  {
    id: "p1",
    t: "12:00:00",
    tag: "ATTEST",
    text: "PCR0 verified · enclave veil-bull",
    hash: "0xabc123def456",
    pcr0: "pcr0-test",
    createdAt: Date.now(),
  },
  {
    id: "p2",
    t: "12:01:00",
    tag: "SETTLE",
    text: "Settlement complete",
    hash: "0xdef789",
    createdAt: Date.now(),
  },
];

function renderConsole() {
  return render(
    <TestProviders>
      <VeilDataProvider>
        <ProofConsole max={50} />
      </VeilDataProvider>
    </TestProviders>,
  );
}

describe("ProofConsole", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);
        if (url.includes("/api/proofs")) {
          return { ok: true, json: async () => SEED_PROOFS } as Response;
        }
        if (url.includes("/api/orders")) {
          return { ok: true, json: async () => [] } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("filters rows by tag chip and copies a hash to the clipboard", async () => {
    const writeText = clipboardWriteText;
    renderConsole();

    await waitFor(() => expect(screen.getAllByText(/PCR0/i).length).toBeGreaterThan(0), {
      timeout: 3000,
    });

    const settleRowsBefore = screen.getAllByText("SETTLE").length;
    fireEvent.click(screen.getAllByRole("button", { name: "ATTEST" })[0]);

    await waitFor(() => {
      const settleRows = screen
        .queryAllByText("SETTLE")
        .filter((el: HTMLElement) => el.tagName === "SPAN");
      expect(settleRows.length).toBeLessThan(settleRowsBefore);
    });

    fireEvent.click(screen.getAllByRole("button", { name: /copy proof hash/i })[0]);
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toMatch(/^0x/);
  });

  it("renders an empty state when no proofs match the search", async () => {
    const user = userEvent.setup();
    renderConsole();
    await waitFor(() => expect(screen.getAllByText(/PCR0/i).length).toBeGreaterThan(0), {
      timeout: 3000,
    });

    const input = screen.getByPlaceholderText(/hash or text/i);
    await user.type(input, "zzz-no-such-proof-zzz");
    await waitFor(() => {
      expect(screen.getByText(/no proofs match/i)).toBeInTheDocument();
    });
  });
});
