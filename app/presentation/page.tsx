import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Morning espresso with Nimble",
  description:
    "Nimble turns live web chaos into structured, source-grounded, agent-ready intelligence before the LLM reasons."
};

export default function PresentationPage() {
  return (
    <iframe
      src="/presentation/index.html"
      title="Morning espresso with Nimble"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: 0,
        margin: 0,
        padding: 0,
        background: "#0d0d0d"
      }}
    />
  );
}
