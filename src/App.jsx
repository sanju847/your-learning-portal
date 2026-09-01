import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mhiqoknxkwmbisjurhvs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaXFva254a3dtYmlzanVyaHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMjY2OTksImV4cCI6MjEwMzgwMjY5OX0.OlJeKPhziAYxTcwKDdJJhrobQIjW_wbFPu1UOjHWZps';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [hrActionState, setHrActionState] = useState(null);
  const [hrActionDetails, setHrActionDetails] = useState({ status: '', leaveId: '' });

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('ylp_isLoggedIn') === 'true');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const [clQuota, setClQuota] = useState(() => Number(localStorage.getItem('ylp_cl_quota')) || 12);
  const [clCarryForward, setClCarryForward] = useState(() => Number(localStorage.getItem('ylp_cl_carry')) || 0);
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
  const [reminderSentMap, setReminderSentMap] = useState({});

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
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
      audio.play();
    } catch (err) {}
    if (window.confetti) {
      window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  const fetchLeaves = async (showLoading = false) => {
    if (showLoading) setIsFetchingData(true);
    
    const { data, error } = await supabase
      .from('leaves')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setAppliedLeaves(data);
      const now = new Date();
      setLastSyncedTime(now.toLocaleTimeString());
    }

    if (showLoading) {
      setTimeout(() => setIsFetchingData(false), 400);
    }
  };

  // HR Action Handling from Email Link
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
          console.error("Fetch Error:", fetchErr);
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
          console.error("Update Error:", updateErr);
          setHrActionState('error');
        }
      }
    };

    handleUrlAction();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchLeaves();

      const pollInterval = setInterval(() => {
        fetchLeaves(false);
      }, 15000);

      const channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leaves' }, () => {
          fetchLeaves(false);
        })
        .subscribe();

      return () => {
        clearInterval(pollInterval);
        supabase.removeChannel(channel);
      };
    }
  }, [isLoggedIn]);

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

  useEffect(() => {
    localStorage.setItem('ylp_isLoggedIn', isLoggedIn ? 'true' : 'false');
    localStorage.setItem('ylp_cl_quota', clQuota.toString());
    localStorage.setItem('ylp_cl_carry', clCarryForward.toString());
    localStorage.setItem('ylp_sl_quota', slQuota.toString());
    localStorage.setItem('ylp_sabbatical_quota', sabbaticalQuota.toString());
    localStorage.setItem('ylp_holidays', JSON.stringify(companyHolidays));
    localStorage.setItem('ylp_hr_email', hrEmailAddress);
  }, [isLoggedIn, clQuota, clCarryForward, slQuota, sabbaticalQuota, companyHolidays, hrEmailAddress]);

  const speakWelcomeMessage = () => {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance("Welcome to login YL portal Sanju!");
      msg.rate = 0.95;
      window.speechSynthesis.speak(msg);
    }
  };

  const usedCL = appliedLeaves.filter(i => i.category === 'CL' && i.status === 'Approved').reduce((s, i) => s + (i.days_count || 1), 0);
  const usedSL = appliedLeaves.filter(i => i.category === 'SL' && i.status === 'Approved').reduce((s, i) => s + (i.days_count || 1), 0);
  const usedSabbatical = appliedLeaves.filter(i => i.category === 'Sabbatical' && i.status === 'Approved').reduce((s, i) => s + (i.days_count || 1), 0);

  const remainingCL = totalAvailableCL - usedCL;
  const remainingSL = slQuota - usedSL;
  const remainingSabbatical = sabbaticalQuota - usedSabbatical;

  const sendRealMailToHR = async (mailPayload) => {
    setIsSendingMail(true);
    if (window.emailjs) {
      try {
        const baseUrl = window.location.origin + window.location.pathname;
        const approveUrl = `${baseUrl}?action=approve&id=${mailPayload.leaveId}`;
        const rejectUrl = `${baseUrl}?action=reject&id=${mailPayload.leaveId}`;
        
        await window.emailjs.send(
          'service_ts2aotz',
          'template_odlpu7u',
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
            leave_id: mailPayload.leaveId,
            approve_link: approveUrl,
            reject_link: rejectUrl
          },
          'O5FhcUXl6UTLrRv7n'
        );
      } catch (err) {
        console.error("EmailJS Error:", err);
      }
    }
    setIsSendingMail(false);
  };

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
      count = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
      dateStr = `${startDate} to ${endDate}`;
    }

    if (leaveCategory === 'Sabbatical' && !isSabbaticalEligible) {
      return alert('Sabbatical leave is locked!');
    }

    if (leaveCategory === 'CL' && count > remainingCL) return alert(`Insufficient CL Balance! Only ${remainingCL} Days Left.`);
    if (leaveCategory === 'SL' && count > remainingSL) return alert(`Insufficient SL Balance! Only ${remainingSL} Days Left.`);
    if (leaveCategory === 'Sabbatical' && count > remainingSabbatical) return alert(`Insufficient Sabbatical Balance!`);

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

    if (error || !data) return alert("Failed to save to Database.");

    const leaveId = data[0].id;

    const mailDraft = {
      leaveId: leaveId,
      to: hrEmailAddress,
      category: leaveCategory,
      daysCount: count,
      dateStr,
      reason: leaveReason || 'Personal Request',
      subject: `[LEAVE APPLICATION] - ${currentUser.name} (${leaveCategory} - ${count} Day(s))`,
      body: `Dear HR Team,\n\nI have submitted a leave request on the portal with details below:\n\n• Employee Name: ${currentUser.name} (${currentUser.employeeId})\n• Leave Type: ${leaveCategory}\n• Duration: ${dateStr} (${count} Day(s))\n• Reason: ${leaveReason || 'Personal Request'}\n\nKindly review and approve this application.\n\nBest Regards,\n${currentUser.name}\n${currentUser.role}`,
      sentDate: new Date().toLocaleDateString()
    };

    await sendRealMailToHR(mailDraft);

    setCurrentMailData(mailDraft);
    setSingleDate('');
    setStartDate('');
    setEndDate('');
    setLeaveReason('');

    triggerPartyPopper();
    setShowSuccessModal(true);
    fetchLeaves(true);
  };

  const handleDeleteLeave = async (id) => {
    if (window.confirm('Remove this leave entry and restore balance?')) {
      await supabase.from('leaves').delete().eq('id', id);
      fetchLeaves(true);
    }
  };

  const handleSendReminderMail = async (leaveItem) => {
    setIsSendingMail(true);
    await sendRealMailToHR({
      leaveId: leaveItem.id,
      to: hrEmailAddress,
      category: leaveItem.category,
      daysCount: leaveItem.days_count || 1,
      dateStr: leaveItem.date_str,
      reason: leaveItem.reason,
      sentDate: new Date().toLocaleDateString(),
      subject: `[DAY-2 ESCALATION REMINDER] Pending Leave Approval - ${currentUser.name}`,
      body: `Dear HR Team,\n\nThis is a reminder for pending leave approval (#${leaveItem.id}).`
    });

    setReminderSentMap(prev => ({ ...prev, [leaveItem.id]: true }));
    setIsSendingMail(false);
    alert(`Day-2 Escalation Reminder Email Sent to ${hrEmailAddress}!`);
  };

  const handleAddHoliday = (e) => {
    e.preventDefault();
    if (!holidayDate || !holidayTitle) return alert('Fill both holiday date and title');
    setCompanyHolidays([...companyHolidays, { id: Date.now(), date: holidayDate, title: holidayTitle }]);
    setHolidayDate('');
    setHolidayTitle('');
  };

  const handleDeleteHoliday = (id) => {
    setCompanyHolidays(companyHolidays.filter(h => h.id !== id));
  };

  if (hrActionState) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-950 p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-2xl border border-slate-800">
          {hrActionState === 'processing' && (
            <div className="py-8">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 font-bold text-sm">Processing HR response...</p>
            </div>
          )}

          {hrActionState === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto font-black shadow-inner">
                ✓
              </div>
              <h2 className="text-2xl font-black text-slate-900">Thank You, HR!</h2>
              <p className="text-sm text-slate-600 font-medium">
                Leave Request <span className="font-mono font-bold text-slate-900">#{hrActionDetails.leaveId}</span> has been marked as{' '}
                <span className={`font-bold ${hrActionDetails.status === 'Approved' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {hrActionDetails.status}
                </span>.
              </p>
              <p className="text-xs text-slate-400">Employee dashboard status has been updated automatically.</p>
            </div>
          )}

          {hrActionState === 'already_done' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto font-black">
                🔒
              </div>
              <h2 className="text-xl font-bold text-slate-900">Action Already Processed</h2>
              <p className="text-sm text-slate-600 font-medium">
                This leave request (#{hrActionDetails.leaveId}) was already recorded as{' '}
                <span className="font-bold text-slate-900">{hrActionDetails.status}</span>.
              </p>
              <p className="text-xs text-slate-400">No further modifications can be made from this email link.</p>
            </div>
          )}

          {hrActionState === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-3xl mx-auto font-black">
                ⚠️
              </div>
              <h2 className="text-xl font-bold text-slate-900">Action Failed</h2>
              <p className="text-sm text-slate-500 font-medium">Unable to update leave request status or invalid link ID.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

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
              <p className="text-slate-500 text-xs mt-1">Enter credentials for Your Learning Portal</p>
            </div>

            {loginError && (
              <div className="mb-5 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
                ⚠️ {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">USERNAME</label>
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">PASSWORD</label>
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

  return (
    <div className="w-screen h-screen flex bg-slate-100 overflow-hidden relative">
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

      {/* Sidebar Navigation */}
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

      {/* Main App Section */}
      <main className="flex-1 h-full p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 pb-5 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Welcome, {currentUser.name}</h1>
            <p className="text-sm text-slate-500 font-semibold mt-0.5">{currentUser.employeeId} | Joined: {currentUser.joiningDate}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Last Sync: {lastSyncedTime || 'Just now'}</span>
            <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
              Active Member Status
            </div>
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

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Leave Application Records</h3>
                
                <button
                  onClick={() => fetchLeaves(true)}
                  disabled={isFetchingData}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-300 transition shadow-sm active:scale-95"
                >
                  <span className={`text-sm ${isFetchingData ? 'animate-spin' : ''}`}>🔄</span>
                  {isFetchingData ? 'Updating Status...' : 'Refresh Data'}
                </button>
              </div>

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
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{item.date_str || item.dateStr}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-600">{item.days_count || item.daysCount} Day(s)</td>
                          <td className="py-3.5 px-4 text-slate-500">{item.reason}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            {item.status === 'Pending HR Approval' && (
                              <button
                                onClick={() => handleSendReminderMail(item)}
                                disabled={isSendingMail || reminderSentMap[item.id]}
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${reminderSentMap[item.id] ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border-amber-300'}`}
                              >
                                {reminderSentMap[item.id] ? 'Reminder Sent' : '📩 Remind HR'}
                              </button>
                            )}
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
          </div>
        )}

        {/* CALENDAR & APPLY LEAVE TAB */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Request Leave</h3>
              <form onSubmit={handleApplyLeave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Leave Type</label>
                  <select
                    value={leaveCategory}
                    onChange={e => setLeaveCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="CL">Casual Leave (CL)</option>
                    <option value="SL">Sick Leave (SL)</option>
                    <option value="Sabbatical" disabled={!isSabbaticalEligible}>
                      Sabbatical Leave {!isSabbaticalEligible ? '(Locked - 3 Yrs Required)' : ''}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Duration Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDateMode('single')}
                      className={`py-2.5 rounded-xl text-xs font-bold border ${dateMode === 'single' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                    >
                      Single Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateMode('range')}
                      className={`py-2.5 rounded-xl text-xs font-bold border ${dateMode === 'range' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                    >
                      Date Range
                    </button>
                  </div>
                </div>

                {dateMode === 'single' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Date</label>
                    <input
                      type="date"
                      value={singleDate}
                      onChange={e => setSingleDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Reason</label>
                  <textarea
                    rows="3"
                    placeholder="Provide a brief reason for your leave request..."
                    value={leaveReason}
                    onChange={e => setLeaveReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSendingMail}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg border border-white/20 text-sm transition"
                >
                  {isSendingMail ? 'Sending Notification...' : 'Submit Application'}
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Company Holidays Calendar</h3>
              <ul className="divide-y divide-slate-100 mb-6 max-h-72 overflow-y-auto">
                {companyHolidays.map(holiday => (
                  <li key={holiday.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{holiday.title}</p>
                      <span className="text-xs text-slate-400 font-semibold">{holiday.date}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteHoliday(holiday.id)}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>

              <form onSubmit={handleAddHoliday} className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Add Custom Holiday</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={holidayDate}
                    onChange={e => setHolidayDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Holiday Title"
                    value={holidayTitle}
                    onChange={e => setHolidayTitle(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Add Holiday
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Annual Quotas & System Config</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">HR Email Address</label>
                <input
                  type="email"
                  value={hrEmailAddress}
                  onChange={e => setHrEmailAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">CL Quota</label>
                  <input
                    type="number"
                    value={clQuota}
                    onChange={e => setClQuota(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">CL Carry Forward</label>
                  <input
                    type="number"
                    value={clCarryForward}
                    onChange={e => setClCarryForward(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">SL Quota</label>
                  <input
                    type="number"
                    value={slQuota}
                    onChange={e => setSlQuota(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Sabbatical Quota</label>
                  <input
                    type="number"
                    value={sabbaticalQuota}
                    onChange={e => setSabbaticalQuota(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
