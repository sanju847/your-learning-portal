import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mhiqoknxkwmbisjurhvs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaXFva254a3dtYmlzanVyaHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMjY2OTksImV4cCI6MjEwMzgwMjY5OX0.OlJeKPhziAYxTcwKDdJJhrobQIjW_wbFPu1UOjHWZps';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('ylp_isLoggedIn') === 'true';
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');

  // Leave Balances
  const [clQuota, setClQuota] = useState(() => Number(localStorage.getItem('ylp_cl_quota')) || 12);
  const [clCarryForward, setClCarryForward] = useState(() => Number(localStorage.getItem('ylp_cl_carry')) || 0);
  const [slQuota, setSlQuota] = useState(() => Number(localStorage.getItem('ylp_sl_quota')) || 6);
  const [sabbaticalQuota, setSabbaticalQuota] = useState(() => Number(localStorage.getItem('ylp_sabbatical_quota')) || 30);

  const totalAvailableCL = clQuota + clCarryForward;

  // HR Email Address
  const [hrEmailAddress, setHrEmailAddress] = useState(() => localStorage.getItem('ylp_hr_email') || 'sanju@yourlearnings.com');
  
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentMailData, setCurrentMailData] = useState(null);
  
  const [emailLogs, setEmailLogs] = useState(() => {
    const saved = localStorage.getItem('ylp_email_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Holidays
  const [companyHolidays, setCompanyHolidays] = useState(() => {
    const saved = localStorage.getItem('ylp_holidays');
    return saved ? JSON.parse(saved) : [
      { id: 1, date: '2026-01-26', title: 'Republic Day' },
      { id: 2, date: '2026-08-15', title: 'Independence Day' },
      { id: 3, date: '2026-10-02', title: 'Gandhi Jayanti' },
      { id: 4, date: '2026-12-25', title: 'Christmas' }
    ];
  });

  // Applied Leaves Logs
  const [appliedLeaves, setAppliedLeaves] = useState(() => {
    const saved = localStorage.getItem('ylp_applied_leaves');
    return saved ? JSON.parse(saved) : [];
  });

  // Form Controls
  const [leaveCategory, setLeaveCategory] = useState('CL');
  const [dateMode, setDateMode] = useState('single');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Holiday Form Controls
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayTitle, setHolidayTitle] = useState('');

  // PERMANENT CREDENTIALS
  const VALID_USER = 'Sanju';
  const VALID_PASS = 'Admin@321';
  const JOINING_DATE = '2023-01-01';

  // Check 3 Years Eligibility
  const checkThreeYearsCompleted = (joinDateStr) => {
    const joinDate = new Date(joinDateStr);
    const currentDate = new Date();
    const diffInTime = currentDate.getTime() - joinDate.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);
    return diffInDays >= 1095;
  };

  const isSabbaticalEligible = checkThreeYearsCompleted(JOINING_DATE);

  const currentUser = {
    name: 'Sanju',
    employeeId: 'EMP ID 0079',
    joiningDate: JOINING_DATE,
    role: `Operations Lead (${isSabbaticalEligible ? '3+ Yrs Tenure' : 'Under 3 Yrs Tenure'})`
  };

  // Database Fetch Function
  const fetchLeaves = async () => {
    const { data, error } = await supabase
      .from('leaves')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setAppliedLeaves(data);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchLeaves();
    }

    const handleEmailAction = async () => {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const leaveId = params.get('id');

      if (action && leaveId) {
        const newStatus = action === 'approve' ? 'Approved' : 'Rejected';

        const { error } = await supabase
          .from('leaves')
          .update({ status: newStatus })
          .eq('id', leaveId);

        if (!error) {
          alert(`Leave status updated to: ${newStatus}`);
          window.history.replaceState({}, document.title, window.location.pathname);
          fetchLeaves();
        }
      }
    };

    handleEmailAction();
  }, [isLoggedIn]);

  // Login Background Images
  const bgImages = [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80"
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

  // Local Storage Persistence
  useEffect(() => {
    localStorage.setItem('ylp_isLoggedIn', isLoggedIn ? 'true' : 'false');
    localStorage.setItem('ylp_cl_quota', clQuota.toString());
    localStorage.setItem('ylp_cl_carry', clCarryForward.toString());
    localStorage.setItem('ylp_sl_quota', slQuota.toString());
    localStorage.setItem('ylp_sabbatical_quota', sabbaticalQuota.toString());
    localStorage.setItem('ylp_holidays', JSON.stringify(companyHolidays));
    localStorage.setItem('ylp_applied_leaves', JSON.stringify(appliedLeaves));
    localStorage.setItem('ylp_email_logs', JSON.stringify(emailLogs));
    localStorage.setItem('ylp_hr_email', hrEmailAddress);
  }, [isLoggedIn, clQuota, clCarryForward, slQuota, sabbaticalQuota, companyHolidays, appliedLeaves, emailLogs, hrEmailAddress]);

  // Welcome Speech
  const speakWelcomeMessage = () => {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance("Welcome to login YL portal Sanju!");
      msg.rate = 0.95;
      msg.pitch = 1;
      window.speechSynthesis.speak(msg);
    }
  };

  // Leave Deductions
  const usedCL = appliedLeaves.filter(i => i.category === 'CL').reduce((s, i) => s + (i.daysCount || i.days_count || 1), 0);
  const usedSL = appliedLeaves.filter(i => i.category === 'SL').reduce((s, i) => s + (i.daysCount || i.days_count || 1), 0);
  const usedSabbatical = appliedLeaves.filter(i => i.category === 'Sabbatical').reduce((s, i) => s + (i.daysCount || i.days_count || 1), 0);

  const remainingCL = totalAvailableCL - usedCL;
  const remainingSL = slQuota - usedSL;
  const remainingSabbatical = sabbaticalQuota - usedSabbatical;

  // Real Email Dispatcher Function
  const sendRealMailToHR = async (mailPayload) => {
    setIsSendingMail(true);
    
    if (window.emailjs) {
      try {
        await window.emailjs.send(
          'service_ts2aotz',   // Service ID
          'template_odlpu7u',  // Template ID
          {
            to_email: hrEmailAddress,
            hr_email: hrEmailAddress,
            employee_name: currentUser.name,
            employee_id: currentUser.employeeId,
            leave_category: mailPayload.category,
            leave_dates: mailPayload.dateStr,
            days_count: mailPayload.daysCount,
            reason: mailPayload.reason,
            applied_date: mailPayload.sentDate,
            subject: mailPayload.subject,
            message: mailPayload.body,
            leave_id: mailPayload.leaveId
          },
          'O5FhcUXl6UTLrRv7n'    // Public Key
        );
        console.log(`Real email dispatched successfully to ${hrEmailAddress}!`);
      } catch (err) {
        console.error("EmailJS sending error:", err);
      }
    } else {
      console.warn("EmailJS SDK script tag missing in index.html");
    }
    
    setIsSendingMail(false);
  };

  // Login Handler
  const handleLogin = (e) => {
    e.preventDefault();
    if (usernameInput.trim().toLowerCase() === VALID_USER.toLowerCase() && passwordInput === VALID_PASS) {
      setIsLoggedIn(true);
      setLoginError('');
      setUsernameInput('');
      setPasswordInput('');
      speakWelcomeMessage();
    } else {
      setLoginError('Invalid Username or Password!');
    }
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    localStorage.setItem('ylp_isLoggedIn', 'false');
    setActiveTab('dashboard');
  };

  const triggerPartyPopper = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
      audio.play();
    } catch (err) {}

    if (window.confetti) {
      window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  // Apply Leave Handler
  const handleApplyLeave = async (e) => {
    e.preventDefault();

    let count = 1;
    let dateStr = '';

    if (dateMode === 'single') {
      if (!singleDate) return alert('Please select a date');
      dateStr = singleDate;
      count = 1;
    } else {
      if (!startDate || !endDate) return alert('Please select both start and end dates');
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      if (d2 < d1) return alert('End Date must be after Start Date');
      const diffTime = Math.abs(d2 - d1);
      count = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      dateStr = `${startDate} to ${endDate}`;
    }

    if (leaveCategory === 'Sabbatical' && !isSabbaticalEligible) {
      return alert('Sabbatical leave is locked! Minimum 3 years company tenure required.');
    }

    if (leaveCategory === 'CL' && count > remainingCL) return alert(`Insufficient CL Balance! Only ${remainingCL} Days Left.`);
    if (leaveCategory === 'SL' && count > remainingSL) return alert(`Insufficient SL Balance! Only ${remainingSL} Days Left.`);
    if (leaveCategory === 'Sabbatical' && count > remainingSabbatical) return alert(`Insufficient Sabbatical Balance! Only ${remainingSabbatical} Days Left.`);

    // Push to Supabase Database
    const { data, error } = await supabase
      .from('leaves')
      .insert([
        {
          category: leaveCategory,
          date_str: dateStr,
          days_count: count,
          reason: leaveReason || 'Personal Request',
          status: 'Pending HR Approval'
        }
      ])
      .select();

    const dbRecord = data && data[0] ? data[0] : null;
    const leaveId = dbRecord ? dbRecord.id : Date.now();

    const newRecord = {
      id: leaveId,
      category: leaveCategory,
      dateStr,
      daysCount: count,
      reason: leaveReason || 'Personal Request',
      status: 'Pending HR Approval'
    };

    setAppliedLeaves([newRecord, ...appliedLeaves]);

    const mailDraft = {
      id: Date.now(),
      leaveId: leaveId,
      to: hrEmailAddress,
      category: leaveCategory,
      daysCount: count,
      dateStr,
      reason: leaveReason || 'Personal Request',
      subject: `[LEAVE APPLICATION] - ${currentUser.name} (${leaveCategory} - ${count} Day(s))`,
      body: `Dear HR Team,\n\nI have submitted a leave request on the portal with details below:\n\n• Employee Name: ${currentUser.name} (${currentUser.employeeId})\n• Leave Type: ${leaveCategory}\n• Duration: ${dateStr} (${count} Day(s))\n• Reason: ${leaveReason || 'Personal Request'}\n\nKindly review and approve this application.\n\nBest Regards,\n${currentUser.name}\n${currentUser.role}`,
      sentDate: new Date().toLocaleDateString(),
      isReminderSent: false
    };

    await sendRealMailToHR(mailDraft);

    setEmailLogs([mailDraft, ...emailLogs]);
    setCurrentMailData(mailDraft);

    setSingleDate('');
    setStartDate('');
    setEndDate('');
    setLeaveReason('');

    triggerPartyPopper();
    setShowSuccessModal(true);
    fetchLeaves();
  };

  const handleDeleteLeave = async (id) => {
    if (window.confirm('Remove this leave entry and restore balance?')) {
      await supabase.from('leaves').delete().eq('id', id);
      setAppliedLeaves(appliedLeaves.filter(i => i.id !== id));
      setEmailLogs(emailLogs.filter(i => i.leaveId !== id));
    }
  };

  const handleSendReminderMail = async (emailItem) => {
    setIsSendingMail(true);
    await sendRealMailToHR({
      ...emailItem,
      subject: `[DAY-2 ESCALATION REMINDER] Pending Leave Approval - ${currentUser.name}`
    });
    
    setEmailLogs(emailLogs.map(item => {
      if (item.id === emailItem.id) {
        return {
          ...item,
          isReminderSent: true,
          reminderSubject: `[DAY-2 ESCALATION REMINDER] Pending Leave Approval - ${currentUser.name}`
        };
      }
      return item;
    }));
    setIsSendingMail(false);
    alert(`Day-2 Escalation Reminder Real Email Sent to ${hrEmailAddress}!`);
  };

  const handleAddHoliday = (e) => {
    e.preventDefault();
    if (!holidayDate || !holidayTitle) return;
    setCompanyHolidays([...companyHolidays, { id: Date.now(), date: holidayDate, title: holidayTitle }]);
    setHolidayDate('');
    setHolidayTitle('');
  };

  const handleDeleteHoliday = (id) => {
    if (window.confirm('Remove this holiday entry?')) {
      setCompanyHolidays(companyHolidays.filter(i => i.id !== id));
    }
  };

  // ---------------- LOGIN PAGE ----------------
  if (!isLoggedIn) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
        <div className="w-full max-w-5xl h-[580px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-800 relative z-10">
          
          <div className="w-full md:w-1/2 relative bg-indigo-950 flex flex-col justify-between p-10 text-white overflow-hidden">
            {bgImages.map((img, i) => (
              <div
                key={i}
                className={`bg-slide absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === bgIndex ? 'opacity-40 scale-105' : 'opacity-0 scale-100'}`}
                style={{ backgroundImage: `url(${img})` }}
              />
            ))}

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-4 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Corporate Workspace
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight">Your Learning Portal</h2>
              <p className="text-indigo-200 text-sm mt-3 leading-relaxed">
                Seamless leave tracking, custom holiday management, and employee profile dashboard.
              </p>
            </div>

            <div className="relative z-10 text-xs text-indigo-300 font-medium">
              Enterprise Attendance System
            </div>
          </div>

          <div className="w-full md:w-1/2 bg-white p-10 flex flex-col justify-center">
            <div className="mb-8">
              <h3 className="text-3xl font-extrabold text-slate-900">Sign In</h3>
              <p className="text-slate-500 text-xs mt-1">Enter your work credentials to continue.</p>
            </div>

            {loginError && (
              <div className="mb-5 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
                ⚠️ {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Employee Username</label>
                <input 
                  type="text" 
                  required
                  placeholder="Sanju"
                  value={usernameInput} 
                  onChange={e => setUsernameInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-semibold transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={passwordInput} 
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-semibold transition"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500/90 text-white font-bold rounded-xl shadow-lg transition-all border border-white/20 text-sm mt-2"
              >
                Access Account
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // ---------------- PORTAL MAIN PAGE ----------------
  return (
    <div className="w-screen h-screen flex bg-slate-100 overflow-hidden relative">
      
      {/* Zoom Popup with Mail Status */}
      {showSuccessModal && currentMailData && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold">
                ✉️
              </div>
              <div className="text-left">
                <h3 className="text-lg font-extrabold text-slate-900">Leave Submitted & Email Dispatched</h3>
                <p className="text-xs text-slate-500 font-semibold">Real email notification sent to HR ({currentMailData.to})</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left font-mono text-xs text-slate-700 space-y-2 max-h-56 overflow-y-auto">
              <p><strong>To HR Email:</strong> {currentMailData.to}</p>
              <p><strong>Subject:</strong> {currentMailData.subject}</p>
              <p><strong>Reason:</strong> {currentMailData.reason}</p>
              <hr className="border-slate-200 my-2" />
              <p className="whitespace-pre-line font-sans text-xs leading-relaxed text-slate-600">{currentMailData.body}</p>
            </div>

            <div className="mt-6">
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg border border-white/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-72 h-full bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">Y</div>
            <div>
              <h1 className="font-extrabold text-white text-base leading-tight">Your Learning</h1>
              <span className="text-xs text-indigo-400 font-medium">Portal System</span>
            </div>
          </div>
          
          <nav className="p-4 space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              📊 Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition ${activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              📅 Calendar & Apply Leave
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              ⚙️ Annual Quota & HR Email
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleSignOut}
            className="w-full py-3 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white font-bold rounded-xl text-sm transition border border-red-600/20"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 h-full p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 pb-5 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Welcome, {currentUser.name}</h1>
            <p className="text-sm text-slate-500 font-semibold mt-0.5">{currentUser.employeeId} | Joined: {currentUser.joiningDate}</p>
          </div>
          <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
            Active Member Status
          </div>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">CASUAL LEAVE (CL)</p>
                <div className="flex justify-between items-end">
                  <span className="text-4xl font-black text-indigo-600">{remainingCL}</span>
                  <span className="text-xs text-slate-400 font-semibold">of {totalAvailableCL} Days Total</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">SICK LEAVE (SL)</p>
                <div className="flex justify-between items-end">
                  <span className="text-4xl font-black text-rose-500">{remainingSL}</span>
                  <span className="text-xs text-slate-400 font-semibold">of {slQuota} Days Left</span>
                </div>
              </div>

              <div className={`p-6 rounded-2xl shadow-sm border ${isSabbaticalEligible ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                <p className="text-xs font-bold text-amber-700 uppercase mb-1">⭐ SABBATICAL (3 YRS)</p>
                <div className="flex justify-between items-end">
                  <span className="text-4xl font-black text-amber-600">{remainingSabbatical}</span>
                  <span className="text-xs text-amber-700 font-semibold">{isSabbaticalEligible ? '30 Days Available' : 'Requires 3 Yrs Tenure'}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">TOTAL LEAVES USED</p>
                <div className="flex justify-between items-end">
                  <span className="text-4xl font-black text-emerald-600">{usedCL + usedSL + usedSabbatical}</span>
                  <span className="text-xs text-slate-400 font-semibold">Days Deducted</span>
                </div>
              </div>
            </div>

            {/* Leave Records Table */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Leave Application Records</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold text-xs uppercase">
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Date / Range</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appliedLeaves.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-400">No leave records found.</td>
                      </tr>
                    ) : (
                      appliedLeaves.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 font-bold">
                            <span className={`px-2.5 py-1 rounded text-xs ${item.category === 'CL' ? 'bg-indigo-100 text-indigo-700' : item.category === 'SL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800 font-extrabold'}`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{item.dateStr || item.date_str}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-600">{item.daysCount || item.days_count} Day(s)</td>
                          <td className="py-3.5 px-4 text-slate-500">{item.reason}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button 
                              onClick={() => handleDeleteLeave(item.id)}
                              className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition border border-red-200"
                            >
                              🗑️ Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* HR Mail Logs */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">📬 HR Email Dispatcher Logs</h3>
                <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">Target HR: {hrEmailAddress}</span>
              </div>

              <div className="space-y-3">
                {emailLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No HR email notifications generated yet.</p>
                ) : (
                  emailLogs.map(mail => (
                    <div key={mail.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <span className="font-bold text-xs text-slate-900">{mail.subject}</span>
                        <p className="text-xs text-slate-500 mt-1 font-mono">To: {mail.to} | Reason: {mail.reason}</p>
                      </div>

                      <button 
                        onClick={() => handleSendReminderMail(mail)}
                        disabled={mail.isReminderSent || isSendingMail}
                        className={`px-3 py-2 rounded-xl text-xs font-bold ${mail.isReminderSent ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                      >
                        {mail.isReminderSent ? '✓ Reminder Sent' : '🔔 Send Day-2 HR Reminder'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* CALENDAR & LEAVE FORM TAB */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Submit Leave Application</h3>
              
              <form onSubmit={handleApplyLeave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Leave Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      type="button" 
                      onClick={() => setLeaveCategory('CL')}
                      className={`py-3 rounded-xl text-xs font-bold ${leaveCategory === 'CL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      CL ({remainingCL})
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setLeaveCategory('SL')}
                      className={`py-3 rounded-xl text-xs font-bold ${leaveCategory === 'SL' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      SL ({remainingSL})
                    </button>
                    <button 
                      type="button" 
                      disabled={!isSabbaticalEligible}
                      onClick={() => setLeaveCategory('Sabbatical')}
                      className={`py-3 rounded-xl text-xs font-bold ${!isSabbaticalEligible ? 'bg-slate-200 text-slate-400' : leaveCategory === 'Sabbatical' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {isSabbaticalEligible ? `Sabbatical (${remainingSabbatical}D)` : '🔒 Sabbatical'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Selection Mode</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input type="radio" name="mode" checked={dateMode === 'single'} onChange={() => setDateMode('single')} /> Single Day
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input type="radio" name="mode" checked={dateMode === 'range'} onChange={() => setDateMode('range')} /> Date Range
                    </label>
                  </div>
                </div>

                {dateMode === 'single' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Date</label>
                    <input 
                      type="date" 
                      required
                      value={singleDate}
                      onChange={e => setSingleDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date</label>
                      <input 
                        type="date" 
                        required
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Date</label>
                      <input 
                        type="date" 
                        required
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason / Remarks</label>
                  <textarea 
                    rows="3"
                    placeholder="Enter reason for leave application..."
                    value={leaveReason}
                    onChange={e => setLeaveReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSendingMail}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition text-sm"
                >
                  {isSendingMail ? 'Sending Notification Email...' : 'Submit Leave Request'}
                </button>
              </form>
            </div>

            {/* Holidays List */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Company Holiday Calendar</h3>
              
              <form onSubmit={handleAddHoliday} className="flex gap-2">
                <input 
                  type="date" 
                  required 
                  value={holidayDate}
                  onChange={e => setHolidayDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
                <input 
                  type="text" 
                  placeholder="Holiday Title" 
                  required 
                  value={holidayTitle}
                  onChange={e => setHolidayTitle(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl">Add</button>
              </form>

              <div className="divide-y divide-slate-100">
                {companyHolidays.map(item => (
                  <div key={item.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-400 font-mono">{item.date}</p>
                    </div>
                    <button onClick={() => handleDeleteHoliday(item.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-xl bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Portal Settings & Email Dispatcher</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">HR Receiver Email</label>
              <input 
                type="email" 
                value={hrEmailAddress}
                onChange={e => setHrEmailAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold"
              />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              All leave notification emails from the portal will automatically dispatch to this address.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
