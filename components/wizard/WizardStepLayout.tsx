"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

interface WizardStepLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function WizardStepLayout({ title, subtitle, children }: WizardStepLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-4 pb-2 shrink-0">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <ScrollArea className="flex-1 px-6 pb-4">
        {children}
      </ScrollArea>
    </div>
  );
}
