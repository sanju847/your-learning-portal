import React, { useState } from 'react';

// Holiday Data Array (2026)
const holidaysData = [
  { date: '2026-01-26', name: 'Republic Day', type: 'Gazetted', icon: 'fa-flag' },
  { date: '2026-03-04', name: 'Maha Shivratri', type: 'Restricted', icon: 'fa-om' },
  { date: '2026-03-25', name: 'Holi', type: 'Gazetted', icon: 'fa-palette' },
  { date: '2026-04-02', name: 'Good Friday', type: 'Gazetted', icon: 'fa-cross' },
  { date: '2026-04-14', name: 'Ambedkar Jayanti', type: 'Optional', icon: 'fa-book-open' },
  { date: '2026-05-01', name: 'May Day', type: 'Optional', icon: 'fa-briefcase' },
  { date: '2026-08-15', name: 'Independence Day', type: 'Gazetted', icon: 'fa-dove' },
  { date: '2026-08-28', name: 'Raksha Bandhan', type: 'Restricted', icon: 'fa-heart' },
  { date: '2026-09-04', name: 'Janmashtami', type: 'Restricted', icon: 'fa-spa' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'Gazetted', icon: 'fa-glasses' },
  { date: '2026-10-20', name: 'Dussehra', type: 'Gazetted', icon: 'fa-bow-arrow' },
  { date: '2026-11-08', name: 'Diwali', type: 'Gazetted', icon: 'fa-lightbulb' },
  { date: '2026-11-09', name: 'Govardhan Puja', type: 'Restricted', icon: 'fa-mountain' },
  { date: '2026-11-23', name: 'Guru Nanak Jayanti', type: 'Gazetted', icon: 'fa-sun' },
  { date: '2026-12-25', name: 'Christmas', type: 'Gazetted', icon: 'fa-tree' }
];

const typeStyles = {
  Gazetted: {
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    border: 'border-emerald-200',
    calBg: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold',
    calLabel: 'bg-emerald-600 text-white'
  },
  Restricted: {
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    border: 'border-amber-200',
    calBg: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
    calLabel: 'bg-amber-500 text-white'
  },
  Optional: {
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
    border: 'border-indigo-200',
    calBg: 'bg-indigo-50 text-indigo-900 border-indigo-300 font-bold',
    calLabel: 'bg-indigo-600 text-white'
  }
};

export default function AttendancePortal() {
  // Store applied user leaves
  const [leaves, setLeaves] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [leaveType, setLeaveType] = useState('planned');
  
  // Dynamic Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // Default Oct 2026
  const [searchTerm, setSearchTerm] = useState('');
  const [synced, setSynced] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevTotalDays = new Date(year, month, 0).getDate();

  // Add / Apply Leave Handler
  const handleApplyLeave = (e) => {
    e.preventDefault();
    if (!selectedDate) return;

    setLeaves((prev) => ({
      ...prev,
      [selectedDate]: leaveType,
    }));
    setSelectedDate('');
  };

  // Sync Calendar Handler Action
  const handleSyncCalendar = () => {
    setSynced(true);
    setTimeout(() => setSynced(false), 2000);
  };

  const filteredHolidays = holidaysData.filter((h) =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.date.includes(searchTerm)
  );

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <i className="fa-solid fa-calendar-check text-2xl text-amber-400"></i>
              <span className="font-bold text-xl tracking-wide">HolidayPortal</span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Sync Calendar Button */}
              <button
                onClick={handleSyncCalendar}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"
              >
                <i className={`fa-solid ${synced ? 'fa-check' : 'fa-rotate'} text-xs`}></i>
                {synced ? 'Synced!' : 'Sync Calendar'}
              </button>

              {/* Apply Leave Button */}
              <button 
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                <i className="fa-solid fa-plus text-xs"></i> Apply Leave
              </button>

              <div className="flex items-center space-x-2 border-l border-indigo-500 pl-3">
                <img className="h-9 w-9 rounded-full object-cover border-2 border-amber-400" src="https://ui-avatars.com/api/?name=User+Admin&background=random" alt="User avatar" />
                <span className="text-sm font-medium hidden sm:inline">Rahul Sharma</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Leave Application Modal/Form Inline */}
        {selectedDate && (
          <form onSubmit={handleApplyLeave} className="bg-white p-4 rounded-xl border border-indigo-200 shadow-sm flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Date:</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Type:</label>
              <select 
                value={leaveType} 
                onChange={(e) => setLeaveType(e.target.value)}
                className="text-xs p-2 border border-slate-300 rounded-lg"
              >
                <option value="planned">Planned Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="sick">Sick Leave</option>
              </select>
            </div>
            <button type="submit" className="bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg font-semibold">
              Save Leave
            </button>
            <button type="button" onClick={() => setSelectedDate('')} className="text-xs text-slate-400">
              Cancel
            </button>
          </form>
        )}

        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Holidays</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">15</h3>
            </div>
            <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xl">
              <i className="fa-solid fa-umbrella-beach"></i>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gazetted Holidays</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">09</h3>
            </div>
            <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xl">
              <i className="fa-solid fa-flag"></i>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Restricted (RH)</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">04</h3>
            </div>
            <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center text-xl">
              <i className="fa-solid fa-star"></i>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Applied Leaves</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{Object.keys(leaves).length} Days</h3>
            </div>
            <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center text-xl">
              <i className="fa-solid fa-user-clock"></i>
            </div>
          </div>
        </section>

        {/* Interactive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Calendar View */}
          <section className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <i className="fa-regular fa-calendar-days text-indigo-600"></i>
                  <span>{monthNames[month]} {year}</span>
                </h2>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition border border-slate-200"
                  >
                    <i className="fa-solid fa-chevron-left text-xs"></i>
                  </button>
                  <button 
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200"
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition border border-slate-200"
                  >
                    <i className="fa-solid fa-chevron-right text-xs"></i>
                  </button>
                </div>
              </div>

              {/* Day Titles */}
              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-sm">
                {Array.from({ length: firstDayIndex }).map((_, index) => (
                  <div key={`prev-${index}`} className="h-24 p-1.5 border border-slate-100 rounded-lg text-slate-300 bg-slate-50/50 text-xs font-medium">
                    {prevTotalDays - firstDayIndex + index + 1}
                  </div>
                ))}

                {Array.from({ length: totalDays }).map((_, index) => {
                  const day = index + 1;
                  const formattedMonth = String(month + 1).padStart(2, '0');
                  const formattedDay = String(day).padStart(2, '0');
                  const dateString = `${year}-${formattedMonth}-${formattedDay}`;

                  const holiday = holidaysData.find((h) => h.date === dateString);
                  const style = holiday ? (typeStyles[holiday.type] || typeStyles.Optional) : null;
                  const appliedLeaveType = leaves[dateString];

                  return (
                    <div 
                      key={day} 
                      className={`h-24 p-1.5 border rounded-lg transition-all flex flex-col justify-between relative text-xs ${
                        holiday ? `${style.calBg} shadow-sm` : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{day}</span>
                        {appliedLeaveType && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" title={`Leave: ${appliedLeaveType}`}></span>
                        )}
                      </div>
                      {holiday && (
                        <div className={`mt-1 p-1 rounded ${style.calLabel} shadow-xs text-[10px] leading-tight font-medium overflow-hidden`}>
                          <div className="truncate font-semibold flex items-center gap-1">
                            <i className={`fa-solid ${holiday.icon} text-[9px]`}></i>
                            <span className="truncate">{holiday.name}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Gazetted
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Restricted (RH)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span> Optional / Casual
              </span>
            </div>
          </section>

          {/* Holiday List */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Upcoming Holidays</h2>
              <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2.5 py-1 rounded-full">2026 List</span>
            </div>

            <div className="relative mb-4">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input 
                type="text" 
                placeholder="Search festival or month..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="space-y-3 flex-grow overflow-y-auto max-h-[420px] pr-1">
              {filteredHolidays.map((h, i) => {
                const dateObj = new Date(h.date);
                const dayNum = dateObj.getDate();
                const monthName = dateObj.toLocaleString('en-US', { month: 'short' });
                const dayName = dateObj.toLocaleString('en-US', { weekday: 'short' });
                const style = typeStyles[h.type] || typeStyles.Optional;

                return (
                  <div 
                    key={i} 
                    onClick={() => setCurrentDate(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1))}
                    className={`p-3 rounded-xl border ${style.border} bg-white hover:shadow-md transition flex items-center justify-between cursor-pointer`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-700">
                        <span className="text-xs font-bold leading-none">{dayNum}</span>
                        <span className="text-[9px] uppercase font-semibold text-slate-400">{monthName}</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <i className={`fa-solid ${h.icon} text-slate-400 text-[10px]`}></i>
                          {h.name}
                        </h4>
                        <p className="text-[10px] text-slate-400">{dayName}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badgeBg} ${style.badgeText}`}>
                      {h.type}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}