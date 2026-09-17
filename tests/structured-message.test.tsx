import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StructuredMessage } from "@/components/chat/structured-message";
import { parseAgentResponseV1 } from "@/lib/api/contracts";

describe("StructuredMessage", () => {
  it("renders known blocks, summary, artifacts, and actions", () => {
    const result = parseAgentResponseV1({
      schema_version: "aidera.agent_response.v1",
      message: "Riset slide selesai.",
      summary: { title: "Ringkasan", items: ["Tiga sumber kredibel"] },
      blocks: [
        { type: "warning", title: "Klaim lemah", content: "Statistik perlu sumber.", severity: "warning" },
        { type: "checklist", title: "Checklist", items: [{ label: "Sumber utama", checked: true }] },
      ],
      artifacts: [{ type: "research", title: "Research v1", version: 1, path: "AID-001/research-v1.md" }],
      actions: [{ type: "send_to_agent", label: "Kirim ke Writer", payload: {} }],
    });

    render(<StructuredMessage result={result} />);

    expect(screen.getByText("Riset slide selesai.")).toBeInTheDocument();
    expect(screen.getByText("Ringkasan")).toBeInTheDocument();
    expect(screen.getByText("Klaim lemah")).toBeInTheDocument();
    expect(screen.getByText("Sumber utama")).toBeInTheDocument();
    expect(screen.getByText("Research v1")).toBeInTheDocument();
    expect(screen.getByText("Kirim ke Writer")).toBeInTheDocument();
  });

  it("renders an unknown block without crashing", () => {
    const result = parseAgentResponseV1({
      schema_version: "aidera.agent_response.v1",
      message: "Format baru.",
      blocks: [{ type: "timeline", title: "Linimasa eksperimen" }],
      artifacts: [],
      actions: [],
    });

    render(<StructuredMessage result={result} />);

    expect(screen.getByText("Linimasa eksperimen")).toBeInTheDocument();
    expect(screen.getByText("Tipe timeline")).toBeInTheDocument();
  });

  it("flags unstructured output", () => {
    render(<StructuredMessage result={parseAgentResponseV1("teks mentah")} />);

    expect(screen.getByText("Respons tidak terstruktur")).toBeInTheDocument();
  });
});
