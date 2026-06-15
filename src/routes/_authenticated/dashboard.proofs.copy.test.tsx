import { describe, it, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useEffect, useState } from "react";

import {
  MockDataProvider,
  useMockData,
  copyToClipboard,
  type Proof,
} from "@/lib/dashboard/mockStore";
import { clipboardWriteText } from "@/test/setup";



/**
 * The proof detail route uses TanStack's `useParams({ from: ... })`, which
 * requires the full generated route tree to render. Instead, we lift the
 * "copy payload" piece out and verify the exact JSON shape + clipboard call
 * that the detail page uses.
 */
function CopyPayloadHarness({ proofId }: { proofId: string }) {
  const { getProof } = useMockData();
  const [proof, setProof] = useState<Proof | undefined>();
  useEffect(() => {
    const p = getProof(proofId);
    if (p) setProof(p);
  }, [getProof, proofId]);

  if (!proof) return <div>loading</div>;

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

function Harness() {
  return (
    <MockDataProvider>
      <CopyPayloadHarness proofId="p1" />
    </MockDataProvider>
  );
}

describe("Proof detail · copy payload", () => {
  it("serializes the proof with the documented shape and copies it to the clipboard", async () => {
    const writeText = clipboardWriteText;
    render(<Harness />);


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
