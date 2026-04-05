import Link from "next/link";
import { Logo } from "@/components/logo";

export function LandingNavbar() {
    return (
        <nav className="flex items-center gap-2.5 px-7 py-4.5">
            <Link href="/" className="flex items-center gap-2.5">
                <Logo />
                <span className="text-sm font-semibold tracking-wide">PeerPrep</span>
            </Link>
        </nav>
    );
}
