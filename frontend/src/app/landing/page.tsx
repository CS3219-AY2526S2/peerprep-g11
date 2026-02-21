'use client';

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f1ec] text-[#1f2428] font-sans">
      {/* Nav Bar */}
      <nav className="flex items-center gap-2.5 px-7 py-[18px]">
        <div className="w-7 h-7 flex items-center justify-center">
          <svg viewBox="0 0 32 32" width="26" height="26" fill="none">
            <rect x="3" y="3" width="26" height="26" rx="6" stroke="#1f2a3d" strokeWidth="2" />
            <path d="M9 12l7-4 7 4-7 4-7-4z" stroke="#1f2a3d" strokeWidth="2" fill="none" />
            <path d="M9 12v8l7 4 7-4v-8" stroke="#1f2a3d" strokeWidth="2" fill="none" />
          </svg>
        </div>
        <span className="font-semibold tracking-wide">PeerPrep</span>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-[70px] pb-[90px]">
        <h1 className="text-[34px] font-bold m-0 mb-3">
          Practice technical interviews<br />with a peer
        </h1>
        <p className="max-w-[720px] mb-[34px] text-[#6d6a64] text-[13.5px] leading-relaxed">
          Build interview confidence with real-time peer sessions. Create an account, choose your
          topic and difficulty, get matched quickly, and work through questions together in a
          shared editor.
        </p>
        <div className="flex gap-4 mb-11">
          <button 
            onClick={() => router.push("/login")}
            className="min-w-[140px] px-[22px] py-3 rounded-md text-[13.5px] font-semibold bg-[#1f2a3d] text-white shadow-[0_10px_18px_rgba(31,42,61,0.22)]">
            Login
          </button>
          <button
            onClick={() => router.push("/create-account")}
            className="min-w-[140px] px-[22px] py-3 rounded-md text-[13.5px] font-semibold bg-[#f8f3ee] text-[#1f2428] border border-[#e6dfd6]">
            Create Account
          </button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-6 max-w-[720px] w-full">
          {[
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
                  <path d="M6 5h11a2 2 0 012 2v12" stroke="#3b6b63" strokeWidth="1.6" />
                  <path d="M6 5a2 2 0 00-2 2v12a2 2 0 002 2h11" stroke="#3b6b63" strokeWidth="1.6" />
                  <path d="M6 5v14" stroke="#3b6b63" strokeWidth="1.6" />
                </svg>
              ),
              title: 'Question Bank',
              sub: 'Curated topics and difficulty levels',
            },
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
                  <circle cx="9" cy="9" r="3" stroke="#3b6b63" strokeWidth="1.6" />
                  <circle cx="15.5" cy="10.5" r="2.5" stroke="#3b6b63" strokeWidth="1.6" />
                  <path d="M4.5 19c.7-3 3.2-4.5 5.8-4.5s5 1.5 5.6 4.5" stroke="#3b6b63" strokeWidth="1.6" />
                </svg>
              ),
              title: 'Smart Matching',
              sub: 'Pair with peers in minutes',
            },
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
                  <circle cx="12" cy="12" r="8" stroke="#3b6b63" strokeWidth="1.6" />
                  <path d="M12 8v5l3 2" stroke="#3b6b63" strokeWidth="1.6" />
                </svg>
              ),
              title: 'Real-Time',
              sub: 'Live collaboration with shared code',
            },
          ].map(({ icon, title, sub }) => (
            <div
              key={title}
              className="bg-white rounded-lg p-[22px] px-4 shadow-[0_10px_24px_rgba(31,42,61,0.12)] border border-[#e6dfd6] flex flex-col items-center gap-2.5"
            >
              {icon}
              <div className="text-[13.5px] font-semibold">{title}</div>
              <div className="text-[11.5px] text-[#6d6a64]">{sub}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
