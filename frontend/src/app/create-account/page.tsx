'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost } from "@/lib/api";

export default function CreateAccountPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordLengthValid = password.length >= 8;
  const passwordUppercaseValid = /[A-Z]/.test(password);
  const passwordsMatch = password === confirmPassword;

  const isFormValid =
    username.trim() !== "" &&
    emailValid &&
    passwordLengthValid &&
    passwordUppercaseValid &&
    passwordsMatch;

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const touchAll = () => {
    setTouched({ username: true, email: true, password: true, confirmPassword: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    touchAll();
    if (!isFormValid) return;

    setIsLoading(true);
    setApiError("");

    try {
      const res = await apiPost("/auth/register", { username, email, password });
      if (res.ok) {
        router.push("/login");
      } else {
        const data = await res.json();
        setApiError(data?.error || "Registration failed. Please try again.");
      }
    } catch {
      setApiError("Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 py-10 bg-[#f5f1ec] text-[#1f2428] font-sans">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-[380px] bg-white rounded-[10px] border border-[#e6dfd6] shadow-[0_12px_28px_rgba(31,42,61,0.16)] px-7 pt-7 pb-[22px]"
      >
        <h1 className="text-center text-2xl font-bold mb-[18px]">Create Your Account</h1>

        {/* API-level error */}
        {apiError && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-[rgba(201,74,74,0.08)] border border-[rgba(201,74,74,0.3)] text-[12px] text-[#c94a4a]">
            {apiError}
          </div>
        )}

        {/* Username */}
        <div className="mb-3.5">
          <label className="block text-[12.5px] font-semibold mb-1.5">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => handleBlur("username")}
            placeholder="Enter your username"
            className="w-full h-9 rounded-lg border border-[#e6dfd6] px-3 text-[12.5px] outline-none focus:ring-1 focus:ring-[#3b6b63]"
          />
          {touched.username && username.trim() === "" && (
            <p className="text-[11px] text-[#c94a4a] mt-1.5">* Username is required</p>
          )}
        </div>

        {/* Email */}
        <div className="mb-3.5">
          <label className="block text-[12.5px] font-semibold mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur("email")}
            placeholder="Enter your email"
            className="w-full h-9 rounded-lg border border-[#e6dfd6] px-3 text-[12.5px] outline-none focus:ring-1 focus:ring-[#3b6b63]"
          />
          {touched.email && !emailValid && (
            <p className="text-[11px] text-[#c94a4a] mt-1.5">* Valid email is required</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-3.5">
          <label className="block text-[12.5px] font-semibold mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur("password")}
            placeholder="Enter your password"
            className="w-full h-9 rounded-lg border border-[#e6dfd6] px-3 text-[12.5px] outline-none focus:ring-1 focus:ring-[#3b6b63]"
          />
          {touched.password && (!passwordLengthValid || !passwordUppercaseValid) && (
            <p className="text-[11px] text-[#c94a4a] mt-1.5">* Password must meet criteria</p>
          )}
          <div className="mt-1.5 grid gap-1">
            <span className={`text-[11px] ${passwordLengthValid ? "text-green-600" : "text-[#6d6a64]"}`}>
              • Minimum 8 characters
            </span>
            <span className={`text-[11px] ${passwordUppercaseValid ? "text-green-600" : "text-[#6d6a64]"}`}>
              • At least one uppercase letter
            </span>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-3.5">
          <label className="block text-[12.5px] font-semibold mb-1.5">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => handleBlur("confirmPassword")}
            placeholder="Confirm your password"
            className="w-full h-9 rounded-lg border border-[#e6dfd6] px-3 text-[12.5px] outline-none focus:ring-1 focus:ring-[#3b6b63]"
          />
          {touched.confirmPassword && !passwordsMatch && (
            <p className="text-[11px] text-[#c94a4a] mt-1.5">* Passwords must match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[38px] rounded-lg bg-[#1f2a3d] text-white font-semibold text-[12.5px] mt-2.5 shadow-[0_10px_18px_rgba(31,42,61,0.22)] disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-center text-[11.5px] text-[#6d6a64] mt-3.5">
          Already have an account?{" "}
          <a href="/login" className="text-[#3b6b63] underline font-semibold">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}