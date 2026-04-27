import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Key, 
  ArrowRight, 
  LogOut, 
  LayoutDashboard, 
  Users,
  AlertCircle, 
  CheckCircle2,
  Check,
  X,
  ArrowLeft,
  Timer,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Info,
  MapPin,
  Clock,
  Loader2,
  UserPlus,
  Send,
  Briefcase,
  UserCheck,
  Trash2,
  History,
  RefreshCw,
  Power,
  FileText,
  Camera,
  Activity,
  DownloadCloud
} from 'lucide-react';
import { 
  auth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged, 
  db, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc,
  arrayUnion,
  arrayRemove,
  appId,
  loginUser,
  addUser,
  addPendingUser,
  getAllData,
  updateDoc as apiUpdateDoc,
  resetUserPassword,
  updateUserStatus,
  updateUserLeaveCredits,
} from './config/api';
import { CONFIG } from './config/constants';
import HolidayCalendarView from './components/HolidayCalendarView';

// --- CORE APP COMPONENT ---

const App = () => {
  const todayString = new Date().toISOString().split('T')[0];
  const [view, setView] = useState(() => {
    const storedView = localStorage.getItem('nexusPortalView');
    const hasUser = Boolean(localStorage.getItem('nexusPortalUser'));
    if (storedView) {
      if (storedView === 'dashboard' && !hasUser) return 'landing';
      return storedView;
    }
    return hasUser ? 'dashboard' : 'landing';
  });
  const [subView, setSubView] = useState(() => localStorage.getItem('nexusPortalSubView') || 'main');
  const [selectedDate, setSelectedDate] = useState(() => localStorage.getItem('nexusPortalSelectedDate') || todayString);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('nexusPortalUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [fuser, setFUser] = useState(null); 
  const dateInputRef = useRef(null);

  const openDatePicker = () => {
    if (!dateInputRef.current) return;
    if (typeof dateInputRef.current.showPicker === 'function') {
      dateInputRef.current.showPicker();
    } else {
      dateInputRef.current.click();
    }
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [viewingLog, setViewingLog] = useState(null);
  const [appData, setAppData] = useState({ users: [], pendingUsers: [], logs: [], holidayRequests: [], leaveApplications: [] });
  const [formData, setFormData] = useState({ email: '', password: '', accessCode: '', fullName: '' });

  const persistUser = (user) => localStorage.setItem('nexusPortalUser', JSON.stringify(user));
  const clearPersistedUser = () => localStorage.removeItem('nexusPortalUser');
  const persistView = (page) => localStorage.setItem('nexusPortalView', page);
  const persistSubView = (page) => localStorage.setItem('nexusPortalSubView', page);
  const persistSelectedDate = (date) => localStorage.setItem('nexusPortalSelectedDate', date);
  const clearPersistedView = () => localStorage.removeItem('nexusPortalView');
  const clearPersistedSubView = () => localStorage.removeItem('nexusPortalSubView');
  const clearPersistedDate = () => localStorage.removeItem('nexusPortalSelectedDate');

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error(err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setFUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!fuser) return;
    // Set up real-time data listener instead of one-time load
    const unsubscribe = onSnapshot(doc(db, appId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAppData({
          users: data.users || [],
          pendingUsers: data.pendingUsers || [],
          logs: data.logs || [],
          holidayRequests: data.holidayRequests || [],
          leaveApplications: data.leaveApplications || []
        });
      }
    });
    return () => unsubscribe();
  }, [fuser]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000); // Auto-dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const isTimedIn = useMemo(() => {
    if (!user) return false;
    const userLogs = (appData.logs || []).filter(l => l.userEmail === user.email);
    return userLogs.length > 0 && userLogs[userLogs.length - 1].type === 'Time In';
  }, [appData.logs, user]);

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  /**
   * Clears all inputs and notification messages
   */
  const resetInterface = () => {
    setFormData({ email: '', password: '', accessCode: '', fullName: '' });
    setError(''); 
    setSuccess('');
  };

  /**
   * Helper function for clean navigation between auth screens
   */
  const navigateTo = (newView) => {
    resetInterface();
    persistView(newView);
    setView(newView);
  };

  const switchSubView = (newSubView) => {
    persistSubView(newSubView);
    setSubView(newSubView);
  };

  const getLogDateString = (timestamp) => {
    const parsed = new Date(timestamp);
    if (isNaN(parsed)) return null;
    return parsed.toISOString().split('T')[0];
  };

  const formatLogTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    if (isNaN(date)) return timestamp;
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return `${day} ${month} ${year}, ${time}`;
  };
  const formatDateLabel = (dateString) => {
    const parsed = new Date(dateString);
    if (isNaN(parsed)) return dateString;
    return parsed.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDisplayDate = (dateString) => {
    const parsed = new Date(dateString);
    if (isNaN(parsed)) return dateString;
    const month = parsed.toLocaleString('en-PH', { month: 'long' });
    const day = String(parsed.getDate()).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const updateSelectedDate = (newDate) => {
    persistSelectedDate(newDate);
    setSelectedDate(newDate);
  };

  const resetSelectedDate = () => {
    updateSelectedDate(todayString);
  };

  const downloadTimeLogReport = () => {
    const filteredLogs = appData.logs.filter(log => getLogDateString(log.timestamp) === selectedDate);
    const headers = ['User Name', 'User Email', 'Type', 'Timestamp'];
    const rows = filteredLogs.map(log => [log.userName, log.userEmail, log.type, log.timestamp]);
    const csv = [headers, ...rows]
      .map(row => row.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TimeLogReport_${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadAppData = async () => {
    try {
      const data = await getAllData();
      setAppData({
        users: data.users || [],
        pendingUsers: data.pendingUsers || [],
        logs: data.logs || [],
        holidayRequests: data.holidayRequests || [],
        leaveApplications: data.leaveApplications || []
      });
    } catch (error) {
      console.error('Failed to load app data:', error);
    }
  };

  const handleRegister = async (e, isAdmin) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    if (isAdmin && formData.accessCode !== CONFIG.REQUIRED_ACCESS_CODE) { 
      setError('Invalid Access Code'); setLoading(false); return; 
    }
    try {
      const newUser = { 
        email: formData.email.toLowerCase().trim(), 
        password: formData.password, 
        fullName: formData.fullName, 
        role: isAdmin ? 'admin' : 'user',
        id: crypto.randomUUID()
      };

      if (isAdmin) {
        await addUser(newUser);
      } else {
        await addPendingUser(newUser);
      }

      setSuccess(isAdmin ? 'Admin created' : 'Enrollment Request Sent');
      setTimeout(() => navigateTo('login'), 2000);
    } catch (err) {
      setError('System error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await loginUser(formData.email.toLowerCase().trim(), formData.password);
      if (result.success) {
        persistUser(result.user);
        persistView('dashboard');
        persistSubView('main');
        setUser(result.user);
        resetInterface();
        setView('dashboard');
        setSubView('main');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId, status) => {
    try {
      await updateUserStatus(userId, status);
      setSuccess(`User has been ${status === 'active' ? 'enabled' : 'disabled'}.`);
      await loadAppData();
    } catch (error) {
      console.error(`Failed to ${status === 'active' ? 'enable' : 'disable'} user:`, error);
      setError(error.message || `Failed to ${status === 'active' ? 'enable' : 'disable'} user.`);
    }
  };

  const handleResetPassword = async (userId, newPassword) => {
    if (!newPassword) {
      setError('Password cannot be empty.');
      return;
    }
    try {
      await resetUserPassword(userId, newPassword);
      setSuccess('Password has been reset successfully.');
      await loadAppData(); // Refresh data to ensure consistency if needed
    } catch (error) {
      console.error('Failed to reset password:', error);
      setError(error.message || 'Failed to reset password.');
    }
  };


  const approveUser = async (u) => {
    try {
      await updateDoc(null, { users: arrayUnion(u), pendingUsers: arrayRemove(u) });
      await loadAppData();
    } catch (error) {
      console.error('Failed to approve user:', error);
    }
  };

  const denyUser = async (u) => {
    try {
      await updateDoc(null, { pendingUsers: arrayRemove(u) });
      await loadAppData();
    } catch (error) {
      console.error('Failed to deny user:', error);
    }
  };

  const approveHolidayRequest = async (req) => {
    console.log('Approving holiday request:', req);
    try {
      console.log('Calling updateDoc with:', { holidayRequests: { __type: 'update', id: req.id, status: 'approved' } });
      await updateDoc(null, { holidayRequests: { __type: 'update', id: req.id, status: 'approved' } });
      console.log('Holiday request approved successfully');
      // Refresh data after approval
      await loadAppData();
    } catch (error) {
      console.error('Failed to approve holiday request:', error);
    }
  };

  const denyHolidayRequest = async (req) => {
    console.log('Denying holiday request:', req);
    try {
      console.log('Calling updateDoc with:', { holidayRequests: { __type: 'update', id: req.id, status: 'denied' } });
      await updateDoc(null, { holidayRequests: { __type: 'update', id: req.id, status: 'denied' } });
      console.log('Holiday request denied successfully');
      // Refresh data after denial
      await loadAppData();
    } catch (error) {
      console.error('Failed to deny holiday request:', error);
    }
  };

  const approveLeaveApplication = async (req) => {
    try {
      await apiUpdateDoc(null, { leaveApplications: { __type: 'update', id: req.id, status: 'approved' } });
      await loadAppData();
    } catch (error) {
      console.error('Failed to approve leave application:', error);
    }
  };

  const denyLeaveApplication = async (req) => {
    try {
      await apiUpdateDoc(null, { leaveApplications: { __type: 'update', id: req.id, status: 'denied' } });
      await loadAppData();
    } catch (error) {
      console.error('Failed to deny leave application:', error);
    }
  };

  const logTime = async (type, image, location) => {
    console.log('Logging time:', type, 'for user:', user.email);
    try {
      await updateDoc(null, { 
        logs: { 
          userEmail: user.email, 
          userName: user.fullName, 
          type,
          image,
          location,
          timestamp: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) 
        } 
      });
      console.log('Time logged successfully, refreshing data...');
      // Refresh data after logging time
      await loadAppData();
      console.log('Data refreshed after logging time');
    } catch (error) {
      console.error('Failed to log time:', error);
    }
  };

  const switchViewAndReset = (view) => {
    resetInterface();
    switchSubView(view);
  };
  if (view === 'landing') return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-4xl w-full animate-in fade-in zoom-in-95 duration-1000">
        <div className="inline-flex p-8 bg-slate-900 rounded-[2.5rem] text-white mb-10 shadow-3xl shadow-indigo-100">
          <ShieldCheck size={72} />
        </div>
        <h1 className="text-7xl md:text-[7rem] font-black text-slate-900 tracking-tighter mb-4 leading-none">
          Nexus <span className="text-indigo-600">Portal</span>
        </h1>
        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.5em] mb-12">
          Integrated Attendance & Holiday Intelligence
        </p>
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-stretch sm:items-center">
          <button onClick={() => navigateTo('login')} className="group px-10 py-6 bg-slate-900 text-white font-black rounded-[1.75rem] hover:bg-slate-800 transition-all shadow-2xl flex items-center justify-center gap-3">
            Identity Verification <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button onClick={() => navigateTo('register-user')} className="px-10 py-6 bg-white text-indigo-600 font-black rounded-[1.75rem] border border-slate-100 shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
            Staff Enrollment <UserPlus size={18} />
          </button>
          <button onClick={() => navigateTo('register-admin')} className="px-10 py-6 bg-slate-50/50 text-slate-500 font-black rounded-[1.75rem] border border-transparent hover:border-slate-200 transition-all flex items-center justify-center gap-3 text-sm">
            Admin Setup
          </button>
        </div>
      </div>
    </div>
  );

  if (view === 'login' || view.includes('register')) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="bg-white p-14 rounded-[3.5rem] shadow-2xl border border-slate-100 w-full max-w-lg relative animate-in fade-in slide-in-from-bottom-8 duration-500">
        <button onClick={() => navigateTo('landing')} className="absolute left-10 top-12 p-3 hover:bg-slate-50 rounded-2xl text-slate-400"><ArrowLeft size={24} /></button>
        <h2 className="text-4xl font-black text-slate-900 text-center mb-10 tracking-tighter">{view === 'login' ? 'Nexus Authentication' : 'Secure Registration'}</h2>
        
        {error && <div className="mb-8 p-5 bg-rose-50 text-rose-600 rounded-3xl text-xs font-black animate-in fade-in slide-in-from-top-2">{error}</div>}
        {success && <div className="mb-8 p-5 bg-emerald-50 text-emerald-600 rounded-3xl text-xs font-black animate-in fade-in slide-in-from-top-2">{success}</div>}
        
        <form onSubmit={view === 'login' ? handleLogin : (e) => handleRegister(e, view === 'register-admin')} className="space-y-4">
          {view !== 'login' && (
            <>
              {view === 'register-admin' && <input type="text" name="accessCode" value={formData.accessCode} placeholder="Secure Access Code" required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none" onChange={handleInputChange}/>}
              <input type="text" name="fullName" value={formData.fullName} placeholder="Full Name" required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none" onChange={handleInputChange}/>
            </>
          )}
          <input type="email" name="email" value={formData.email} placeholder="Corporate Email" required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none" onChange={handleInputChange}/>
          <input type="password" name="password" value={formData.password} placeholder="Password" required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none" onChange={handleInputChange}/>
          <button disabled={loading} className="w-full py-6 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] rounded-3xl shadow-xl hover:bg-indigo-600 transition-all pt-8 disabled:opacity-50">
            {loading ? 'Processing...' : 'Process Identity'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white px-12 py-6 flex justify-between items-center border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-3 font-black text-2xl tracking-tighter text-slate-900">
          <ShieldCheck className="text-indigo-600" size={32} />
          <span>Nexus <span className="text-indigo-600">Portal</span></span>
        </div>
        <button onClick={() => { clearPersistedUser(); clearPersistedView(); clearPersistedSubView(); clearPersistedDate(); setUser(null); navigateTo('login'); }} className="p-3.5 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all"><LogOut size={22} /></button>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto p-12">
        {subView === 'calendar' ? <HolidayCalendarView setSubView={switchViewAndReset} currentUser={user} appData={appData} refreshData={loadAppData} /> : subView === 'leave-application' ? <LeaveApplicationView setSubView={switchViewAndReset} currentUser={user} refreshData={loadAppData} appData={appData} /> : subView === 'enrolled-users' ? <EnrolledUsersView setSubView={switchViewAndReset} appData={appData} onResetPassword={handleResetPassword} onUpdateUserStatus={handleUpdateUserStatus} formatLogTimestamp={formatLogTimestamp} loadAppData={loadAppData} /> : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {user?.role === 'admin' ? (
              <div className="space-y-10">
                {/* Admin Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Activity size={24}/></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Logs Today</p>
                        <p className="text-3xl font-black text-slate-900">{(appData.logs || []).filter(l => l.timestamp.includes(new Date().toLocaleDateString('en-PH'))).length}</p>
                      </div>
                   </div>
                   <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
                      <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><Briefcase size={24}/></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clearance Pending</p>
                        <p className="text-3xl font-black text-slate-900">{(appData.holidayRequests || []).filter(r => r.status === 'pending').length + (appData.leaveApplications || []).filter(r => r.status === 'pending').length}</p>
                      </div>
                   </div>
                   <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><Users size={24}/></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enrollment Requests</p>
                        <p className="text-3xl font-black text-slate-900">{appData.pendingUsers.length}</p>
                      </div>
                   </div>
                   <button onClick={() => switchSubView('enrolled-users')} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6 text-left hover:border-indigo-300 hover:shadow-lg transition-all">
                      <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center"><UserCheck size={24}/></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employees</p>
                        <p className="text-3xl font-black text-slate-900">{appData.users.length}</p>
                      </div>
                   </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Left Column: Approvals (8 cols) */}
                  <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Work Request Panel */}
                      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                          <h3 className="font-black text-[10px] tracking-[0.3em] text-slate-400 uppercase">Work on Holiday Request</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                          {(appData.holidayRequests || []).filter(r => r.status === 'pending').length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300">
                              <CheckCircle2 size={32} className="mb-4 opacity-20" />
                              <p className="text-[9px] font-black uppercase tracking-widest">Clear</p>
                            </div>
                          ) : (appData.holidayRequests || []).filter(r => r.status === 'pending').map(r => (
                            <div key={r.id} className="p-6 hover:bg-slate-50 transition-colors">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <p className="font-black text-slate-900 text-sm">{r.userName}</p>
                                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{r.holidayName}</p>
                                </div>
                                <div className="flex gap-1.5">
                                  <button onClick={() => denyHolidayRequest(r)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><X size={16}/></button>
                                  <button onClick={() => approveHolidayRequest(r)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Check size={16}/></button>
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2 italic">"{r.details}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Leave Application Panel */}
                      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                          <h3 className="font-black text-[10px] tracking-[0.3em] text-slate-400 uppercase">Leave Applications</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                          {(appData.leaveApplications || []).filter(r => r.status === 'pending').length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300">
                              <CheckCircle2 size={32} className="mb-4 opacity-20" />
                              <p className="text-[9px] font-black uppercase tracking-widest">All Clear</p>
                            </div>
                          ) : (appData.leaveApplications || []).filter(r => r.status === 'pending').map(r => (
                            <div key={r.id} className="p-6 hover:bg-slate-50 transition-colors">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <p className="font-black text-slate-900 text-sm">{r.userName}</p>
                                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{r.leaveType} ({new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()})</p>
                                </div>
                                <div className="flex gap-1.5">
                                  <button onClick={() => denyLeaveApplication(r)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><X size={16}/></button>
                                  <button onClick={() => approveLeaveApplication(r)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Check size={16}/></button>
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2 italic">"{r.details}"</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Staff Enrollment Panel */}
                      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                          <h3 className="font-black text-[10px] tracking-[0.3em] text-slate-400 uppercase">Staff Enrollment</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                          {appData.pendingUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300">
                              <Users size={32} className="mb-4 opacity-20" />
                              <p className="text-[9px] font-black uppercase tracking-widest">Clear</p>
                            </div>
                          ) : (
                            appData.pendingUsers.map(u => (
                              <div key={u.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div>
                                  <p className="font-black text-slate-900 text-sm">{u.fullName}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">{u.email}</p>
                                </div>
                                <div className="flex gap-1.5">
                                  <button onClick={() => denyUser(u)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><X size={16}/></button>
                                  <button onClick={() => approveUser(u)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Check size={16}/></button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Attendance Logs (4 cols) */}
                  <div className="lg:col-span-4 bg-slate-900 rounded-[3rem] shadow-2xl flex flex-col h-[500px] overflow-hidden">
                    <div className="p-8 border-b border-slate-800">
                      <div className="flex justify-between items-center gap-4">
                        <h3 className="font-black text-[10px] tracking-[0.3em] text-slate-500 uppercase flex items-center gap-2">
                          <History size={14} className="text-indigo-400" /> Daily Time Log
                        </h3>
                        <Activity className="text-emerald-500 animate-pulse" size={16} />
                      </div>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:w-auto">
                          <label className="sr-only" htmlFor="daily-log-date">Select date</label>
                          <input
                            ref={dateInputRef}
                            id="daily-log-date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => updateSelectedDate(e.target.value)}
                            max={todayString}
                            className="sr-only"
                          />
                          <div
                            onClick={openDatePicker}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDatePicker(); } }}
                            role="button"
                            tabIndex={0}
                            className="px-4 py-3 bg-slate-800 text-slate-200 rounded-2xl border border-slate-700 hover:border-indigo-500 transition-all min-w-[220px] cursor-pointer"
                          >
                            {formatDisplayDate(selectedDate)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={downloadTimeLogReport}
                          className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all"
                          aria-label="Download Report"
                        >
                          <DownloadCloud size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {appData.logs.filter(log => getLogDateString(log.timestamp) === selectedDate).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-700">
                          <p className="text-[9px] font-black uppercase tracking-widest">No logs found for this date</p>
                        </div>
                      ) : (
                        [...appData.logs].filter(log => getLogDateString(log.timestamp) === selectedDate).reverse().map((log, i) => (
                          <div key={i} onClick={() => log.image && setViewingLog(log)} className={`p-4 bg-slate-800/50 rounded-2xl border border-slate-800 flex items-start justify-between group transition-all ${log.image ? 'cursor-pointer hover:bg-slate-800' : 'cursor-default'}`}>
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0 text-center">
                                {log.image ? (
                                  <img src={log.image} alt="User capture" className="w-12 h-12 rounded-lg object-cover border-2 border-slate-700 group-hover:border-indigo-500 transition-colors" />
                                ) : (
                                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 bg-slate-700/50 rounded-lg"><Camera size={16} className="text-slate-600" /></div>
                                )}
                                <span className={`mt-1.5 inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${log.type === 'Time In' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                  {log.type.includes('In') ? 'IN' : 'OUT'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-100 truncate">{log.userName}</p><p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">{formatLogTimestamp(log.timestamp)}</p>
                                {log.location && (
                                  <p className="text-[10px] font-mono text-slate-500 mt-2 flex items-start gap-1.5" title={log.location}><MapPin size={12} className="flex-shrink-0 mt-0.5" /> <span>{log.location}</span></p>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="flex items-center justify-end gap-2 mb-1.5">
                                <span className={`w-2 h-2 rounded-full ${log.type === 'Time In' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in">
                <div className="mb-10">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Welcome, {user?.fullName}</h2>
                  <p className="text-slate-500">What would you like to do today?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col hover:shadow-2xl transition-all relative overflow-hidden group">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mb-6 shadow-xl"><Timer className="text-white" size={24} /></div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Attendance</h3>
                    <div className="mt-auto space-y-3">
                      <button onClick={() => setShowCamera(true)} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isTimedIn ? 'bg-rose-50 text-rose-600' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>
                        {isTimedIn ? 'Clock Out' : 'Clock In'}
                      </button>
                      <button onClick={() => setShowHistory(true)} className="w-full text-center text-[9px] font-black text-slate-300 hover:text-indigo-600 tracking-widest uppercase">History</button>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col hover:shadow-2xl transition-all relative overflow-hidden group">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center mb-6 shadow-xl"><CalendarIcon className="text-white" size={24} /></div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Calendar</h3>
                    <div className="mt-auto">
                      <button onClick={() => switchViewAndReset('calendar')} className="flex items-center justify-between w-full p-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all">
                        View Holidays <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col hover:shadow-2xl transition-all relative overflow-hidden group">
                    <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center mb-6 shadow-xl"><FileText className="text-white" size={24} /></div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-black text-slate-900 mb-2">Leave Request</h3>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400">Credits</p>
                        <p className="font-black text-2xl text-teal-500">{(appData.users.find(u => u.email === user?.email) || {leaveCredits: 0}).leaveCredits}</p>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <button onClick={() => switchViewAndReset('leave-application')} className="flex items-center justify-between w-full p-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all">
                        File a Leave <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Notification */}
      {(success || error) && (
        <div className="fixed bottom-8 right-8 z-[100] w-full max-w-sm">
          <div className={`p-6 rounded-3xl shadow-2xl border flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
            success 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {success ? <CheckCircle2 size={24} className="text-emerald-500" /> : <AlertCircle size={24} className="text-rose-500" />}
            <p className="text-sm font-bold flex-1">{success || error}</p>
            <button onClick={() => { setSuccess(''); setError(''); }} className="p-1 -m-1"><X size={18} /></button>
          </div>
        </div>
      )}
      {showHistory && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
          <div className="relative w-full max-w-lg bg-white h-full shadow-3xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-12 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">History</h2>
              <button onClick={() => setShowHistory(false)} className="p-3 text-slate-400 hover:text-rose-500"><X size={32}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 space-y-4 custom-scrollbar">
              {(appData.logs || []).filter(l => l.userEmail === user?.email).reverse().map((log, i) => (
                <div key={i} className="p-4 border border-slate-100 rounded-[1.5rem] bg-slate-50/50 flex items-start gap-4">
                  {log.image ? (
                    <img src={log.image} alt="Log capture" className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200" />
                  ) : (
                    <div className="w-16 h-16 flex-shrink-0 bg-slate-100 rounded-xl flex items-center justify-center"><Camera size={20} className="text-slate-400" /></div>
                  )}
                  <div className="flex-1">
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md mb-1.5 inline-block ${log.type === 'Time In' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {log.type}
                    </span>
                    <p className="text-xs font-bold text-slate-600">{formatLogTimestamp(log.timestamp)}</p>
                    {log.location && <p className="text-[10px] font-mono text-slate-400 mt-1">{log.location}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showCamera && (
        <CameraModal 
          onClose={() => setShowCamera(false)} 
          onCapture={(image, location) => logTime(isTimedIn ? 'Time Out' : 'Time In', image, location)} />
      )}
      {viewingLog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setViewingLog(null)}>
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
          <div className="relative max-w-lg w-full animate-in fade-in zoom-in-95 duration-300">
            <img src={viewingLog.image} alt="Log Capture" className="rounded-3xl shadow-2xl w-full" />
            {viewingLog.location && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-3 rounded-2xl backdrop-blur-sm border border-white/10 text-center">
                <p className="text-xs font-mono flex items-start justify-center gap-2 text-center" title={viewingLog.location}><MapPin size={14} className="flex-shrink-0 mt-0.5" /> <span>{viewingLog.location}</span></p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LeaveApplicationView = ({ setSubView, currentUser, refreshData, appData }) => {
  const [formData, setFormData] = useState({ leaveType: 'Vacation', startDate: '', endDate: '', details: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentUserData = appData.users.find(u => u.email === currentUser.email);
  const leaveCredits = currentUserData ? currentUserData.leaveCredits : 0;

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    return Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    if (!formData.startDate || !formData.endDate || !formData.details) {
      setError('Please fill out all fields.');
      setLoading(false);
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('Start date cannot be after end date.');
      setLoading(false);
      return;
    }

    const duration = calculateDuration(formData.startDate, formData.endDate);
    if (leaveCredits < duration) {
      setError(`Insufficient leave credits. You only have ${leaveCredits} credits available.`);
      setLoading(false);
      return;
    }

    try {
      const newApplication = {
        id: crypto.randomUUID(),
        userEmail: currentUser.email,
        userName: currentUser.fullName,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        details: formData.details,
        status: 'pending',
        timestamp: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
      };
      await apiUpdateDoc(null, { leaveApplications: arrayUnion(newApplication) });
      setSuccess('Leave application submitted successfully.');
      await refreshData();
      setFormData({ leaveType: 'Vacation', startDate: '', endDate: '', details: '' }); // Reset form
    } catch (err) {
      setError('Failed to submit application. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => setSubView('main')} className="p-3.5 bg-white text-slate-500 hover:text-slate-900 rounded-2xl transition-all border border-slate-200"><ArrowLeft size={22} /></button>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">File a Leave Application</h2>
      </div>

      <div className="mb-8 bg-indigo-50 border border-indigo-200 text-indigo-800 p-6 rounded-3xl flex items-center justify-between">
        <p className="text-sm font-bold">Your available leave credits:</p>
        <p className="text-3xl font-black">{leaveCredits}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm">
          {error && <div className="mb-8 p-5 bg-rose-50 text-rose-600 rounded-3xl text-xs font-black">{error}</div>}
          {success && <div className="mb-8 p-5 bg-emerald-50 text-emerald-600 rounded-3xl text-xs font-black">{success}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <select name="leaveType" value={formData.leaveType} onChange={handleInputChange} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none appearance-none">
              <option>Vacation</option>
              <option>Sick Leave</option>
              <option>Emergency</option>
              <option>Other</option>
            </select>
            <div className="grid grid-cols-2 gap-4">
              <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none" required />
              <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none" required />
            </div>
            <textarea name="details" value={formData.details} onChange={handleInputChange} placeholder="Reason for leave..." rows="4" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none" required></textarea>
            <button disabled={loading || (leaveCredits < calculateDuration(formData.startDate, formData.endDate))} className="w-full py-6 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] rounded-3xl shadow-xl hover:bg-teal-600 transition-all disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Submit Application'}
            </button>
          </form>
        </div>
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
            <h3 className="font-black text-[10px] tracking-[0.3em] text-slate-400 uppercase">My Leave Applications</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar p-4">
            {(appData.leaveApplications || []).filter(r => r.userEmail === currentUser.email).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <FileText size={32} className="mb-4 opacity-20" />
                <p className="text-[9px] font-black uppercase tracking-widest">No applications filed</p>
              </div>
            ) : (appData.leaveApplications || []).filter(r => r.userEmail === currentUser.email).map(r => (
              <div key={r.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                <div>
                  <p className="font-black text-slate-900 text-sm">{r.leaveType}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</p>
                </div>
                <span className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-full ${
                  r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
                  r.status === 'denied' ? 'bg-rose-500/10 text-rose-600' :
                  'bg-amber-500/10 text-amber-600'
                }`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const EnrolledUsersView = ({ setSubView, appData, onResetPassword, onUpdateUserStatus, formatLogTimestamp, loadAppData }) => {
  const admins = (appData.users || []).filter(u => u.role === 'admin');
  const regularUsers = (appData.users || []).filter(u => u.role !== 'admin');
  const [activeTab, setActiveTab] = useState('users');
  const [passwordResetUser, setPasswordResetUser] = useState(null);
  const [viewingUserHistory, setViewingUserHistory] = useState(null);
  const [viewingUserLeaveRequests, setViewingUserLeaveRequests] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [leaveCreditUser, setLeaveCreditUser] = useState(null);

  const handleUpdateLeaveCredits = async (userId, credits) => {
    const newCredits = parseInt(credits, 10);
    if (isNaN(newCredits) || newCredits < 0) {
      // You should show an error to the user here.
      return;
    }
    await loadAppData();
    setLeaveCreditUser(null);
  };

  const UserRow = ({ user, onShowHistory, onShowLeaveRequests }) => (
    <div className="p-6 flex items-center justify-between">
      <div>
        <p className={`font-black text-slate-900 text-sm ${user.status === 'disabled' ? 'line-through text-slate-400' : ''}`}>{user.fullName}</p>
        <p className={`text-sm ${user.status === 'disabled' ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="text-right mr-2">
          <p className="text-xs font-bold text-slate-400">Credits</p>
          <p className="font-black text-lg text-indigo-600">{user.leaveCredits}</p>
        </div>
        <button onClick={() => onShowHistory(user)} className="p-2.5 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-600 hover:text-white transition-all" title="View Time Log History"><History size={16}/></button>
        <button onClick={() => onShowLeaveRequests(user)} className="p-2.5 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-600 hover:text-white transition-all" title="View Leave Requests"><FileText size={16}/></button>
        <button onClick={() => setLeaveCreditUser(user)} className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all" title="Update Leave Credits"><RefreshCw size={16}/></button>
        {user.status === 'disabled' ? (
          <button onClick={() => onUpdateUserStatus(user.id, 'active')} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all" title="Enable User">
            <Power size={16}/>
          </button>
        ) : (
          <button onClick={() => onUpdateUserStatus(user.id, 'disabled')} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all" title="Disable User">
            <Power size={16}/>
          </button>
        )}
      </div>
    </div>
  );
  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setSubView('main')} className="p-3.5 bg-white text-slate-500 hover:text-slate-900 rounded-2xl transition-all border border-slate-200"><ArrowLeft size={22} /></button>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Employees</h2>
      </div>

        {/* Tab Navigation */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200/70'}`}
          >
            Users ({regularUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'admins' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200/70'}`}
          >
            Administrators ({admins.length})
          </button>
        </div>
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">

        <div className="overflow-y-auto custom-scrollbar max-h-[65vh]">
          {/* Users Tab Content */}
          <div className={`${activeTab === 'users' ? 'block' : 'hidden'}`}>
            {regularUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-300 p-8"><Users size={32} className="mb-4 opacity-20" /><p className="text-[9px] font-black uppercase tracking-widest">No users enrolled</p></div>
            ) : (
              <div className="divide-y divide-slate-50">
                {regularUsers.map(user => <UserRow key={user.id} user={user} onShowHistory={setViewingUserHistory} onShowLeaveRequests={setViewingUserLeaveRequests} />)}
              </div>
            )}
          </div>

          {/* Admins Tab Content */}
          <div className={`${activeTab === 'admins' ? 'block' : 'hidden'}`}>
            {admins.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-300 p-8"><Users size={32} className="mb-4 opacity-20" /><p className="text-[9px] font-black uppercase tracking-widest">No administrators found</p></div>
            ) : (
              <div className="divide-y divide-slate-50">
                {admins.map(user => <UserRow key={user.id} user={user} onShowHistory={setViewingUserHistory} onShowLeaveRequests={setViewingUserLeaveRequests} />)}
              </div>
            )}
          </div>
        </div>
      </div>
      {leaveCreditUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setLeaveCreditUser(null)}></div>
          <div className="relative bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Update Leave Credits</h3>
            <p className="text-sm text-slate-500 mb-6">Set a new leave credit balance for <span className="font-bold">{leaveCreditUser.fullName}</span>.</p>
            <div className="space-y-4">
              <input
                type="number"
                defaultValue={leaveCreditUser.leaveCredits}
                onKeyDown={(e) => { if (e.key === 'Enter') { handleUpdateLeaveCredits(leaveCreditUser.id, e.target.value); } }}
                className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none"
              />
              <div className="flex gap-4">
                <button onClick={() => setLeaveCreditUser(null)} className="w-full py-5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-[0.3em] rounded-3xl hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={(e) => handleUpdateLeaveCredits(leaveCreditUser.id, e.currentTarget.parentNode.previousElementSibling.value)} className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] rounded-3xl shadow-xl hover:bg-indigo-600 transition-all">Update</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {passwordResetUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPasswordResetUser(null)}></div>
          <div className="relative bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Reset Password</h3>
            <p className="text-sm text-slate-500 mb-6">Enter a new password for <span className="font-bold">{passwordResetUser.fullName}</span>.</p>
            <div className="space-y-4">
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="New Password" 
                className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none"
              />
              <div className="flex gap-4">
                <button onClick={() => { setPasswordResetUser(null); setNewPassword(''); }} className="w-full py-5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-[0.3em] rounded-3xl hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={() => { onResetPassword(passwordResetUser.id, newPassword); setPasswordResetUser(null); setNewPassword(''); }} disabled={!newPassword} className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] rounded-3xl shadow-xl hover:bg-indigo-600 transition-all disabled:opacity-50">Reset</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {viewingUserHistory && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingUserHistory(null)}></div>
          <div className="relative w-full max-w-lg bg-white h-full shadow-3xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-12 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Time Log History</h2>
                <p className="text-slate-500">{viewingUserHistory.fullName}</p>
              </div>
              <button onClick={() => setViewingUserHistory(null)} className="p-3 text-slate-400 hover:text-rose-500"><X size={32}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 space-y-4 custom-scrollbar">
              {[...(appData.logs || [])].filter(l => l.userEmail === viewingUserHistory.email).reverse().map((log, i) => (
                <div key={i} className="p-4 border border-slate-100 rounded-[1.5rem] bg-slate-50/50 flex items-start gap-4">
                  {log.image ? (
                    <img src={log.image} alt="Log capture" className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200" />
                  ) : (
                    <div className="w-16 h-16 flex-shrink-0 bg-slate-100 rounded-xl flex items-center justify-center"><Camera size={20} className="text-slate-400" /></div>
                  )}
                  <div className="flex-1">
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md mb-1.5 inline-block ${log.type === 'Time In' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {log.type}
                    </span>
                    <p className="text-xs font-bold text-slate-600">{formatLogTimestamp(log.timestamp)}</p>
                    {log.location && <p className="text-[10px] font-mono text-slate-400 mt-1">{log.location}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {viewingUserLeaveRequests && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingUserLeaveRequests(null)}></div>
          <div className="relative w-full max-w-lg bg-white h-full shadow-3xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-12 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Leave Requests</h2>
                <p className="text-slate-500">{viewingUserLeaveRequests.fullName}</p>
              </div>
              <button onClick={() => setViewingUserLeaveRequests(null)} className="p-3 text-slate-400 hover:text-rose-500"><X size={32}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
              {(appData.leaveApplications || []).filter(r => r.userEmail === viewingUserLeaveRequests.email).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 p-8">
                  <FileText size={32} className="mb-4 opacity-20" />
                  <p className="text-[9px] font-black uppercase tracking-widest">No leave requests found</p>
                </div>
              ) : (
                [...(appData.leaveApplications || [])].filter(r => r.userEmail === viewingUserLeaveRequests.email).reverse().map((req, i) => (
                  <div key={i} className="p-6 border border-slate-100 rounded-[1.5rem] bg-slate-50/50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-black text-slate-900 text-sm">{req.leaveType}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-full ${ req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : req.status === 'denied' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600' }`}>{req.status}</span>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-100 p-4 rounded-xl border border-slate-200 italic">"{req.details}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CameraModal = ({ onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState('Fetching location...');

  // Effect to manage the camera stream
  useEffect(() => {
    let streamInstance;
    const startCamera = async () => {
      try {
        streamInstance = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(streamInstance);
        if (videoRef.current) {
          videoRef.current.srcObject = streamInstance;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        onClose(); // Close modal if camera access is denied
      }
    };

    const getLocation = async () => {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        setLocation(data.display_name || 'Location details not available');
      } catch (error) {
        console.warn("Could not get location or address:", error);
        setLocation('Location not available');
      }
    };

    startCamera();
    getLocation();

    // Cleanup function to stop the stream when the modal closes
    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach(track => track.stop());
      }
    };
  }, [onClose]); // Only re-run if onClose changes

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      setCapturedImage(canvas.toDataURL('image/jpeg'));
    }
  };

  // Effect to handle the countdown timer
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      captureImage();
      setCountdown(null);
      return;
    }
    const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timerId);
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300 text-center">
        <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-4">Identity Verification</h3>
        <div className="bg-slate-900 rounded-2xl overflow-hidden mb-6 aspect-video flex items-center justify-center">
          {capturedImage ? (
            <img src={capturedImage} alt="User capture" className="w-full h-full object-cover" />
          ) : (
            <div className="relative w-full h-full">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
              <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                <div className="bg-black/50 text-white text-xs p-2 rounded-lg flex items-center gap-1.5 backdrop-blur-sm border border-white/10">
                  <MapPin size={12} />
                  <span>{location}</span>
                </div>
              </div>
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-9xl font-black text-white drop-shadow-lg animate-in fade-in zoom-in-50">
                    {countdown > 0 ? countdown : '📸'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        {capturedImage ? (
          <div className="flex gap-4">
            <button onClick={() => { setCapturedImage(null); setCountdown(null); }} className="w-full py-5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-[0.3em] rounded-3xl hover:bg-slate-200 transition-all">Retake</button>
            <button 
              onClick={async () => { 
                await onCapture(capturedImage, location); 
                onClose(); 
              }} 
              className="w-full py-5 bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.3em] rounded-3xl shadow-xl hover:bg-emerald-600 transition-all">
              Continue
            </button>
          </div>
        ) : (
          <button onClick={() => setCountdown(5)} disabled={countdown !== null} className="w-full py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.3em] rounded-3xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            <Camera size={16} /> {countdown !== null ? `Capturing in ${countdown}...` : 'Capture and Clock In/Out'}
          </button>
        )}
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

export default App;