import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="page-frame"><div className="state-panel"><p className="eyebrow">404</p><h1>This puzzle slipped into another universe.</h1><p>The link may be incorrect or the creator may have deleted it.</p><Button asChild><Link href="/">Play the starter puzzle</Link></Button></div></main>;
}
