import React, { useState, useEffect } from 'react';
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
  Activity
} from 'lucide-react';
import { updateDoc, arrayUnion, doc, db, appId } from '../config/api';

const HolidayCalendarView = ({ setSubView, currentUser, appData, refreshData }) => {
  const now = new Date();
  const [currentViewDate, setCurrentViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [holidays, setHolidays] = useState([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(true);
  
  // State for Work Request Modal
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [requestDetails, setRequestDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const today = new Date();
  
  useEffect(() => {
    const fetchHolidays = async (retryCount = 0) => {
      const year = currentViewDate.getFullYear();
      try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`);
        if (!response.ok) throw new Error('API limit reached');
        const data = await response.json();
        const formattedHolidays = data.map(h => ({
          date: h.date,
          name: h.localName || h.name,
          type: h.types.includes('Public') ? 'Regular' : 'Special'
        }));
        setHolidays(formattedHolidays);
        setIsLoadingHolidays(false);
      } catch (err) {
        if (retryCount < 5) {
          setTimeout(() => fetchHolidays(retryCount + 1), Math.pow(2, retryCount) * 1000);
        } else {
          setIsLoadingHolidays(false);
        }
      }
    };
    fetchHolidays();
  }, [currentViewDate.getFullYear()]);

  // Handle requesting to work on a holiday
  const handleWorkRequest = async () => {
    if (!requestDetails.trim()) return;
    setIsSubmitting(true);
    try {
      const newRequest = {
        id: crypto.randomUUID(),
        userEmail: currentUser.email,
        userName: currentUser.fullName,
        holidayName: selectedHoliday.name,
        holidayDate: selectedHoliday.date,
        details: requestDetails,
        status: 'pending',
        timestamp: new Date().toLocaleString()
      };
      await updateDoc(null, { holidayRequests: newRequest });
      if (typeof refreshData === 'function') {
        await refreshData();
      }
      setSelectedHoliday(null);
      setRequestDetails("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  const prevMonth = () => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1));
  const nextMonth = () => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1));
  const goToday = () => setCurrentViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthName = currentViewDate.toLocaleString('default', { month: 'long' });
  const year = currentViewDate.getFullYear();

  const renderCalendar = () => {
    const totalDays = daysInMonth(year, currentViewDate.getMonth());
    const startDay = firstDayOfMonth(year, currentViewDate.getMonth());
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 border-b border-r border-slate-100 bg-slate-50/40"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const holiday = holidays.find(h => h.date === dateStr);
      const isToday = today.getFullYear() === year && today.getMonth() === currentViewDate.getMonth() && today.getDate() === day;
      
      days.push(
        <div key={day} className={`h-24 md:h-32 border-b border-r border-slate-100 p-3 relative transition-all ${holiday ? 'bg-indigo-50/30' : 'hover:bg-indigo-50/10'} ${isToday ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/20' : ''}`}>
          <div className="flex justify-between items-start">
            <span className={`text-[11px] font-black flex items-center justify-center w-8 h-8 rounded-xl transition-all ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : 'text-slate-400'}`}>
              {day}
            </span>
          </div>
          {holiday && (
            <div className="mt-2">
              <p className="text-[10px] font-black text-slate-800 leading-tight mb-1 line-clamp-2">{holiday.name}</p>
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Request Submission Modal */}
      {selectedHoliday && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedHoliday(null)}></div>
          <div className="bg-white w-full max-md rounded-[2.5rem] p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Request Clearance</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{selectedHoliday.name}</p>
            
            <textarea 
              className="w-full h-32 p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:border-indigo-500 font-bold text-sm mb-6 resize-none"
              placeholder="Provide reason for working on this holiday..."
              value={requestDetails}
              onChange={(e) => setRequestDetails(e.target.value)}
            />
            
            <div className="flex gap-3">
              <button onClick={() => setSelectedHoliday(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
              <button 
                disabled={isSubmitting || !requestDetails.trim()} 
                onClick={handleWorkRequest}
                className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-5">
          <button onClick={() => setSubView('main')} className="p-3.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-2xl shadow-sm transition-all hover:scale-105 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Holiday Calendar</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
              <MapPin size={12} className="text-indigo-500" /> PH National Schedule • {year}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-[1.25rem] border border-slate-200 shadow-sm self-start">
          <button onClick={prevMonth} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><ChevronLeft size={20}/></button>
          <button onClick={goToday} className="px-5 py-2.5 text-[10px] font-black text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all uppercase tracking-widest">Today</button>
          <h2 className="text-sm font-black text-slate-800 min-w-[160px] text-center">{monthName} {year}</h2>
          <button onClick={nextMonth} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col h-[600px]">
            <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Info size={14} className="text-indigo-500" /> Upcoming PH
            </h4>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {isLoadingHolidays ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-300">
                  <Loader2 className="animate-spin" size={32} />
                </div>
              ) : holidays.filter(h => new Date(h.date) >= new Date(today.setHours(0,0,0,0))).map((h, i) => {
                const existingRequest = (appData.holidayRequests || []).find(r => r.holidayDate === h.date && r.userEmail === currentUser.email);
                return (
                  <button 
                    key={i} 
                    disabled={!!existingRequest}
                    onClick={() => setSelectedHoliday(h)}
                    className="w-full text-left p-5 hover:bg-indigo-50/40 rounded-3xl transition-all border border-transparent hover:border-indigo-100 group relative disabled:cursor-not-allowed"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight pr-4">{h.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] uppercase font-black tracking-widest ${h.type === 'Regular' ? 'text-rose-500' : 'text-amber-500'}`}>{h.type}</span>
                      <span className="text-[9px] font-black text-slate-400">
                        {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {existingRequest && (
                      <div className={`mt-3 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest text-center ${existingRequest.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : existingRequest.status === 'denied' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                        {existingRequest.status === 'approved' ? 'Clearance Granted' : existingRequest.status === 'denied' ? 'Clearance Denied' : 'Clearance Pending'}
                        <span className="block mt-1 text-[7px] text-slate-500 uppercase tracking-[0.2em]">{existingRequest.status}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden relative">
          <div className="grid grid-cols-7 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] py-6 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 border-l border-slate-100">
            {renderCalendar()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidayCalendarView;