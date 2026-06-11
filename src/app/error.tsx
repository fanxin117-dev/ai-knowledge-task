"use client";

import { useEffect } from "react";

type AppErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppErrorPage({ error, reset }: AppErrorPageProps) {
  useEffect(() => {
    // 保留控制台错误，方便开发时看到真实堆栈；页面上只展示面向用户的恢复操作。
    console.error(error);
  }, [error]);

  return (
    <main className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <p className="font-[var(--font-mono)] text-xs font-bold text-red-700">运行时错误</p>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl font-black text-slate-950">页面暂时无法渲染</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          当前页面遇到运行时错误。你可以先重试当前页面；如果刚刚修改了数据库或代码，请重新启动开发服务器后再访问。
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm"
        >
          重试当前页面
        </button>
      </section>
    </main>
  );
}
