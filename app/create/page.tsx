import type { Metadata } from "next";
import { PuzzleBuilder } from "@/components/puzzle-builder";

export const metadata: Metadata = { title: "Create a puzzle" };

export default function CreatePage() {
  return <main className="page-frame builder-page"><PuzzleBuilder /></main>;
}
