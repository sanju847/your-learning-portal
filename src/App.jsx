import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mhiqoknxkwmbisjurhvs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaXFva254a3dtYmlzanVyaHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMjY2OTksImV4cCI6MjEwMzgwMjY5OX0.OlJeKPhziAYxTcwKDdJJhrobQIjW_wbFPu1UOjHWZps';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Default Indian Holiday List for 2026
const DEFAULT_HOLIDAYS_2026 = [
  { id: 1, date: '2026-01-26', title: 'Republic Day' },
  { id: 2, date: '2026-03-04', title: 'Maha Shivratri' },
  { id: 3, date: '2026-03-25', title: 'Holi' },
  { id: 4, date: '2026-04-02', title: 'Good Friday' },
  { id: 5, date: '2026-04-14', title: 'Ambedkar Jayanti' },
  { id: 6, date: '2026-05-01', title: 'May Day' },
  { id: 7, date: '2026-08-15', title: 'Independence Day' },
  { id: 8, date: '2026-08-28', title: 'Raksha Bandhan' },
  { id: 9, date: '2026-09-04', title: 'Janmashtami' },
  { id: 10, date: '2026-10-02', title: 'Gandhi Jayanti' },
  { id: 11, date: '2026-10-20', title: 'Dussehra' },
  { id: 12, date: '2026-11-08', title: 'Diwali' },
  { id: 13, date: '2026-11-09', title: 'Govardhan Puja' },
  { id: 14, date: '2026-11-23', title: 'Guru Nanak Jayanti' },
  { id: 15, date: '2026-12-25', title: 'Christmas' }
];

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

  // Center Toast Notification & Custom Delete Modal States
  const [toastNotification, setToastNotification] = useState({ show: false, title: '', message: '' });
  const [deleteCandidateDate, setDeleteCandidateDate] = useState(null);

  // Sync Calendar Loader State
  const [isSyncing, setIsSyncing] = useState(false);

  // Blacklist state to stop Auto-Mark Absent from regenerating deleted entries
  const [deletedDates, setDeletedDates] = useState(() => {
    const saved = localStorage.getItem('ylp_deleted_attendance_dates');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ylp_deleted_attendance_dates', JSON.stringify(deletedDates));
  }, [deletedDates]);

  // Quota & Carry Forward States
  const [clQuota, setClQuota] = useState(12);
  const [slQuota, setSlQuota] = useState(6);
  const [sabbaticalQuota, setSabbaticalQuota] = useState(30);
  const [carryForwardHistory, setCarryForwardHistory] = useState([
    { id: 1, year: '2024', days: 4 },
    { id: 2, year: '2025', days: 6 }
  ]);
  const [hrEmailAddress, setHrEmailAddress] = useState('sanju@yourlearnings.com');

  const [cfYearInput, setCfYearInput] = useState('2025');
  const [cfDaysInput, setCfDaysInput] = useState('');

  const clCarryForward = carryForwardHistory.reduce((acc, curr) => acc + Number(curr.days || 0), 0);
  const totalAvailableCL = clQuota + clCarryForward;

  const [isSendingMail, setIsSendingMail] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentMailData, setCurrentMailData] = useState(null);

  const [appliedLeaves, setAppliedLeaves] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [reminderSentMap, setReminderSentMap] = useState({});

  const [extraWorkDate, setExtraWorkDate] = useState('');
  const [extraWorkReason, setExtraWorkReason] = useState('');

  // Calendar State
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarViewMonth, setCalendarViewMonth] = useState(new Date().getMonth());
  const [calendarViewYear, setCalendarViewYear] = useState(new Date().getFullYear());

  const prevLeavesMapRef = useRef({});

  const [companyHolidays, setCompanyHolidays] = useState(() => {
    const saved = localStorage.getItem('ylp_holidays');
    return saved ? JSON.parse(saved) : DEFAULT_HOLIDAYS_2026;
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

  // Smooth Center Toast Helper
  const triggerToast = (title, message) => {
    setToastNotification({ show: true, title, message });
    setTimeout(() => {
      setToastNotification({ show: false, title: '', message: '' });
    }, 2500);
  };

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
      checkAndAutoMarkAbsent(data);
    }
  };

  // SYNC CALENDAR HANDLER (Refreshes DB, Holidays & Attendance)
  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([fetchLeaves(false), fetchAttendance(), fetchPortalSettings()]);
      setCompanyHolidays(DEFAULT_HOLIDAYS_2026);
      localStorage.setItem('ylp_holidays', JSON.stringify(DEFAULT_HOLIDAYS_2026));
      triggerToast("Calendar Synced!", "All holidays, leaves & attendance data updated.");
    } catch (err) {
      triggerToast("Sync Failed", "Could not sync database records.");
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  // Fixed Auto-Mark Absent (Honors Deleted Blacklist)
  const checkAndAutoMarkAbsent = async (currentRecords) => {
    const today = new Date();
    const recordsMap = new Set(currentRecords.map(r => r.date));
    const savedBlacklist = JSON.parse(localStorage.getItem('ylp_deleted_attendance_dates') || '[]');
    const newAbsentEntries = [];

    for (let i = 1; i <= 7; i++) {
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - i);
      const dateStr = pastDate.toISOString().split('T')[0];
      const dayNum = pastDate.getDay();

      if (dayNum !== 0 && dayNum !== 6) {
        if (!recordsMap.has(dateStr) && !savedBlacklist.includes(dateStr)) {
          newAbsentEntries.push({
            date: dateStr,
            status: 'Absent',
            type: 'Regular Workday',
            note: 'Auto-marked Absent (Attendance missing)'
          });
        }
      }
    }

    if (newAbsentEntries.length > 0) {
      await supabase.from('attendance').upsert(newAbsentEntries, { onConflict: 'date' });
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
      }, 4000);

      const channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leaves' }, () => {
          fetchLeaves(false);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
          fetchPortalSettings();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
          fetchAttendance();
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
    localStorage.setItem('ylp_holidays', JSON.stringify(companyHolidays));
  }, [isLoggedIn, companyHolidays]);

  const speakWelcomeMessage = () => {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance("Welcome to login YL portal Sanju!");
      msg.rate = 0.95;
      window.speechSynthesis.speak(msg);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceRecords.find(r => r.date === todayStr);

  // MARK ATTENDANCE BY CALENDAR / ANY SPECIFIC DATE
  const handleMarkDateAttendance = async (targetDate) => {
    const d = new Date(targetDate);
    const dayNum = d.getDay();
    const isWeekend = dayNum === 0 || dayNum === 6;

    const payload = {
      date: targetDate,
      status: 'Present',
      type: isWeekend ? 'Extra Weekend Work' : 'Regular Workday',
      note: targetDate === todayStr ? 'Standard Present' : 'Back-date Present Entry'
    };

    const { error } = await supabase.from('attendance').upsert([payload], { onConflict: 'date' });
    
    if (!error) {
      setDeletedDates(prev => prev.filter(dt => dt !== targetDate));
      await fetchAttendance();
      triggerToast(
        "Attendance Marked!", 
        `Attendance recorded as Present for ${targetDate}`
      );
    } else {
      alert("⚠️ Error updating Database: " + error.message);
    }
  };

  // PERMANENT DELETE HANDLER
  const confirmPermanentDelete = async () => {
    if (!deleteCandidateDate) return;
    const dateStr = deleteCandidateDate;

    const { error } = await supabase.from('attendance').delete().eq('date', dateStr);
    
    if (!error) {
      setDeletedDates(prev => [...prev, dateStr]);
      setAttendanceRecords(prev => prev.filter(r => r.date !== dateStr));
      setDeleteCandidateDate(null);
      triggerToast("Record Removed", `Attendance entry for ${dateStr} has been deleted permanently.`);
      await fetchAttendance();
    } else {
      alert("⚠️ Failed to delete entry: " + error.message);
      setDeleteCandidateDate(null);
    }
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

    const { error } = await supabase.from('attendance').upsert([payload], { onConflict: 'date' });
    
    if (!error) {
      setDeletedDates(prev => prev.filter(dt => dt !== extraWorkDate));
      setExtraWorkDate('');
      setExtraWorkReason('');
      await fetchAttendance();
      triggerToast("Extra Day Logged!", `Extra working day saved for ${extraWorkDate}`);
    } else {
      alert("⚠️ Error saving record: " + error.message);
    }
  };

  const usedCL = appliedLeaves.filter(i => i.category === 'CL' && i.status === 'Approved').reduce((s, i) => s + (i.days_count || 1), 0);
  const usedSL = appliedLeaves.filter(i => i.category === 'SL' && i.status === 'Approved').reduce((s, i) => s + (i.days_count || 1), 0);
  const usedSabbatical = appliedLeaves.filter(i => i.category === 'Sabbatical' && i.status === 'Approved').reduce((s, i) => s + (i.days_count || 1), 0);

  const remainingCL = totalAvailableCL - usedCL;
  const remainingSL = slQuota - usedSL;
  const remainingSabbatical = sabbaticalQuota - usedSabbatical;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthAttendance = attendanceRecords
    .filter(r => !deletedDates.includes(r.date))
    .filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && r.status === 'Present';
    });

  const extraDaysCount = currentMonthAttendance.filter(r => r.type === 'Extra Working Day' || r.type === 'Extra Weekend Work').length;

  const handleAddCarryForward = (e) => {
    e.preventDefault();
    if (!cfYearInput || !cfDaysInput) return alert('Fill both Year and Days');
    const updatedHistory = [
      ...carryForwardHistory,
      { id: Date.now(), year: cfYearInput, days: Number(cfDaysInput) }
    ];
    setCarryForwardHistory(updatedHistory);
    saveSettingsToDB({ carryForward: updatedHistory });
    setCfDaysInput('');
  };

  const handleDeleteCarryForward = (id) => {
    const updatedHistory = carryForwardHistory.filter(item => item.id !== id);
    setCarryForwardHistory(updatedHistory);
    saveSettingsToDB({ carryForward: updatedHistory });
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
    triggerToast("Reminder Sent!", `Escalation mail sent to ${hrEmailAddress}`);
  };

  const handleAddHoliday = (e) => {
    e.preventDefault();
    if (!holidayDate || !holidayTitle) return alert('Fill both holiday date and title');
    const updated = [...companyHolidays, { id: Date.now(), date: holidayDate, title: holidayTitle }];
    setCompanyHolidays(updated);
    localStorage.setItem('ylp_holidays', JSON.stringify(updated));
    setHolidayDate('');
    setHolidayTitle('');
  };

  const handleDeleteHoliday = (id) => {
    const updated = companyHolidays.filter(h => h.id !== id);
    setCompanyHolidays(updated);
    localStorage.setItem('ylp_holidays', JSON.stringify(updated));
  };

  // CALENDAR GENERATOR HELPER WITH HOLIDAY BADGES
  const renderInteractiveCalendar = () => {
    const daysInMonth = new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate();
    const firstDayIndex = new Date(calendarViewYear, calendarViewMonth, 1).getDay();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    const filteredRecords = attendanceRecords.filter(r => !deletedDates.includes(r.date));

    for (let day = 1; day <= daysInMonth; day++) {
      const formattedMonth = String(calendarViewMonth + 1).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      const fullDateStr = `${calendarViewYear}-${formattedMonth}-${formattedDay}`;

      const rec = filteredRecords.find(r => r.date === fullDateStr);
      const holiday = companyHolidays.find(h => h.date === fullDateStr);
      const isToday = fullDateStr === todayStr;

      let cellStyle = "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100";
      if (rec?.status === 'Present') cellStyle = "bg-emerald-500 text-white font-black shadow-md shadow-emerald-500/30";
      else if (rec?.status === 'Absent') cellStyle = "bg-rose-500 text-white font-black shadow-md shadow-rose-500/30";
      else if (holiday) cellStyle = "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30";

      days.push(
        <button
          key={day}
          onClick={() => {
            setSelectedCalendarDate(fullDateStr);
            if (dateMode === 'single') setSingleDate(fullDateStr);
          }}
          className={`h-11 rounded-xl border flex flex-col items-center justify-center transition-all text-xs font-bold relative ${cellStyle} ${isToday ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
        >
          <span>{day}</span>
          {rec && !holiday && <span className="text-[9px] uppercase tracking-tighter opacity-90">{rec.status}</span>}
          {holiday && <span className="text-[8px] uppercase tracking-tighter text-amber-200 font-extrabold truncate w-full px-1">{holiday.title}</span>}
        </button>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-xl border border-slate-200">
          <button 
            onClick={() => {
              if (calendarViewMonth === 0) {
                setCalendarViewMonth(11);
                setCalendarViewYear(calendarViewYear - 1);
              } else {
                setCalendarViewMonth(calendarViewMonth - 1);
              }
            }}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold shadow-sm"
          >
            ◀
          </button>
          <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
            {monthNames[calendarViewMonth]} {calendarViewYear}
          </span>
          <button 
            onClick={() => {
              if (calendarViewMonth === 11) {
                setCalendarViewMonth(0);
                setCalendarViewYear(calendarViewYear + 1);
              } else {
                setCalendarViewMonth(calendarViewMonth + 1);
              }
            }}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold shadow-sm"
          >
            ▶
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 uppercase">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  // ACTION SCREENS (HR / OWNER RESPONSE)
  if (hrActionState) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(79,70,229,0.3)]">
          {hrActionState === 'processing' && (
            <div className="py-8">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-300 font-bold text-sm">Processing response...</p>
            </div>
          )}

          {hrActionState === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center text-3xl mx-auto font-black shadow-inner">
                ✓
              </div>
              <h2 className="text-2xl font-black text-white">Thank You!</h2>
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

  // LOGIN VIEW
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#05060f] p-4 relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-tr from-indigo-900/40 via-purple-900/30 to-blue-900/20 rounded-full blur-[160px] pointer-events-none"></div>

        <div className="w-full max-w-4xl bg-[#0e1322]/90 backdrop-blur-xl rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col md:flex-row relative z-10">
          <div className="w-full md:w-1/2 relative flex flex-col justify-between p-6 md:p-10 text-white overflow-hidden min-h-[300px] md:min-h-[460px]">
            {bgImages.map((img, i) => (
              <div
                key={i}
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                  i === bgIndex ? 'opacity-70 scale-105 transition-transform duration-[4000ms]' : 'opacity-0 scale-100'
                }`}
                style={{ backgroundImage: `url(${img})` }}
              />
            ))}
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/40 to-transparent z-[1]" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-4 border border-white/15">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Corporate Workspace
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow">
                Your Learning Portal
              </h2>
            </div>

            <div className="relative z-10 text-[11px] font-bold tracking-widest text-indigo-300 uppercase mt-4 md:mt-0">
              ENTERPRISE ATTENDANCE SYSTEM
            </div>
          </div>

          <div className="w-full md:w-1/2 bg-[#090d16] p-6 md:p-10 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/10">
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

  // MAIN SYSTEM APP
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-100 font-sans overflow-x-hidden relative">
      
      {/* --- CENTER CLEAN TOAST NOTIFICATION --- */}
      {toastNotification.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs transition-opacity duration-200">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700 max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">{toastNotification.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{toastNotification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteCandidateDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
              ✕
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Delete Attendance Entry</h3>
            <p className="text-xs text-slate-500 mb-6">
              Are you sure you want to delete attendance record for <span className="font-bold text-slate-700">{deleteCandidateDate}</span>? It will not reappear.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteCandidateDate(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmPermanentDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-rose-600/20"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && currentMailData && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold">
                ✉️
              </div>
              <div className="text-left">
                <h3 className="text-base md:text-lg font-extrabold text-slate-900">Leave Submitted & Email Dispatched</h3>
                <p className="text-xs text-slate-500 font-semibold">Real email notification sent to ({currentMailData.to})</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left font-mono text-xs text-slate-700 space-y-2 max-h-56 overflow-y-auto">
              <p><strong>To:</strong> {currentMailData.to}</p>
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

      {/* Sidebar Navigation */}
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
              onClick={() => setActiveTab('attendance')}
              className={`whitespace-nowrap flex-1 md:w-full flex items-center justify-center md:justify-start gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'attendance' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}
            >
              🕒 <span>Attendance</span>
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

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-full p-4 md:p-8 overflow-y-auto min-w-0">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Welcome, {currentUser.name}</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{currentUser.employeeId} | Joined: {currentUser.joiningDate}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            
            {/* SYNC CALENDAR BUTTON */}
            <button 
              onClick={handleSyncCalendar}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <span className={isSyncing ? 'animate-spin' : ''}>🔄</span>
              {isSyncing ? 'Syncing...' : 'Sync Calendar'}
            </button>

            <button 
              onClick={() => handleMarkDateAttendance(todayStr)} 
              disabled={!!todayRecord} 
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${todayRecord ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
            >
              {todayRecord ? '✓ Marked Present Today' : '📍 Mark Attendance Today'}
            </button>
            <span className="text-[11px] text-slate-400 font-semibold bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              Last Sync: {lastSyncedTime || 'Just now'}
            </span>
          </div>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">MONTHLY PRESENTS</p>
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-emerald-600">{currentMonthAttendance.length}</span>
                  <span className="text-xs text-slate-400 font-semibold">Days Logged</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">EXTRA WORK DAYS</p>
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-amber-600">{extraDaysCount}</span>
                  <span className="text-xs text-slate-400 font-semibold">Weekend Working</span>
                </div>
              </div>

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
                              className="px-2 py-1 text-[11px] font-bold rounded-lg border bg-rose-50 text-rose-600 border-rose-200 transition hover:bg-rose-600 hover:text-white"
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

        {/* ATTENDANCE TAB WITH LIVE CALENDAR & DELETE BUTTON */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* INTERACTIVE CALENDAR FOR BACK-DATE ATTENDANCE */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Interactive Attendance Calendar</h3>
                    <p className="text-xs text-slate-500 font-medium">Click any past date to mark attendance for missed days.</p>
                  </div>
                  <button 
                    onClick={() => handleMarkDateAttendance(selectedCalendarDate)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition shadow-sm"
                  >
                    📍 Mark {selectedCalendarDate}
                  </button>
                </div>

                {renderInteractiveCalendar()}
              </div>

              {/* TABLE WITH DELETE BUTTON ACCESSIBLE ON DASHBOARD */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-extrabold text-slate-900 mb-4">Attendance History Log</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2">Work Type</th>
                        <th className="py-3 px-2">Note</th>
                        <th className="py-3 px-2 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceRecords.filter(r => !deletedDates.includes(r.date)).length === 0 ? (
                        <tr><td colSpan="5" className="py-4 text-center text-slate-400">No attendance records found yet.</td></tr>
                      ) : (
                        attendanceRecords
                          .filter(r => !deletedDates.includes(r.date))
                          .map(r => (
                            <tr key={r.id || r.date}>
                              <td className="py-3 px-2 font-bold">{r.date}</td>
                              <td className="py-3 px-2">
                                <span className={`px-2 py-0.5 rounded font-bold ${r.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="py-3 px-2 font-semibold text-slate-600">{r.type}</td>
                              <td className="py-3 px-2 text-slate-500">{r.note}</td>
                              <td className="py-3 px-2 text-right">
                                <button 
                                  onClick={() => setDeleteCandidateDate(r.date)}
                                  className="px-2 py-1 text-[11px] font-bold rounded-lg border bg-rose-50 text-rose-600 border-rose-200 transition hover:bg-rose-600 hover:text-white"
                                >
                                  🗑️ Delete
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

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 h-fit">
              <h3 className="text-lg font-extrabold text-slate-900">Log Extra Weekend Working</h3>
              <form onSubmit={handleAddExtraWork} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
                  <input type="date" value={extraWorkDate} onChange={e => setExtraWorkDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason / Note</label>
                  <input type="text" placeholder="e.g. Overtime duty" value={extraWorkReason} onChange={e => setExtraWorkReason(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition">Log Extra Work Day</button>
              </form>
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
                  {isSendingMail ? 'Sending Mail...' : 'Submit Leave Request & Send Email'}
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Recipient Email Addresses (Use commas for multiple, e.g. HR, Owner)
                </label>
                <input 
                  type="text" 
                  value={hrEmailAddress}
                  onChange={e => {
                    setHrEmailAddress(e.target.value);
                    saveSettingsToDB({ hrEmail: e.target.value });
                  }}
                  placeholder="sanju@yourlearnings.com, owner@yourlearnings.com"
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
                    onChange={e => {
                      const val = Number(e.target.value);
                      setClQuota(val);
                      saveSettingsToDB({ clQuota: val });
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Annual SL Quota</label>
                  <input 
                    type="number" 
                    value={slQuota}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setSlQuota(val);
                      saveSettingsToDB({ slQuota: val });
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sabbatical Quota</label>
                  <input 
                    type="number" 
                    value={sabbaticalQuota}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setSabbaticalQuota(val);
                      saveSettingsToDB({ sabbaticalQuota: val });
                    }}
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