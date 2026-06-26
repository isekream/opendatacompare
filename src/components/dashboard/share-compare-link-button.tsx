"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ShareCompareLinkButtonProps = {
  href: string;
};

export function ShareCompareLinkButton({ href }: ShareCompareLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button variant="outline" size="sm" type="button" onClick={copyLink}>
      {copied ? <Check /> : <Link2 />}
      {copied ? "Copied" : "Share link"}
    </Button>
  );
}
