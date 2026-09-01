import React, { useState } from 'react';

export default function AttendancePortal() {
  // Store applied leaves: { "2026-09-05": "planned" }
  const [leaves, setLeaves] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [leaveType, setLeaveType] = useState('planned');

  // Current Month Setup (September 2026)
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Color Mapping for UI
  const leaveColors = {
    planned: 'bg-amber-100 text-amber-800 border-amber-300', // Yellow
    casual: 'bg-orange-100 text-orange-800 border-orange-300', // Orange
    sick: 'bg-red-100 text-red-800 border-red-300', // Red
  };

  // Add / Apply Leave
  const handleApplyLeave = (e) => {
    e.preventDefault();
    if (!selectedDate) return;

    setLeaves((prev) => ({
      ...prev,
      [selectedDate]: leaveType,
    }));
    setSelectedDate('');
  };

  // Delete Leave
  const handleDeleteLeave = (dateKey) => {
    setLeaves((prev) => {
      const updated = { ...prev };
      delete updated[dateKey];
      return updated;
    });
  };

  // Generate Calendar Days Data
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null); // Blank slots before day 1
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push(d);
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-['Plus_Jakarta_Sans']">
      
      {/* Sidebar - Matching Screenshot */}
      <aside className="w-64 bg-[#0B0F19] text-white p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg">
              Y
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">Your Learning</h1>
              <p className="text-xs text-slate-400">Portal System</p>
            </div>
          </div>

          <nav className="space-y-2">
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/50 transition">
              Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              Attendance & Calendar
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/50 transition">
              Settings
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* Header User Card */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Welcome, Sanju</h2>
            <p className="text-xs text-slate-500 mt-1">EMP ID 0079 | Joined: 2023-01-01</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
            ✓ Marked Present Today
          </div>
        </div>

        {/* 2-Column Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Side: Form & Active Leaves List */}
          <div className="space-y-6">
            
            {/* Apply Leave Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 text-base">Apply Leave</h3>
              <form onSubmit={handleApplyLeave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Leave Type
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition"
                  >
                    <option value="planned">Planned Leave (Yellow)</option>
                    <option value="casual">Casual Leave (Orange)</option>
                    <option value="sick">Sick Leave (Red)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition shadow-lg shadow-indigo-600/20"
                >
                  Apply & Highlight Calendar
                </button>
              </form>
            </div>

            {/* Active Leaves Log with DELETE BUTTON */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 text-base">Applied Leaves Log</h3>
              {Object.keys(leaves).length === 0 ? (
                <p className="text-xs text-slate-400">No leaves applied yet.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {Object.entries(leaves).map(([date, type]) => (
                    <div
                      key={date}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-700 block">{date}</span>
                        <span className="capitalize text-slate-500">{type} Leave</span>
                      </div>
                      <button
                        onClick={() => handleDeleteLeave(date)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Side: Dynamic Calendar Grid */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <span className="text-xs text-slate-400 font-medium">Live Attendance Calendar</span>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-2 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-xs font-bold text-slate-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="h-20 bg-slate-50/40 rounded-xl"></div>;
                }

                const formattedDay = String(day).padStart(2, '0');
                const formattedMonth = String(currentMonth + 1).padStart(2, '0');
                const dateKey = `${currentYear}-${formattedMonth}-${formattedDay}`;

                const appliedLeave = leaves[dateKey];
                const isToday = day === today.getDate() && currentMonth === today.getMonth();

                return (
                  <div
                    key={day}
                    className={`h-20 p-2 rounded-xl border transition flex flex-col justify-between ${
                      appliedLeave
                        ? `${leaveColors[appliedLeave]} border`
                        : isToday
                        ? 'border-indigo-600 bg-indigo-50/30'
                        : 'border-slate-100 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                        {day}
                      </span>
                      {isToday && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      )}
                    </div>
                    {appliedLeave && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider block">
                        {appliedLeave}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}