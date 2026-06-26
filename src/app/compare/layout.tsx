import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Gemeinde finances · OpenDataCompare",
  description:
    "Compare municipal operating expenditure per resident using official Canton Zürich open data.",
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
