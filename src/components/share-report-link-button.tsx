"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ShareReportLinkButtonProps = {
  url: string;
};

export function ShareReportLinkButton({ url }: ShareReportLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={() => void copyLink()}>
      <Share2 />
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
