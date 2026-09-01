import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mhiqoknxkwmbisjurhvs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaXFva254a3dtYmlzanVyaHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMjY2OTksImV4cCI6MjEwMzgwMjY5OX0.OlJeKPhziAYxTcwKDdJJhrobQIjW_wbFPu1UOjHWZps';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const playSoundEffect = (type) => {
  try {
    let soundUrl = '';
    if (type === 'submit') soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3';
    if (type === 'Approved') soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
    if (type === 'Rejected') soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2873/2873-preview.mp3';

    if (soundUrl) {
      const audio = new Audio(soundUrl);
      audio.play().catch(() => {});
    }
  } catch (e) {}
};

export default function App() {
  const [hrActionState, setHrActionState] = useState(null);
  const [hrActionDetails, setHrActionDetails] = useState({ status: '', leaveId: '' });

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('ylp_isLoggedIn') === 'true');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const [clQuota, setClQuota] = useState(() => Number(localStorage.getItem('ylp_cl_quota')) || 12);
  
  const [carryForwardHistory, setCarryForwardHistory] = useState(() => {
    const saved = localStorage.getItem('ylp_cl_carry_history');
    return saved ? JSON.parse(saved) : [
      { id: 1, year: '2024', days: 10 },
      { id: 2, year: '2025', days: 30 }
    ];
  });

  const [cfYearInput, setCfYearInput] = useState('2025');
  const [cfDaysInput, setCfDaysInput] = useState('');

  const clCarryForward = carryForwardHistory.reduce((acc, curr) => acc + Number(curr.days || 0), 0);

  const [slQuota, setSlQuota] = useState(() => Number(localStorage.getItem('ylp_sl_quota')) || 6);
  const [sabbaticalQuota, setSabbaticalQuota] = useState(() => Number(localStorage.getItem('ylp_sabbatical_quota')) || 30);

  const totalAvailableCL = clQuota + clCarryForward;
  const [hrEmailAddress, setHrEmailAddress] = useState(() => localStorage.getItem('ylp_hr_email') || 'sanju@yourlearnings.com');

  const [isSendingMail, setIsSendingMail] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentMailData, setCurrentMailData] = useState(null);

  const [appliedLeaves, setAppliedLeaves] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [reminderSentMap, setReminderSentMap] = useState({});

  const prevLeavesMapRef = useRef({});

  const [companyHolidays, setCompanyHolidays] = useState(() => {
    const saved = localStorage.getItem('ylp_holidays');
    return saved ? JSON.parse(saved) : [
      { id: 1, date: '2026-01-26', title: 'Republic Day' },
      { id: 2, date: '2026-08-15', title: 'Independence Day' },
      { id: 3, date: '2026-10-02', title: 'Gandhi Jayanti' },
      { id: 4, date: '2026-12-25', title: 'Christmas' }
    ];
  });

  const [leaveCategory, setLeaveCategory] = useState('CL');
  const [dateMode, setDateMode] = useState('single');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const [holidayDate, setHolidayDate] = useState('');
  const [holidayTitle, setHolidayTitle] = useState('');

  const [extraWorkDate, setExtraWorkDate] = useState('');
  const [extraWorkReason, setExtraWorkReason] = useState('');

  const VALID_USER = 'Sanju';
  const VALID_PASS = 'Admin@321';
  const JOINING_DATE = '2023-01-01';

  const checkThreeYearsCompleted = (joinDateStr) => {
    const joinDate = new Date(joinDateStr);
    const currentDate = new Date();
    const diffInDays = (currentDate.getTime() - joinDate.getTime()) / (1000 * 3600 * 24);
    return diffInDays >= 1095;
  };

  const isSabbaticalEligible = checkThreeYearsCompleted(JOINING_DATE);

  const currentUser = {
    name: 'Sanju',
    employeeId: 'EMP ID 0079',
    joiningDate: JOINING_DATE,
    role: `Operations Lead (${isSabbaticalEligible ? '3+ Yrs Tenure' : 'Under 3 Yrs Tenure'})`
  };

  const triggerPartyPopper = () => {
    playSoundEffect('submit');
    if (window.confetti) {
      window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  const fetchPortalSettings = async () => {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
    if (!error && data) {
      if (data.cl_quota !== undefined) setClQuota(data.cl_quota);
      if (data.sl_quota !== undefined) setSlQuota(data.sl_quota);
      if (data.sabbatical_quota !== undefined) setSabbaticalQuota(data.sabbatical_quota);
      if (data.hr_email) setHrEmailAddress(data.hr_email);
      if (data.carry_forward) setCarryForwardHistory(data.carry_forward);
    }
  };

  const saveSettingsToDB = async (updatedObj) => {
    const payload = {
      id: 1,
      cl_quota: updatedObj.clQuota ?? clQuota,
      sl_quota: updatedObj.slQuota ?? slQuota,
      sabbatical_quota: updatedObj.sabbaticalQuota ?? sabbaticalQuota,
      hr_email: updatedObj.hrEmail ?? hrEmailAddress,
      carry_forward: updatedObj.carryForward ?? carryForwardHistory
    };
    await supabase.from('settings').upsert([payload]);
  };

  const fetchLeaves = async (showLoading = false) => {
    if (showLoading) setIsFetchingData(true);
    
    const { data, error } = await supabase
      .from('leaves')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      data.forEach(item => {
        const prevStatus = prevLeavesMapRef.current[item.id];
        if (prevStatus && prevStatus !== item.status) {
          if (item.status === 'Approved') playSoundEffect('Approved');
          if (item.status === 'Rejected') playSoundEffect('Rejected');
        }
      });

      const newMap = {};
      data.forEach(item => {
        newMap[item.id] = item.status;
      });
      prevLeavesMapRef.current = newMap;

      setAppliedLeaves(data);
      const now = new Date();
      setLastSyncedTime(now.toLocaleTimeString());
    }

    if (showLoading) {
      setTimeout(() => setIsFetchingData(false), 400);
    }
  };

  const fetchAttendance = async () => {
    const { data, error } = await supabase.from('attendance').select('*').order('date', { ascending: false });
    if (!error && data) {
      setAttendanceRecords(data);
    }
  };

  useEffect(() => {
    const handleUrlAction = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const rawLeaveId = urlParams.get('id');

      if (action && rawLeaveId) {
        setHrActionState('processing');
        const targetStatus = action === 'approve' ? 'Approved' : 'Rejected';
        const leaveId = Number(rawLeaveId);

        const { data: existingLeave, error: fetchErr } = await supabase
          .from('leaves')
          .select('status')
          .eq('id', leaveId)
          .maybeSingle();

        if (fetchErr || !existingLeave) {
          setHrActionState('error');
          return;
        }

        if (existingLeave.status !== 'Pending HR Approval') {
          setHrActionState('already_done');
          setHrActionDetails({ status: existingLeave.status, leaveId });
          return;
        }

        const { error: updateErr } = await supabase
          .from('leaves')
          .update({ status: targetStatus })
          .eq('id', leaveId);

        if (!updateErr) {
          setHrActionState('success');
          setHrActionDetails({ status: targetStatus, leaveId });
        } else {
          setHrActionState('error');
        }
      }
    };

    handleUrlAction();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchLeaves();
      fetchAttendance();
      fetchPortalSettings();

      const pollInterval = setInterval(() => {
        fetchLeaves(false);
        fetchAttendance();
      }, 5000);

      return () => clearInterval(pollInterval);
    }
  }, [isLoggedIn]);

  const bgImages = [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80"
  ];
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      const timer = setInterval(() => {
        setBgIndex((prev) => (prev + 1) % bgImages.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [isLoggedIn]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceRecords.find(r => r.date === todayStr);

  const markTodayAttendance = async () => {
    const today = new Date();
    const dayNum = today.getDay();
    const isWeekend = dayNum === 0 || dayNum === 6;

    const payload = {
      date: todayStr,
      status: 'Present',
      type: isWeekend ? 'Extra Weekend Work' : 'Regular Workday',
      note: isWeekend ? 'Weekend Duty' : 'Standard Present'
    };

    await supabase.from('attendance').upsert([payload], { onConflict: 'date' });
    fetchAttendance();
    alert("✓ Today's Attendance Marked Successfully!");
  };

  const handleAddExtraWork = async (e) => {
    e.preventDefault();
    if (!extraWorkDate) return alert("Select Date");
    
    const payload = {
      date: extraWorkDate,
      status: 'Present',
      type: 'Extra Working Day',
      note: extraWorkReason || 'Overtime / Weekend Work'
    };

    await supabase.from('attendance').upsert([payload], { onConflict: 'date' });
    setExtraWorkDate('');
    setExtraWorkReason('');
    fetchAttendance();
    alert("Extra Working Day Logged!");
  };

  const usedCL = appliedLeaves.filter(i => i.category === 'CL' && i.status === 'Approved').reduce((s, i) => s + (i.days_count || 1), 0);
  const usedSL = appliedLeaves.filter(i => i.category === 'SL' && i.status === 'Approved').reduce((s, i) => s + (i.days_count || 1), 0);
  const usedSabbatical = appliedLeaves.filter(i => i.category === 'Sabbatical' && i.status === 'Approved').reduce((s, i) => s + (i.days_count || 1), 0);

  const remainingCL = totalAvailableCL - usedCL;
  const remainingSL = slQuota - usedSL;
  const remainingSabbatical = sabbaticalQuota - usedSabbatical;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthAttendance = attendanceRecords.filter(r => {
    const d = new Date(r.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && r.status === 'Present';
  });

  const extraDaysCount = currentMonthAttendance.filter(r => r.type === 'Extra Working Day' || r.type === 'Extra Weekend Work').length;

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    const formattedReason = leaveReason ? leaveReason.trim() : '';
    if (!formattedReason) return alert("Reason is mandatory!");

    let count = 1;
    let dateStr = '';

    if (dateMode === 'single') {
      if (!singleDate) return alert('Please select a date');
      dateStr = singleDate;
      count = 1;
    } else {
      if (!startDate || !endDate) return alert('Select both dates');
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      if (d2 < d1) return alert('End Date must be after Start Date');
      count = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
      dateStr = `${startDate} to ${endDate}`;
    }

    if (leaveCategory === 'CL' && count > remainingCL) return alert(`Insufficient CL Balance! Available: ${remainingCL}`);
    if (leaveCategory === 'SL' && count > remainingSL) return alert(`Insufficient SL Balance! Available: ${remainingSL}`);
    if (leaveCategory === 'Sabbatical' && count > remainingSabbatical) return alert(`Insufficient Sabbatical Balance!`);

    const { data, error } = await supabase
      .from('leaves')
      .insert([{ category: leaveCategory, date_str: dateStr, days_count: count, reason: formattedReason, status: 'Pending HR Approval' }])
      .select();

    if (error || !data) return alert("Failed to save to Database.");

    const insertedRecord = data[0];
    const baseUrl = window.location.origin + window.location.pathname;

    const emailPayload = {
      employee_name: currentUser.name,
      employee_id: currentUser.employeeId,
      leave_type: leaveCategory,
      leave_date: dateStr,
      days_count: count,
      reason: formattedReason,
      hr_email: hrEmailAddress,
      approve_link: `${baseUrl}?action=approve&id=${insertedRecord.id}`,
      reject_link: `${baseUrl}?action=reject&id=${insertedRecord.id}`
    };

    setCurrentMailData(emailPayload);
    triggerPartyPopper();
    setShowSuccessModal(true);

    if (window.emailjs) {
      setIsSendingMail(true);
      window.emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', emailPayload)
        .then(() => setIsSendingMail(false))
        .catch(() => setIsSendingMail(false));
    }

    setSingleDate('');
    setStartDate('');
    setEndDate('');
    setLeaveReason('');
    fetchLeaves(true);
  };

  const handleAddCarryForward = (e) => {
    e.preventDefault();
    if (!cfDaysInput) return;
    const updatedList = [...carryForwardHistory, { id: Date.now(), year: cfYearInput, days: Number(cfDaysInput) }];
    setCarryForwardHistory(updatedList);
    saveSettingsToDB({ carryForward: updatedList });
    setCfDaysInput('');
  };

  const handleRemoveCF = (id) => {
    const updatedList = carryForwardHistory.filter(item => item.id !== id);
    setCarryForwardHistory(updatedList);
    saveSettingsToDB({ carryForward: updatedList });
  };

  const handleAddHoliday = (e) => {
    e.preventDefault();
    if (!holidayDate || !holidayTitle) return;
    const newList = [...companyHolidays, { id: Date.now(), date: holidayDate, title: holidayTitle }];
    setCompanyHolidays(newList);
    localStorage.setItem('ylp_holidays', JSON.stringify(newList));
    setHolidayDate('');
    setHolidayTitle('');
  };

  const handleDeleteHoliday = (id) => {
    const newList = companyHolidays.filter(item => item.id !== id);
    setCompanyHolidays(newList);
    localStorage.setItem('ylp_holidays', JSON.stringify(newList));
  };

  const sendDay2Reminder = async (leave) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const reminderPayload = {
      employee_name: currentUser.name,
      employee_id: currentUser.employeeId,
      leave_type: leave.category,
      leave_date: leave.date_str,
      days_count: leave.days_count,
      reason: leave.reason,
      hr_email: hrEmailAddress,
      approve_link: `${baseUrl}?action=approve&id=${leave.id}`,
      reject_link: `${baseUrl}?action=reject&id=${leave.id}`
    };

    if (window.emailjs) {
      window.emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', reminderPayload)
        .then(() => {
          setReminderSentMap(prev => ({ ...prev, [leave.id]: true }));
          alert(`Reminder sent to HR for Leave #${leave.id}`);
        })
        .catch(() => alert('Failed to send reminder via EmailJS'));
    } else {
      alert(`Reminder Simulated for Leave #${leave.id}`);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (usernameInput.trim().toLowerCase() === VALID_USER.toLowerCase() && passwordInput === VALID_PASS) {
      setIsLoggedIn(true);
      localStorage.setItem('ylp_isLoggedIn', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid Username or Password!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('ylp_isLoggedIn');
  };

  if (hrActionState) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(79,70,229,0.3)]">
          {hrActionState === 'processing' && <p className="text-slate-300 font-bold text-sm">Processing response...</p>}
          {hrActionState === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center text-3xl mx-auto font-black">✓</div>
              <h2 className="text-2xl font-black text-white">Action Completed!</h2>
              <p className="text-sm text-slate-300 font-medium">Leave Request #{hrActionDetails.leaveId} marked as {hrActionDetails.status}.</p>
            </div>
          )}
          {hrActionState === 'already_done' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full flex items-center justify-center text-3xl mx-auto font-black">🔒</div>
              <h2 className="text-xl font-bold text-white">Already Processed</h2>
              <p className="text-xs text-slate-400">Status: {hrActionDetails.status}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- LOGIN VIEW ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#05060f] p-4 relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-tr from-indigo-900/40 via-purple-900/30 to-blue-900/20 rounded-full blur-[160px] pointer-events-none z-0"></div>

        <div className="w-full max-w-4xl bg-[#0e1322]/90 backdrop-blur-xl rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col md:flex-row relative z-10">
          <div className="w-full md:w-1/2 relative flex flex-col justify-between p-6 md:p-10 text-white overflow-hidden min-h-[300px] md:min-h-[460px]">
            {bgImages.map((img, i) => (
              <div
                key={i}
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                  i === bgIndex ? 'opacity-70 scale-100' : 'opacity-0 scale-100'
                }`}
                style={{ backgroundImage: `url(${img})` }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/40 to-transparent z-[1]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-4 border border-white/15">
                Corporate Workspace
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow">
                Your Learning Portal
              </h2>
            </div>

            <div className="relative z-10 text-[11px] font-bold tracking-widest text-indigo-300 uppercase mt-4 md:mt-0">
              5-DAY WORK WEEK & LEAVE PORTAL
            </div>
          </div>

          <div className="w-full md:w-1/2 bg-[#090d16] p-6 md:p-10 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/10 relative z-10">
            <div className="mb-6">
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">Sign In</h3>
              <p className="text-slate-400 text-xs font-semibold mt-1">Enter credentials for Your Learning Portal</p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold">
                ⚠️ {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">USERNAME</label>
                <input 
                  type="text" 
                  required
                  placeholder="Sanju"
                  value={usernameInput} 
                  onChange={e => setUsernameInput(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white text-sm font-semibold transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">PASSWORD</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={passwordInput} 
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white text-sm font-semibold transition"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition text-sm mt-2"
              >
                Access Account
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD (AFTER LOGIN)
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-100 font-sans overflow-x-hidden">
      <aside className="w-full md:w-64 bg-slate-950 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 relative z-50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-extrabold text-white text-lg">Your Learning</h1>
              <p className="text-[10px] text-indigo-400 font-bold">5-Day Work Week System</p>
            </div>
            <button onClick={handleLogout} className="text-xs bg-rose-500/20 text-rose-300 px-2 py-1 rounded font-bold border border-rose-500/30">Logout</button>
          </div>
          
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-900'}`}>📊 Dashboard</button>
            <button onClick={() => setActiveTab('attendance')} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'attendance' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-900'}`}>🕒 Attendance & Work Log</button>
            <button onClick={() => setActiveTab('calendar')} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'calendar' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-900'}`}>📅 Leave Management</button>
            <button onClick={() => setActiveTab('holidays')} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'holidays' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-900'}`}>🎉 Holiday Calendar</button>
            <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-900'}`}>⚙️ Quotas & Settings</button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-900 bg-slate-900/50 text-[11px]">
          <p className="font-bold text-slate-400">{currentUser.name}</p>
          <p className="text-slate-500">{currentUser.employeeId}</p>
        </div>
      </aside>

      <main className="flex-1 w-full max-w-full p-4 md:p-8 overflow-y-auto min-w-0 relative z-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Welcome, {currentUser.name}</h1>
            <p className="text-xs text-slate-500 font-bold mt-0.5">{currentUser.role} | Monday-Friday Work Week</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchLeaves(true)} className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100">
              🔄 Sync ({lastSyncedTime || 'Now'})
            </button>
            <button onClick={markTodayAttendance} disabled={!!todayRecord} className={`px-4 py-2 rounded-xl font-bold text-xs ${todayRecord ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
              {todayRecord ? '✓ Marked Today Present' : '📍 Mark Attendance Today'}
            </button>
          </div>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">MONTHLY PRESENTS</p>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-3xl font-black text-emerald-600">{currentMonthAttendance.length}</span>
                  <span className="text-xs text-slate-400 font-bold">Days Recorded</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">EXTRA WORK DAYS</p>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-3xl font-black text-amber-600">{extraDaysCount}</span>
                  <span className="text-xs text-slate-400 font-bold">Weekend Working</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">CL REMAINING</p>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-3xl font-black text-indigo-600">{remainingCL}</span>
                  <span className="text-xs text-slate-400 font-bold">of {totalAvailableCL}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase">SL REMAINING</p>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-3xl font-black text-rose-500">{remainingSL}</span>
                  <span className="text-xs text-slate-400 font-bold">of {slQuota}</span>
                </div>
              </div>
            </div>

            {/* Recent Leaves Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Leave Applications</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-slate-400 font-bold uppercase">
                      <th className="py-2">Date / Range</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Days</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Action / Reminder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appliedLeaves.map(leave => (
                      <tr key={leave.id}>
                        <td className="py-3 font-bold text-slate-900">{leave.date_str}</td>
                        <td className="py-3 font-semibold text-slate-600">{leave.category}</td>
                        <td className="py-3 font-bold">{leave.days_count}</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                            leave.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {leave.status === 'Pending HR Approval' && (
                            <button 
                              onClick={() => sendDay2Reminder(leave)} 
                              disabled={reminderSentMap[leave.id]}
                              className="text-[10px] bg-slate-900 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50"
                            >
                              {reminderSentMap[leave.id] ? '✓ Reminder Sent' : '🔔 Day-2 Reminder'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Attendance History Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-slate-400 font-bold uppercase">
                      <th className="py-2">Date</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Work Type</th>
                      <th className="py-2">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceRecords.map(r => (
                      <tr key={r.id || r.date}>
                        <td className="py-3 font-bold">{r.date}</td>
                        <td className="py-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">{r.status}</span></td>
                        <td className="py-3 font-semibold text-slate-600">{r.type}</td>
                        <td className="py-3 text-slate-500">{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Log Extra Weekend Working</h3>
              <form onSubmit={handleAddExtraWork} className="space-y-3">
                <input type="date" value={extraWorkDate} onChange={e => setExtraWorkDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold" />
                <input type="text" placeholder="Reason (e.g. Urgent Saturday Work)" value={extraWorkReason} onChange={e => setExtraWorkReason(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold" />
                <button type="submit" className="w-full py-2.5 bg-amber-600 text-white font-bold rounded-xl text-xs">Log Extra Work Day</button>
              </form>
            </div>
          </div>
        )}

        {/* LEAVE MANAGEMENT TAB */}
        {activeTab === 'calendar' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Apply Leave Request</h3>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input type="radio" checked={dateMode === 'single'} onChange={() => setDateMode('single')} /> Single Day
                </label>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input type="radio" checked={dateMode === 'range'} onChange={() => setDateMode('range')} /> Date Range
                </label>
              </div>

              <select value={leaveCategory} onChange={e => setLeaveCategory(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold">
                <option value="CL">Casual Leave (CL)</option>
                <option value="SL">Sick Leave (SL)</option>
                {isSabbaticalEligible && <option value="Sabbatical">Sabbatical Leave (3+ Yrs Eligible)</option>}
              </select>

              {dateMode === 'single' ? (
                <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold" />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold" />
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold" />
                </div>
              )}

              <textarea placeholder="Reason for leave..." value={leaveReason} onChange={e => setLeaveReason(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold" />
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs">Submit Leave Request</button>
            </form>
          </div>
        )}

        {/* HOLIDAYS TAB */}
        {activeTab === 'holidays' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Company Holidays List</h3>
              <div className="space-y-2">
                {companyHolidays.map(h => (
                  <div key={h.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{h.title}</p>
                      <p className="text-slate-500">{h.date}</p>
                    </div>
                    <button onClick={() => handleDeleteHoliday(h.id)} className="text-rose-500 font-bold hover:underline">Delete</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Add New Holiday</h3>
              <form onSubmit={handleAddHoliday} className="space-y-3">
                <input type="date" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold" />
                <input type="text" placeholder="Holiday Title" value={holidayTitle} onChange={e => setHolidayTitle(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold" />
                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs">Add Holiday</button>
              </form>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Leave Quotas & Carry-Forward</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-600">Annual CL Quota</label>
                  <input type="number" value={clQuota} onChange={e => { setClQuota(Number(e.target.value)); saveSettingsToDB({ clQuota: Number(e.target.value) }); }} className="w-full p-2.5 bg-slate-50 border rounded-xl mt-1 font-bold" />
                </div>
                <div>
                  <label className="font-bold text-slate-600">Annual SL Quota</label>
                  <input type="number" value={slQuota} onChange={e => { setSlQuota(Number(e.target.value)); saveSettingsToDB({ slQuota: Number(e.target.value) }); }} className="w-full p-2.5 bg-slate-50 border rounded-xl mt-1 font-bold" />
                </div>
                <div>
                  <label className="font-bold text-slate-600">HR Email Address</label>
                  <input type="email" value={hrEmailAddress} onChange={e => { setHrEmailAddress(e.target.value); saveSettingsToDB({ hrEmail: e.target.value }); }} className="w-full p-2.5 bg-slate-50 border rounded-xl mt-1 font-bold" />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-bold text-slate-900 text-xs mb-3">Add Carry-Forward Leaves</h4>
              <form onSubmit={handleAddCarryForward} className="flex gap-2 mb-4">
                <input type="text" placeholder="Year (2025)" value={cfYearInput} onChange={e => setCfYearInput(e.target.value)} className="w-1/3 p-2 bg-slate-50 border rounded-xl text-xs font-bold" />
                <input type="number" placeholder="Days" value={cfDaysInput} onChange={e => setCfDaysInput(e.target.value)} className="w-1/3 p-2 bg-slate-50 border rounded-xl text-xs font-bold" />
                <button type="submit" className="w-1/3 bg-indigo-600 text-white font-bold rounded-xl text-xs">Add CF</button>
              </form>

              <div className="space-y-2">
                {carryForwardHistory.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg text-xs font-semibold">
                    <span>Year {item.year}: {item.days} Days</span>
                    <button onClick={() => handleRemoveCF(item.id)} className="text-rose-500 font-bold">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto">✓</div>
            <h3 className="text-lg font-bold text-slate-900">Application Submitted!</h3>
            <p className="text-xs text-slate-500">Your leave request has been saved and sent to HR for approval.</p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}