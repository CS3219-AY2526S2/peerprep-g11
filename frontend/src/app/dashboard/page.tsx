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
      <a href="/dashboard" className="px-2.5 py-1.5 rounded-2xl bg-[#e6f0ed] text-[#1f2428] font-semibold">Dashboard</a>
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

const activityItems = [
  { title: 'Matched with Priya · Graphs', meta: 'Completed · 38 minutes · Python', completed: true },
  { title: 'Matched with Ethan · System Design', meta: 'Not completed · 12 minutes · Java', completed: false },
  { title: 'Matched with Amira · Dynamic Programming', meta: 'Completed · 52 minutes · Python', completed: true },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#f5f1ec] text-[#1f2428] font-sans">
      <NavBar />
      <div className="px-10 py-[34px] pb-[50px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-[26px]">
          <div>
            <h1 className="text-xl font-bold m-0 mb-1.5">Welcome back, Alex !</h1>
            <p className="text-[12.5px] text-[#6d6a64] m-0">What would you like to do today ?</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-[#e6dfd6] px-3.5 py-2 rounded-2xl text-[11.5px] shadow-[0_10px_24px_rgba(31,42,61,0.12)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#6d6a64]" />
            Status: Not in a session
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-6 mb-5">
          {[
            {
              icon: (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <circle cx="11" cy="11" r="6" stroke="#3b6b63" strokeWidth="1.8" />
                  <path d="M16 16l4 4" stroke="#3b6b63" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ),
              title: 'Browse Questions',
              desc: 'Explore curated technical interview prompts across categories, difficulty, and company style focus areas.',
              meta: '42 new questions this week',
              action: 'Explore questions',
            },
            {
              icon: (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <circle cx="9" cy="9" r="3" stroke="#3b6b63" strokeWidth="1.8" />
                  <circle cx="16" cy="10" r="2.5" stroke="#3b6b63" strokeWidth="1.8" />
                  <path d="M4.5 19c.6-2.7 3-4 5.5-4s4.8 1.3 5.4 4" stroke="#3b6b63" strokeWidth="1.8" />
                </svg>
              ),
              title: 'Start Matching',
              desc: 'Jump into a peer session in minutes and solve live interview questions together.',
              meta: 'Average match time: 1m 12s',
              action: 'Find a match',
            },
          ].map(({ icon, title, desc, meta, action }) => (
            <div
              key={title}
              className="bg-white rounded-[14px] border border-[rgba(59,107,99,0.35)] shadow-[0_18px_32px_rgba(31,42,61,0.18)] p-7 pb-[26px] min-h-[260px] flex flex-col gap-3.5"
            >
              <div className="w-11 h-11 rounded-[14px] bg-[#e6f0ed] grid place-items-center">
                {icon}
              </div>
              <h3 className="text-[15px] font-bold m-0">{title}</h3>
              <p className="text-[12.5px] text-[#6d6a64] leading-relaxed m-0 max-w-[340px]">{desc}</p>
              <span className="inline-flex items-center gap-2.5 text-[11.5px] text-[#6d6a64] px-3 py-1.5 rounded-full bg-[#f8f3ee] border border-[#e6dfd6] w-fit">
                {meta}
              </span>
              <button className="mt-auto inline-flex items-center gap-2 px-[18px] py-2.5 rounded-full bg-[#1f2a3d] text-white text-xs font-semibold shadow-[0_10px_18px_rgba(31,42,61,0.22)] w-fit">
                {action}
              </button>
            </div>
          ))}
        </div>

        {/* Activity */}
        <div className="mt-7">
          <h2 className="text-[13px] font-semibold m-0 mb-3">Recent Activity</h2>
          <div className="bg-white rounded-xl border border-[#e6dfd6] shadow-[0_10px_24px_rgba(31,42,61,0.12)] p-[18px]">
            <ul className="grid gap-3 m-0 p-0 list-none">
              {activityItems.map(({ title, meta, completed }) => (
                <li
                  key={title}
                  className="flex items-start justify-between gap-4 px-3.5 py-3 rounded-[10px] bg-[#f8f3ee] border border-[#e6dfd6]"
                >
                  <div>
                    <p className="text-[12.5px] font-semibold m-0 mb-1 text-[#1f2428]">{title}</p>
                    <p className={`text-[11.5px] m-0 ${completed ? 'text-[#6d6a64]' : 'text-[#c94a4a] font-semibold'}`}>
                      {meta}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                      completed
                        ? 'text-[#1f8f56] bg-[rgba(31,143,86,0.14)] border border-[rgba(31,143,86,0.3)]'
                        : 'text-[#c94a4a] bg-[rgba(201,74,74,0.12)] border border-[rgba(201,74,74,0.22)] font-bold'
                    }`}
                  >
                    {completed ? 'Completed' : 'Not completed'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
