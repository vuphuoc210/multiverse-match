import Link from "next/link";
import { Grid2X2, Plus } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Multiverse Match home">
        <span className="brand-mark"><Grid2X2 aria-hidden="true" /></span>
        <span>Multiverse Match</span>
      </Link>
      <Link href="/create" className="create-link"><Plus aria-hidden="true" /> Make a puzzle</Link>
    </header>
  );
}
