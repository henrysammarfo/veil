import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/Hero";
import { ScrollytellingCanvas } from "@/components/ScrollytellingCanvas";
import { Sections } from "@/components/Sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Veil — Trade Smarter. Stay Invisible." },
      {
        name: "description",
        content:
          "Veil is the intelligent stealth execution layer for DeepBook on Sui — private, cryptographically verified order execution.",
      },
      { property: "og:title", content: "Veil — Trade Smarter. Stay Invisible." },
      {
        property: "og:description",
        content: "Private, cryptographically verified order execution for DeepBook on Sui.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative bg-black text-white">
      {/* Fixed scroll-scrubbed frame background (z-0) */}
      <ScrollytellingCanvas />

      {/* All content flows over the fixed background (z-10) */}
      <div className="relative z-10">
        <Hero />
        <Sections />
      </div>
    </main>
  );
}
