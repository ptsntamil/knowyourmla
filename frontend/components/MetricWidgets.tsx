"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function AttendanceWidget() {
  const data = [{ name: "Attendance", value: 90 }, { name: "Remaining", value: 10 }];
  const COLORS = ["#164C45", "#E5E7EB"];

  return (
    <div className="bg-bg-card rounded-2xl p-6 shadow-sm border border-border-subtle flex flex-col items-center">
      <div className="flex justify-between w-full mb-4 items-center">
        <h3 className="font-bold text-text-primary text-sm">Attendance Rating</h3>
        <span className="text-[9px] bg-bg-surface text-text-muted px-2 py-0.5 rounded uppercase font-black tracking-tighter border border-border-subtle">Coming Soon</span>
      </div>
      <div className="h-40 w-40 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-black text-text-primary">90%</span>
        </div>
      </div>
    </div>
  );
}

export function QuestionsWidget() {
  return (
    <div className="bg-bg-card rounded-2xl p-6 shadow-sm border border-border-subtle h-full flex flex-col">
      <div className="flex justify-between w-full mb-4 items-center">
        <h3 className="font-bold text-text-primary text-sm">Questions Asked</h3>
        <span className="text-[9px] bg-bg-surface text-text-muted px-2 py-0.5 rounded uppercase font-black tracking-tighter border border-border-subtle">Coming Soon</span>
      </div>
      <div className="mt-auto pb-4">
        <span className="text-5xl font-black text-text-accent">18</span>
        <p className="text-text-muted font-bold mt-1 text-xs">Questions Asked</p>
      </div>
    </div>
  );
}
