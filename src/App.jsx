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

  // 3D Tilt Card state for Login
  const [cardRotation, setCardRotation] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setCardRotation({
      x: -(y / 20),
      y: x / 20
    });
  };

  const handleMouseLeave = () => {
    setCardRotation({ x: 0, y: 0 });
  };

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

      const pollInterval = setInterval(() => {
        fetchLeaves(false);
      }, 5000);

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
    localStorage.setItem('ylp_cl_carry_history', JSON.stringify(carryForwardHistory));
    localStorage.setItem('ylp_sl_quota', slQuota.toString());
    localStorage.setItem('ylp_sabbatical_quota', sabbaticalQuota.toString());
    localStorage.setItem('ylp_holidays', JSON.stringify(companyHolidays));
    localStorage.setItem('ylp_hr_email', hrEmailAddress);
  }, [isLoggedIn, clQuota, carryForwardHistory, slQuota, sabbaticalQuota, companyHolidays, hrEmailAddress]);

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

  const handleAddCarryForward = (e) => {
    e.preventDefault();
    if (!cfYearInput || !cfDaysInput) return alert('Fill both Year and Days');
    setCarryForwardHistory([
      ...carryForwardHistory,
      { id: Date.now(), year: cfYearInput, days: Number(cfDaysInput) }
    ]);
    setCfDaysInput('');
  };

  const handleDeleteCarryForward = (id) => {
    setCarryForwardHistory(carryForwardHistory.filter(item => item.id !== id));
  };

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

    const formattedReason = leaveReason ? leaveReason.trim() : '';
    if (!formattedReason) {
      alert("⚠️ Reason likhna zaroori hai!");
      return;
    }

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
          reason: formattedReason,
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
      reason: formattedReason,
      subject: `[LEAVE APPLICATION] - ${currentUser.name} (${leaveCategory} - ${count} Day(s))`,
      body: `Dear HR Team,\n\nI have submitted a leave request on the portal with details below:\n\n• Employee Name: ${currentUser.name} (${currentUser.employeeId})\n• Leave Type: ${leaveCategory}\n• Duration: ${dateStr} (${count} Day(s))\n• Reason: ${formattedReason}\n\nKindly review and approve this application.\n\nBest Regards,\n${currentUser.name}\n${currentUser.role}`,
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
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(79,70,229,0.3)]">
          {hrActionState === 'processing' && (
            <div className="py-8">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-300 font-bold text-sm">Processing HR response...</p>
            </div>
          )}

          {hrActionState === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center text-3xl mx-auto font-black shadow-inner">
                ✓
              </div>
              <h2 className="text-2xl font-black text-white">Thank You, HR!</h2>
              <p className="text-sm text-slate-300 font-medium">
                Leave Request <span className="font-mono font-bold text-white">#{hrActionDetails.leaveId}</span> has been marked as{' '}
                <span className={`font-bold ${hrActionDetails.status === 'Approved' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {hrActionDetails.status}
                </span>.
              </p>
            </div>
          )}

          {hrActionState === 'already_done' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full flex items-center justify-center text-3xl mx-auto font-black">
                🔒
              </div>
              <h2 className="text-xl font-bold text-white">Action Already Processed</h2>
              <p className="text-sm text-slate-300 font-medium">
                This leave request (#{hrActionDetails.leaveId}) was already recorded as{' '}
                <span className="font-bold text-white">{hrActionDetails.status}</span>.
              </p>
            </div>
          )}

          {hrActionState === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full flex items-center justify-center text-3xl mx-auto font-black">
                ⚠️
              </div>
              <h2 className="text-xl font-bold text-white">Action Failed</h2>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center bg-[#070913] p-4 relative overflow-hidden perspective-1000"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Animated 3D Glowing Orbs Background */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full filter blur-[140px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full filter blur-[140px] opacity-40 animate-pulse"></div>
        
        {/* Futuristic Cyber-Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d15_1px,transparent_1px),linear-gradient(to_bottom,#1f293d15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

        {/* 3D Floating Element Props */}
        <div className="hidden lg:block absolute left-16 top-1/3 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-2xl rotate-12 blur-[1px] shadow-[0_20px_40px_rgba(79,70,229,0.5)] animate-bounce duration-[3000ms]"></div>
        <div className="hidden lg:block absolute right-20 bottom-1/4 w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full -rotate-45 blur-[1px] shadow-[0_20px_40px_rgba(6,182,212,0.5)] animate-bounce duration-[4000ms]"></div>

        {/* 3D Interactive Main Login Card Container */}
        <div 
          ref={cardRef}
          style={{
            transform: `perspective(1000px) rotateX(${cardRotation.x}deg) rotateY(${cardRotation.y}deg)`,
            transition: 'transform 0.1s cubic-bezier(0.03, 0.98, 0.52, 0.99)'
          }}
          className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col md:flex-row border border-white/10 relative z-10 my-auto group"
        >
          {/* Neon Border Glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-30 group-hover:opacity-70 transition duration-500 blur-sm pointer-events-none"></div>

          {/* Left Side Visual - Smooth Ken Burns + 3D Glass Layer */}
          <div className="w-full md:w-1/2 relative flex flex-col justify-between p-6 md:p-10 text-white overflow-hidden min-h-[300px] md:min-h-[460px]">
            {bgImages.map((img, i) => (
              <div
                key={i}
                className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 transform ${
                  i === bgIndex 
                    ? 'opacity-80 scale-125 ease-out duration-[6000ms]' 
                    : 'opacity-0 scale-100'
                }`}
                style={{ backgroundImage: `url(${img})` }}
              />
            ))}
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/50 to-transparent z-[1]" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-4 border border-white/20 shadow-2xl">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-ping"></span>
                Corporate Workspace 3D
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-xl bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                Your Learning Portal
              </h2>
            </div>

            <div className="relative z-10 text-xs font-bold tracking-widest text-indigo-300 uppercase mt-4 md:mt-0 drop-shadow flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
              Enterprise Attendance System
            </div>
          </div>

          {/* Right Side Glass Form */}
          <div className="w-full md:w-1/2 bg-[#0d1322]/90 backdrop-blur-2xl p-6 md:p-10 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/10 relative z-20">
            <div className="mb-6">
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">Sign In</h3>
              <p className="text-slate-400 text-xs font-medium mt-1">Enter credentials to access portal</p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold shadow-inner">
                ⚠️ {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1.5">USERNAME</label>
                <input 
                  type="text" 
                  required
                  placeholder="Sanju"
                  value={usernameInput} 
                  onChange={e => setUsernameInput(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-900/80 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-sm font-semibold transition shadow-inner placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1.5">PASSWORD</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={passwordInput} 
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-900/80 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-sm font-semibold transition shadow-inner placeholder:text-slate-600"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl shadow-[0_10px_25px_-5px_rgba(79,70,229,0.5)] transition-all duration-300 border border-white/20 text-sm mt-3 transform active:scale-[0.98] hover:-translate-y-0.5"
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
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-100 font-sans overflow-x-hidden">
      {showSuccessModal && currentMailData && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold">
                ✉️
              </div>
              <div className="text-left">
                <h3 className="text-base md:text-lg font-extrabold text-slate-900">Leave Submitted & Email Dispatched</h3>
                <p className="text-xs text-slate-500 font-semibold">Real email notification sent to HR ({currentMailData.to})</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left font-mono text-xs text-slate-700 space-y-2 max-h-56 overflow-y-auto">
              <p><strong>To HR Email:</strong> {currentMailData.to}</p>
              <p><strong>Subject:</strong> {currentMailData.subject}</p>
              <p><strong>Reason:</strong> {currentMailData.reason}</p>
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

      {/* Navigation Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(79,70,229,0.5)]">Y</div>
              <div>
                <h1 className="font-extrabold text-white text-sm leading-tight">Your Learning</h1>
                <span className="text-[10px] text-indigo-400 font-semibold">Portal System</span>
              </div>
            </div>
            
            <button 
              onClick={handleSignOut}
              className="md:hidden px-3 py-1.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold rounded-lg border border-red-600/20"
            >
              Sign Out
            </button>
          </div>
          
          <nav className="p-2 md:p-4 flex md:flex-col overflow-x-auto gap-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`whitespace-nowrap flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}
            >
              📊 <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`whitespace-nowrap flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}
            >
              📅 <span>Apply Leave</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`whitespace-nowrap flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}
            >
              ⚙️ <span>Settings</span>
            </button>
          </nav>
        </div>

        <div className="hidden md:block p-4 border-t border-slate-800">
          <button 
            onClick={handleSignOut}
            className="w-full py-2.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white font-bold rounded-xl text-xs transition border border-red-600/20"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel View */}
      <main className="flex-1 w-full max-w-full p-4 md:p-8 overflow-y-auto min-w-0">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Welcome, {currentUser.name}</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{currentUser.employeeId} | Joined: {currentUser.joiningDate}</p>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            Last Sync: {lastSyncedTime || 'Just now'}
          </span>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">CASUAL LEAVE (CL)</p>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-3xl font-black text-indigo-600">{remainingCL}</span>
                  <span className="text-xs text-slate-400 font-semibold">of {totalAvailableCL} Total</span>
                </div>
                
                <div className="border-t border-slate-100 pt-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Carry Forward Breakdown:</p>
                  <div className="flex flex-wrap gap-1">
                    {carryForwardHistory.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No carry forward</span>
                    ) : (
                      carryForwardHistory.map(item => (
                        <span key={item.id} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md">
                          {item.year}: {item.days}D
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">SICK LEAVE (SL)</p>
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-rose-500">{remainingSL}</span>
                  <span className="text-xs text-slate-400 font-semibold">of {slQuota} Days Left</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl shadow-sm border ${isSabbaticalEligible ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                <p className="text-xs font-bold text-amber-700 uppercase mb-1">⭐ SABBATICAL (3 YRS)</p>
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-amber-600">{remainingSabbatical}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">TOTAL LEAVES USED</p>
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-emerald-600">{usedCL + usedSL + usedSabbatical}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="text-base font-bold text-slate-800">Leave Application Records</h3>
                
                <button
                  onClick={() => fetchLeaves(true)}
                  disabled={isFetchingData}
                  className="w-full sm:w-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-300 transition shadow-sm active:scale-95"
                >
                  <span className={`text-sm ${isFetchingData ? 'animate-spin' : ''}`}>🔄</span>
                  {isFetchingData ? 'Updating Status...' : 'Refresh Data'}
                </button>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold text-[11px] uppercase">
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Date / Range</th>
                      <th className="py-3 px-3">Days</th>
                      <th className="py-3 px-3">Reason</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
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
                          <td className="py-3 px-3 font-bold">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${item.category === 'CL' ? 'bg-indigo-100 text-indigo-700' : item.category === 'SL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800 font-extrabold'}`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">{item.date_str || item.dateStr}</td>
                          <td className="py-3 px-3 font-semibold text-slate-600 whitespace-nowrap">{item.days_count || item.daysCount}D</td>
                          <td className="py-3 px-3 text-slate-500 font-medium max-w-[140px] truncate">{item.reason}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${item.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap space-x-1">
                            {item.status === 'Pending HR Approval' && (
                              <button
                                onClick={() => handleSendReminderMail(item)}
                                disabled={isSendingMail || reminderSentMap[item.id]}
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition ${reminderSentMap[item.id] ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-300'}`}
                              >
                                {reminderSentMap[item.id] ? 'Sent' : '📩 Remind'}
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteLeave(item.id)}
                              className="px-2 py-1 text-[11px] font-bold rounded-lg border bg-rose-50 text-rose-600 border-rose-200 transition"
                            >
                              🗑️
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-extrabold text-slate-900 mb-5">Apply Leave Request</h3>

              <form onSubmit={handleApplyLeave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Leave Category</label>
                  <select 
                    value={leaveCategory}
                    onChange={e => setLeaveCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="CL">Casual Leave (CL)</option>
                    <option value="SL">Sick Leave (SL)</option>
                    <option value="Sabbatical" disabled={!isSabbaticalEligible}>
                      Sabbatical Leave {!isSabbaticalEligible ? '(Locked - 3 Yrs Tenure Needed)' : ''}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Duration Selection</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                      <input 
                        type="radio" 
                        name="dateMode" 
                        value="single" 
                        checked={dateMode === 'single'} 
                        onChange={() => setDateMode('single')}
                      /> Single Day
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                      <input 
                        type="radio" 
                        name="dateMode" 
                        value="range" 
                        checked={dateMode === 'range'} 
                        onChange={() => setDateMode('range')}
                      /> Multiple Days
                    </label>
                  </div>
                </div>

                {dateMode === 'single' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Select Date</label>
                    <input 
                      type="date" 
                      value={singleDate}
                      onChange={e => setSingleDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Start Date</label>
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">End Date</label>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Reason for Leave <span className="text-rose-600 font-bold">* Mandatory</span>
                  </label>
                  <textarea 
                    rows="3"
                    required
                    autoComplete="off"
                    placeholder="Enter reason for leave request..."
                    value={leaveReason}
                    onChange={e => setLeaveReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSendingMail}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-lg transition border border-white/20 text-sm"
                >
                  {isSendingMail ? 'Sending Mail to HR...' : 'Submit Leave Request & Send Email'}
                </button>
              </form>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-5">
              <h3 className="text-lg font-extrabold text-slate-900">Company Holidays</h3>

              <form onSubmit={handleAddHoliday} className="space-y-3 pb-4 border-b border-slate-200">
                <input 
                  type="date" 
                  value={holidayDate}
                  onChange={e => setHolidayDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold"
                />
                <input 
                  type="text" 
                  placeholder="Holiday Title (e.g. Diwali)"
                  value={holidayTitle}
                  onChange={e => setHolidayTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold"
                />
                <button type="submit" className="w-full py-2 bg-slate-900 text-white font-bold rounded-lg text-xs">
                  + Add Holiday
                </button>
              </form>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {companyHolidays.map(h => (
                  <div key={h.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-bold text-xs text-slate-900">{h.title}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{h.date}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteHoliday(h.id)}
                      className="text-xs text-rose-500 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="text-lg font-extrabold text-slate-900">Portal Configuration & HR Setup</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">HR Email Address</label>
                <input 
                  type="email" 
                  value={hrEmailAddress}
                  onChange={e => setHrEmailAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">CL Carry Forward (Yearly Breakdown)</h4>
                    <p className="text-xs text-slate-500 font-semibold">Total Carry Forward: <span className="font-black text-indigo-600">{clCarryForward} Days</span></p>
                  </div>
                </div>

                <form onSubmit={handleAddCarryForward} className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    placeholder="Year (e.g. 2025)"
                    value={cfYearInput}
                    onChange={e => setCfYearInput(e.target.value)}
                    className="w-full sm:w-1/3 px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold text-xs"
                  />
                  <input 
                    type="number" 
                    placeholder="Days (e.g. 10)"
                    value={cfDaysInput}
                    onChange={e => setCfDaysInput(e.target.value)}
                    className="w-full sm:w-1/3 px-3 py-2 rounded-xl bg-white border border-slate-200 font-semibold text-xs"
                  />
                  <button type="submit" className="w-full sm:w-1/3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md">
                    + Add Year Entry
                  </button>
                </form>

                <div className="space-y-2">
                  {carryForwardHistory.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-800">Year {item.year}: <span className="text-indigo-600 font-black">{item.days} Days</span></span>
                      <button 
                        onClick={() => handleDeleteCarryForward(item.id)}
                        className="text-xs text-rose-500 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Annual CL Quota</label>
                  <input 
                    type="number" 
                    value={clQuota}
                    onChange={e => setClQuota(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Annual SL Quota</label>
                  <input 
                    type="number" 
                    value={slQuota}
                    onChange={e => setSlQuota(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sabbatical Quota</label>
                  <input 
                    type="number" 
                    value={sabbaticalQuota}
                    onChange={e => setSabbaticalQuota(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-sm"
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