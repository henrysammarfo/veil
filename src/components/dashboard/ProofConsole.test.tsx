import { describe, it, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProofConsole } from "@/components/dashboard/ProofConsole";
import { MockDataProvider } from "@/lib/dashboard/mockStore";
import { clipboardWriteText } from "@/test/setup";

function renderConsole() {
  return render(
    <MockDataProvider>
      <ProofConsole max={50} />
    </MockDataProvider>,
  );
}

describe("ProofConsole", () => {
  it("filters rows by tag chip and copies a hash to the clipboard", async () => {
    const writeText = clipboardWriteText;
    renderConsole();

    await waitFor(() =>
      expect(screen.getAllByText(/PCR0/i).length).toBeGreaterThan(0),
    );

    const settleRowsBefore = screen.getAllByText("SETTLE").length;
    expect(settleRowsBefore).toBeGreaterThan(0);

    // Activate the ATTEST filter chip.
    fireEvent.click(screen.getAllByRole("button", { name: "ATTEST" })[0]);

    await waitFor(() => {
      const settleRows = screen
        .queryAllByText("SETTLE")
        .filter((el: HTMLElement) => el.tagName === "SPAN");
      expect(settleRows.length).toBeLessThan(settleRowsBefore);
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: /copy proof hash/i })[0],
    );
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toMatch(/^0x/);
  });

  it("renders an empty state when no proofs match the search", async () => {
    const user = userEvent.setup();
    renderConsole();
    await waitFor(() =>
      expect(screen.getAllByText(/PCR0/i).length).toBeGreaterThan(0),
    );

    const input = screen.getByPlaceholderText(/hash or text/i);
    await user.type(input, "zzz-no-such-proof-zzz");
    await waitFor(() => {
      expect(screen.getByText(/no proofs match/i)).toBeInTheDocument();
    });
  });
});

