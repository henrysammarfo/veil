import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function StatHint({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex shrink-0 text-[color:var(--ds-muted)] transition-colors hover:text-[color:var(--ds-fg)]"
            aria-label="More info"
          >
            <Info className="h-3 w-3 opacity-70" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[220px] border border-[color:var(--ds-border)] bg-[color:var(--ds-surface)] px-3 py-2 text-[11px] leading-relaxed text-[color:var(--ds-fg)]"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
