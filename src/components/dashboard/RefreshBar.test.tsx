import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RefreshBar } from "@/components/dashboard/RefreshBar";
import { MockDataProvider } from "@/lib/dashboard/mockStore";

describe("RefreshBar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a countdown label and a working refresh button", async () => {
    render(
      <MockDataProvider>
        <RefreshBar resource="orders" label="orders" />
      </MockDataProvider>,
    );


    // Initial label includes "next" + seconds suffix.
    await waitFor(() => {
      expect(screen.getByText(/next \d+s/i)).toBeInTheDocument();
    });

    // Advance time by 1s — countdown should re-render via the 1s interval.
    const first = screen.getByText(/next \d+s/i).textContent!;
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    const second = screen.getByText(/next \d+s/i).textContent!;
    expect(second).not.toBe(first);

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: /refresh/i }));
    // Refresh disables the button while loading.
    expect(screen.getByRole("button", { name: /refresh/i })).toBeDisabled();
  });
});
