'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setApiError('');

    try {
      const res = await apiPost('/auth/login', { email, password });
      if (res.ok) {
        const data = await res.json();
        if (data.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        const data = await res.json();
        setApiError(data?.error || 'Login failed. Please try again.');
      }
    } catch {
      setApiError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 py-10 bg-[#f5f1ec] text-[#1f2428] font-sans">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-[360px] bg-white rounded-[10px] border border-[#e6dfd6] shadow-[0_12px_28px_rgba(31,42,61,0.16)] p-7"
      >
        <h1 className="text-center text-2xl font-bold mb-[18px]">Login</h1>

        {/* API-level error */}
        {apiError && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-[rgba(201,74,74,0.08)] border border-[rgba(201,74,74,0.3)] text-[12px] text-[#c94a4a]">
            {apiError}
          </div>
        )}

        {/* Email */}
        <div className="mb-3.5">
          <label className="block text-[12.5px] font-semibold mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="Enter your email"
            className="w-full h-9 rounded-lg border border-[#e6dfd6] px-3 text-[12.5px] text-[#1f2428] bg-white outline-none focus:ring-1 focus:ring-[#3b6b63]"
          />
          {touched.email && !email.trim() && (
            <p className="text-[11px] text-[#c94a4a] mt-1.5">* Email is required</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-3.5">
          <label className="block text-[12.5px] font-semibold mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur('password')}
            placeholder="Enter your password"
            className="w-full h-9 rounded-lg border border-[#e6dfd6] px-3 text-[12.5px] text-[#1f2428] bg-white outline-none focus:ring-1 focus:ring-[#3b6b63]"
          />
          {touched.password && !password.trim() && (
            <p className="text-[11px] text-[#c94a4a] mt-1.5">* Password is required</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[38px] rounded-lg bg-[#1f2a3d] text-white font-semibold text-[12.5px] mt-2.5 shadow-[0_10px_18px_rgba(31,42,61,0.22)] disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>

        <p className="text-center text-[11.5px] text-[#6d6a64] mt-3.5">
          Don&apos;t have an account?{' '}
          <a href="/create-account" className="text-[#3b6b63] underline font-semibold">
            Create Account
          </a>
        </p>
      </form>
    </div>
  );
}