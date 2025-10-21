"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  User,
} from "firebase/auth";
import Link from "next/link";

const googleProvider = new GoogleAuthProvider();

export default function LoginPage() {
  const auth = getFirebaseAuth();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsub();
  }, [auth]);

  const handleEmailSignIn = async (mode: "login" | "signup") => {
    setError(null);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <section className="bg-slate-900 border border-slate-700 rounded-xl p-10 shadow-2xl w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Todo 로그인</h1>
        {user ? (
          <div className="space-y-4 text-center">
            <p className="text-lg">{user.email || user.displayName}님 환영합니다.</p>
            <Link
              href="/todos"
              className="block rounded-md bg-emerald-500 px-4 py-2 font-semibold hover:bg-emerald-600"
            >
              내 할 일 보러가기
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full rounded-md bg-rose-500 px-4 py-2 font-semibold hover:bg-rose-600"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="••••••••"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleEmailSignIn("login")}
                className="flex-1 rounded-md bg-sky-500 px-4 py-2 font-semibold hover:bg-sky-600"
              >
                이메일 로그인
              </button>
              <button
                onClick={() => handleEmailSignIn("signup")}
                className="flex-1 rounded-md border border-slate-600 px-4 py-2 font-semibold hover:bg-slate-700"
              >
                회원가입
              </button>
            </div>
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-700" />
              <span className="mx-3 text-xs uppercase tracking-[0.2em] text-slate-500">또는</span>
              <div className="flex-grow border-t border-slate-700" />
            </div>
            <button
              onClick={handleGoogleSignIn}
              className="w-full rounded-md bg-amber-400 px-4 py-2 font-semibold text-slate-900 hover:bg-amber-300"
            >
              Google로 계속하기
            </button>
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <p className="text-xs text-slate-400">
              Firebase 이메일/비밀번호 또는 Google 로그인을 사용할 수 있습니다. 환경 변수는 <code>.env.local</code>에 설정하세요.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
