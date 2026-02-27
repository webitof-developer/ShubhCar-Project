"use client";

export const RegisterLoadingCard = () => {
  return (
    <div className="w-full rounded-[18px] border border-[#94a3b840] bg-white p-8 shadow-[0_18px_40px_#0f172a14] relative max-w-[min(520px,100%)] animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-28 bg-slate-200 rounded"></div>
        <div className="h-6 w-32 bg-slate-100 rounded-full"></div>
      </div>

      <div className="mb-8">
        <div className="h-8 w-32 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 w-64 bg-slate-100 rounded"></div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-12 w-full bg-slate-100 rounded-[10px]"></div>
          <div className="h-12 w-full bg-slate-100 rounded-[10px]"></div>
        </div>
        <div className="h-12 w-full bg-slate-100 rounded-[10px]"></div>
        <div className="h-12 w-full bg-slate-100 rounded-[10px]"></div>
        <div className="h-12 w-full bg-slate-100 rounded-[10px]"></div>

        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 w-full bg-slate-100 rounded-xl"></div>
          <div className="h-16 w-full bg-slate-100 rounded-xl"></div>
        </div>

        <div className="h-11 w-full bg-slate-200 rounded-full mt-4"></div>
      </div>
    </div>
  );
};
