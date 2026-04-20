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
  FileText,
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
  updateDoc as apiUpdateDoc
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

  const logTime = async (type) => {
    console.log('Logging time:', type, 'for user:', user.email);
    try {
      await updateDoc(null, { 
        logs: { 
          userEmail: user.email, 
          userName: user.fullName, 
          type, 
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
        {subView === 'calendar' ? <HolidayCalendarView setSubView={switchViewAndReset} currentUser={user} appData={appData} refreshData={loadAppData} /> : subView === 'leave-application' ? <LeaveApplicationView setSubView={switchViewAndReset} currentUser={user} refreshData={loadAppData} /> : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {user?.role === 'admin' ? (
              <div className="space-y-10">
                {/* Admin Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          <div key={i} className="p-5 bg-slate-800/50 rounded-2xl border border-slate-800 flex items-center justify-between group transition-all hover:bg-slate-800">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${log.type === 'Time In' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></span>
                                <p className="text-[11px] font-black text-slate-100">{log.userName}</p>
                              </div>
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{log.timestamp}</p>
                            </div>
                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${log.type === 'Time In' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              {log.type.includes('In') ? 'IN' : 'OUT'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col hover:shadow-2xl transition-all relative overflow-hidden group">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mb-6 shadow-xl"><Timer className="text-white" size={24} /></div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Attendance</h3>
                  <div className="mt-auto space-y-3">
                    <button onClick={() => logTime(isTimedIn ? 'Time Out' : 'Time In')} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isTimedIn ? 'bg-rose-50 text-rose-600' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>
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
                  <h3 className="text-xl font-black text-slate-900 mb-2">Leave Request</h3>
                  <div className="mt-auto">
                    <button onClick={() => switchViewAndReset('leave-application')} className="flex items-center justify-between w-full p-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all">
                      File a Leave <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

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
                <div key={i} className="p-7 border border-slate-100 rounded-[2rem] bg-slate-50/50 flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full mb-3 inline-block shadow-sm ${log.type === 'Time In' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{log.type}</span>
                  <p className="text-sm font-black text-slate-900">{log.timestamp}</p>
                  <Clock className="text-slate-300" size={24}/>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LeaveApplicationView = ({ setSubView, currentUser, refreshData }) => {
  const [formData, setFormData] = useState({ leaveType: 'Vacation', startDate: '', endDate: '', details: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      await apiUpdateDoc(null, { leaveApplications: newApplication });
      setSuccess('Leave application submitted successfully.');
      await refreshData();
      setTimeout(() => setSubView('main'), 2000);
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

      <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm">
        {error && <div className="mb-8 p-5 bg-rose-50 text-rose-600 rounded-3xl text-xs font-black">{error}</div>}
        {success && <div className="mb-8 p-5 bg-emerald-50 text-emerald-600 rounded-3xl text-xs font-black">{success}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <select name="leaveType" value={formData.leaveType} onChange={handleInputChange} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none appearance-none">
            <option>Vacation</option><option>Sick Leave</option><option>Emergency</option><option>Other</option>
          </select>
          <div className="grid grid-cols-2 gap-4">
            <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none" required />
            <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none" required />
          </div>
          <textarea name="details" value={formData.details} onChange={handleInputChange} placeholder="Reason for leave..." rows="4" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none" required></textarea>
          <button disabled={loading} className="w-full py-6 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] rounded-3xl shadow-xl hover:bg-teal-600 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;