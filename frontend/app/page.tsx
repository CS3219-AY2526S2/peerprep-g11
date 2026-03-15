import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LandingNavbar } from "@/components/landing-navbar";
import { getCurrentServerUser } from "@/lib/server-auth";
import {
  QuestionBankIcon,
  SmartMatchingIcon,
  RealTimeIcon,
} from "@/components/icons";

const features = [
  {
    icon: QuestionBankIcon,
    title: "Question Bank",
    description: "Curated topics and difficulty levels",
  },
  {
    icon: SmartMatchingIcon,
    title: "Smart Matching",
    description: "Pair with peers in minutes",
  },
  {
    icon: RealTimeIcon,
    title: "Real-Time",
    description: "Live collaboration with shared code",
  },
] as const;

export const dynamic = "force-dynamic";

export default async function Home() {
  noStore();

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = await getCurrentServerUser(token);

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingNavbar />

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-16 text-center">
        <h1 className="font-serif text-[34px] font-bold leading-tight tracking-tight">
          Practice technical interviews
          <br />
          with a peer
        </h1>

        <p className="mt-3 mb-8 max-w-[720px] text-[13.5px] leading-relaxed text-muted-foreground">
          Build interview confidence with real-time peer sessions. Create an
          account, choose your topic and difficulty, get matched quickly, and
          work through questions together in a shared editor.
        </p>

        <div className="mb-11 flex gap-4">
          <Button size="lg" className="min-w-[140px] shadow-lg" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="min-w-[140px]"
            asChild
          >
            <Link href="/signup">Create Account</Link>
          </Button>
        </div>

        <div className="grid w-full max-w-[720px] grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="items-center border-border py-5 text-center shadow-md"
            >
              <CardContent className="flex flex-col items-center gap-2.5 px-4">
                <feature.icon />
                <span className="text-[13.5px] font-semibold">
                  {feature.title}
                </span>
                <span className="text-[11.5px] text-muted-foreground">
                  {feature.description}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
