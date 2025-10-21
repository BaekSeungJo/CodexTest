"use client";

import Link from "next/link";

export default function TodosPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold">내 할 일</h1>
          <p className="text-slate-400">
            Firebase 로그인을 완료하면 개인별 할 일 목록을 확인하고 관리할 수 있습니다.
          </p>
          <Link
            href="/login"
            className="inline-flex w-fit items-center gap-2 rounded-md bg-sky-500 px-4 py-2 font-semibold text-slate-900 hover:bg-sky-600"
          >
            로그인으로 이동
          </Link>
        </header>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <p className="text-slate-300">
            Todo 목록, 필터, CRUD 기능은 이후 단계(TASK:UI-TODO)에서 구현됩니다.
          </p>
        </div>
      </section>
    </main>
  );
}
