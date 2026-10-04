import type { Metadata } from "next";
import { ManageLoader } from "@/components/manage-loader";

export const metadata: Metadata = { title: "Manage puzzle", robots: { index: false, follow: false } };

export default async function ManagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <main className="page-frame builder-page"><ManageLoader slug={slug} /></main>;
}
