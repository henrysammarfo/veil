import { describe, it, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { copyToClipboard } from "@/lib/dashboard/clipboard";
import type { Proof } from "@/lib/dashboard/types";
import { clipboardWriteText } from "@/test/setup";

const SEED_PROOF: Proof = {
  id: "p1",
  t: "12:00:00",
  tag: "ATTEST",
  text: "Execution BULL · BTC",
  hash: "0xabc123def4567890",
  orderId: "vl-order-1",
  enclave: "82720b1c",
  pcr0: "pcr0-live",
  txDigest: "0xdigest",
  createdAt: Date.now(),
  payload: { market: "BTC/USDC" },
};

function CopyPayloadHarness({ proof }: { proof: Proof }) {
  const payloadJson = JSON.stringify(
    {
      id: proof.id,
      tag: proof.tag,
      hash: proof.hash,
      orderId: proof.orderId,
      enclave: proof.enclave,
      pcr0: proof.pcr0,
      txDigest: proof.txDigest,
      capturedAt: new Date(proof.createdAt).toISOString(),
      payload: proof.payload ?? {},
    },
    null,
    2,
  );

  return (
    <div>
      <pre data-testid="payload">{payloadJson}</pre>
      <button onClick={() => copyToClipboard(payloadJson)}>Copy JSON</button>
    </div>
  );
}

describe("Proof detail · copy payload", () => {
  it("serializes the proof with the documented shape and copies it to the clipboard", async () => {
    const writeText = clipboardWriteText;
    render(<CopyPayloadHarness proof={SEED_PROOF} />);

    await waitFor(() => {
      expect(screen.getByTestId("payload")).toBeInTheDocument();
    });

    const json = JSON.parse(screen.getByTestId("payload").textContent || "{}");
    expect(json.id).toBe("p1");
    expect(json.tag).toBe("ATTEST");
    expect(json.hash).toMatch(/^0x/);
    expect(json.payload).toMatchObject({ market: "BTC/USDC" });
    expect(typeof json.capturedAt).toBe("string");

    fireEvent.click(screen.getByRole("button", { name: /copy json/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const copied = writeText.mock.calls[0][0];
    expect(copied).toContain('"id": "p1"');
    expect(copied).toContain('"tag": "ATTEST"');
  });
});
