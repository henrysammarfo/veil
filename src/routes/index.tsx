import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/Hero";
import { ScrollytellingCanvas } from "@/components/ScrollytellingCanvas";
import { ScrollySettings } from "@/components/ScrollySettings";
import { Sections } from "@/components/Sections";
import { ChapterNav } from "@/components/ChapterNav";

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
        content:
          "Private, cryptographically verified order execution for DeepBook on Sui.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative bg-black">
      <ScrollytellingCanvas />
      <ScrollySettings />
      <ChapterNav />

      {/* Sticky hero on top of the fixed canvas */}
      <div id="chapter-hero" className="sticky top-0 z-10 h-screen w-full">
        <Hero />
      </div>

      {/* Story sections drive the scrollytelling */}
      <Sections />
    </main>
  );
}
