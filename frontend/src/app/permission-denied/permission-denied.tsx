'use client';

const NavBar = () => (
  <nav className="flex items-center justify-between px-[26px] py-3.5 bg-white border-b border-[#e6dfd6]">
    <div className="flex items-center gap-2.5 font-semibold">
      <svg viewBox="0 0 32 32" fill="none" className="w-[26px] h-[26px]">
        <rect x="3" y="3" width="26" height="26" rx="6" stroke="#1f2a3d" strokeWidth="2" />
        <path d="M9 12l7-4 7 4-7 4-7-4z" stroke="#1f2a3d" strokeWidth="2" fill="none" />
        <path d="M9 12v8l7 4 7-4v-8" stroke="#1f2a3d" strokeWidth="2" fill="none" />
      </svg>
      PeerPrep
    </div>
    <div className="flex items-center gap-4 text-[12.5px] text-[#6d6a64]">
      <a href="/dashboard" className="px-2.5 py-1.5 rounded-2xl hover:text-[#1f2428]">Dashboard</a>
      <a href="/matching" className="px-2.5 py-1.5 rounded-2xl hover:text-[#1f2428]">Matching</a>
      <a href="/questions" className="px-2.5 py-1.5 rounded-2xl hover:text-[#1f2428]">Questions</a>
    </div>
    <div className="flex items-center gap-2.5 text-[12.5px]">
      User Name
      <div className="w-[30px] h-[30px] rounded-full bg-[#f8f3ee] border border-[#e6dfd6] grid place-items-center">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <circle cx="12" cy="8" r="3.5" stroke="#6f6a63" strokeWidth="1.8" />
          <path d="M5 19c1.2-3 4-4.2 7-4.2s5.8 1.2 7 4.2" stroke="#6f6a63" strokeWidth="1.8" />
        </svg>
      </div>
    </div>
  </nav>
);

export default function PermissionDeniedPage() {
  return (
    <div className="min-h-screen bg-[#f5f1ec] text-[#1f2428] font-sans">
      <NavBar />
      <div className="px-10 py-10 pb-[60px] grid place-items-center">
        <div className="w-[520px] max-w-full bg-[#fff5f4] border border-[rgba(201,74,74,0.4)] rounded-xl shadow-[0_12px_26px_rgba(201,74,74,0.14)] p-8 grid gap-4">
          {/* Icon */}
          <div className="w-[52px] h-[52px] rounded-2xl bg-[rgba(201,74,74,0.12)] border border-[rgba(201,74,74,0.35)] grid place-items-center">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
              <rect x="5" y="10" width="14" height="10" rx="2" stroke="#c94a4a" strokeWidth="1.8" />
              <path d="M8 10V7.6C8 5.6 9.8 4 12 4s4 1.6 4 3.6V10" stroke="#c94a4a" strokeWidth="1.8" />
              <circle cx="12" cy="15" r="1.6" fill="#c94a4a" />
            </svg>
          </div>

          <div className="flex items-center gap-2 text-[11.5px] text-[#c94a4a] font-semibold">
            Access Restricted
          </div>

          <h1 className="text-xl font-bold m-0 text-[#c94a4a]">Permission Denied</h1>

          <p className="text-[12.5px] leading-relaxed text-[#6d6a64] m-0">
            You don&apos;t have access to view this page. This area is limited to users with the
            required role or session permissions. If you believe this is a mistake, contact your
            administrator or return to a page you can access.
          </p>

          <div className="flex items-center gap-3 mt-1.5">
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="border-none bg-[#c94a4a] text-white px-[18px] py-2.5 rounded-lg text-[12.5px] font-semibold cursor-pointer shadow-[0_10px_18px_rgba(201,74,74,0.28)]"
            >
              Return Home
            </button>
            <button
              onClick={() => (window.location.href = '/questions')}
              className="border border-[rgba(201,74,74,0.4)] bg-[#fff0ef] text-[#1f2428] px-4 py-2.5 rounded-lg text-[12.5px] font-semibold cursor-pointer"
            >
              Browse Questions
            </button>
          </div>

          <p className="text-[11.5px] text-[#c94a4a] m-0">
            Error code: 403 · Permission check failed
          </p>
        </div>
      </div>
    </div>
  );
}
