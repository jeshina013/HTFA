import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import SignaturePad from './components/signatures/SignaturePad';
import AdminLogin from './components/AdminLogin';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  SAFETY_ITEMS, 
  SERVICE_TYPES, 
  EQUIPMENT_TYPES 
} from './config';

// Helper to format time as "hh.mm am/pm"
function formatTime(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strHours = String(hours).padStart(2, '0');
  return `${strHours}.${minutes} ${ampm}`;
}

export default function App() {
  // Authentication & Supabase States
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [reportId, setReportId] = useState('RPT-000001');
  const [toast, setToast] = useState({ message: '', isError: false });
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const formRef = useRef(null);

  // Form Fields State
  const [serviceType, setServiceType] = useState('');
  const [jobStatus, setJobStatus] = useState('');
  const [parts, setParts] = useState(() => [
    { id: 1, desc: '', no: '', qty: 1 },
    { id: 2, desc: '', no: '', qty: 1 },
    { id: 3, desc: '', no: '', qty: 1 },
    { id: 4, desc: '', no: '', qty: 1 },
    { id: 5, desc: '', no: '', qty: 1 },
  ]);
  
  // Controlled fields
  const [clientName, setClientName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [interventionDate, setInterventionDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [technicianName, setTechnicianName] = useState('');
  const [timeIn, setTimeIn] = useState('08:00');
  const [timeOut, setTimeOut] = useState('17:00');

  const [jobDescription, setJobDescription] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [remarks, setRemarks] = useState('');

  // Trigger Toast Notification
  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast({ message: '', isError: false }), 4000);
  };

  // Auth checking on mount
  useEffect(() => {
    const checkSession = async () => {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          setUser(session?.user || null);
          
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
          });
          
          setAuthLoading(false);
          return () => subscription?.unsubscribe();
        } catch (err) {
          console.error("Auth initialization failed:", err);
          setAuthLoading(false);
        }
      } else {
        // Fallback local storage check
        const fallbackUser = localStorage.getItem('hitech_fallback_user');
        if (fallbackUser) {
          setUser(JSON.parse(fallbackUser));
        }
        setAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  // Fetch sequential Report ID from Supabase dynamically
  useEffect(() => {
    if (!user) return;
    
    const fetchNextReportId = async () => {
      try {
        if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase
            .from('reports')
            .select('report_id')
            .order('report_id', { ascending: false })
            .limit(1);

          if (error) throw error;

          if (data && data.length > 0) {
            const latestId = data[0].report_id;
            const match = latestId.match(/RPT-(\d+)/);
            if (match) {
              const nextNum = parseInt(match[1], 10) + 1;
              setReportId(`RPT-${String(nextNum).padStart(6, '0')}`);
              return;
            }
          }
        }
      } catch (err) {
        console.error("Failed to query next Report ID from database:", err);
      }
      
      // LocalStorage fallback if unconfigured / query fails
      const storedId = localStorage.getItem('hiTechReportId');
      const nextId = storedId ? parseInt(storedId, 10) : 1;
      setReportId(`RPT-${String(nextId).padStart(6, '0')}`);
    };

    fetchNextReportId();
  }, [user]);

  // Auth helper callbacks
  const handleLoginSuccess = (loggedInUser) => {
    if (!isSupabaseConfigured()) {
      localStorage.setItem('hitech_fallback_user', JSON.stringify(loggedInUser));
    }
    setUser(loggedInUser);
    showToast("Logged in as administrator!");
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('hitech_fallback_user');
    }
    setUser(null);
    window.location.reload();
  };

  // Form parts state helper
  const handlePartChange = (id, field, value) => {
    setParts(parts.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addPartRow = () => {
    setParts([...parts, { id: Date.now(), desc: '', no: '', qty: 1 }]);
  };

  const removePartRow = (id) => {
    if (parts.length > 1) {
      setParts(parts.filter(p => p.id !== id));
    }
  };

  // Form Reset / Clear
  const confirmClear = () => {
    setIsClearModalOpen(true);
  };

  // Convert Signatures & Trigger Print View
  const triggerPrintFlow = (onDone) => {
    const originalTitle = document.title;
    document.title = `HiTech_Intervention_Report_${reportId}`;

    const canvases = document.querySelectorAll('.signature-canvas');
    const previews = document.querySelectorAll('.sig-print-preview');
    
    const promises = Array.from(canvases).map((canvas, idx) => {
      const preview = previews[idx];
      if (!preview) return Promise.resolve();
      
      return new Promise((resolve) => {
        preview.onload = resolve;
        preview.onerror = resolve; 
        preview.src = canvas.toDataURL('image/png');
      });
    });

    Promise.all(promises).then(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          window.print();
          document.title = originalTitle;
          if (onDone) onDone();
        }, 80);
      });
    });
  };

  // Save Report (Supabase + LocalStorage Fallback) and instantly print PDF
  const handleSaveAndPrint = async (e) => {
    if (e) e.preventDefault();
    
    // Gather checkboxes
    const selectedEquipment = [];
    document.querySelectorAll('input[name="equipment[]"]:checked').forEach(cb => {
      selectedEquipment.push(cb.value);
    });

    // Gather safety items radio choices
    const safetyAnswers = {};
    SAFETY_ITEMS.forEach((item, idx) => {
      const selectedRadio = document.querySelector(`input[name="safety_${idx}"]:checked`);
      safetyAnswers[item] = selectedRadio ? selectedRadio.value : '';
    });

    // Filter out parts where both description and part number are blank to keep DB records clean
    const filledParts = parts
      .filter(p => p.desc.trim() !== '' || p.no.trim() !== '')
      .map(p => ({ desc: p.desc, no: p.no, qty: p.qty }));

    // Build absolute form data payload
    const payload = {
      report_id: reportId,
      client_name: clientName,
      site_address: siteAddress,
      client_phone: clientPhone,
      intervention_date: interventionDate,
      technician_name: technicianName,
      technician_date: interventionDate,
      time_in: timeIn,
      time_out: timeOut,
      service_type: serviceType,
      job_status: jobStatus,
      equipment_checkboxes: selectedEquipment,
      equipment_text_fields: {
        dispenser_brand: document.querySelector('input[name="dispenser_brand"]')?.value || '',
        tank_gauge: document.querySelector('input[name="tank_gauge"]')?.value || '',
        pump_number: document.querySelector('input[name="pump_number"]')?.value || '',
        serial_number: document.querySelector('input[name="serial_number"]')?.value || '',
      },
      safety_ticket: safetyAnswers,
      job_description: jobDescription,
      work_performed: workPerformed,
      parts: filledParts,
      remarks: remarks,
      saved_at: new Date().toISOString()
    };

    try {
      showToast("Saving intervention report...");

      // 1. Save / Upsert to Supabase (if connected)
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase
          .from('reports')
          .upsert({
            report_id: reportId,
            client_name: clientName,
            intervention_date: interventionDate,
            technician_name: technicianName,
            form_data: payload
          });

        if (error) throw error;
      }

      // 2. Save locally without duplicates
      const existingReports = JSON.parse(localStorage.getItem('hitech_reports_list') || '[]');
      const filteredReports = existingReports.filter(r => r.report_id !== reportId);
      localStorage.setItem('hitech_reports_list', JSON.stringify([payload, ...filteredReports]));

      // 3. Increment ID (in localStorage configuration, so the next reload increments it)
      const currentNum = parseInt(reportId.replace('RPT-', ''), 10);
      localStorage.setItem('hiTechReportId', currentNum + 1);

      showToast("Saved successfully! Opening print window...");
      
      // 4. Trigger print PDF download/preview dialog
      triggerPrintFlow(() => {
        window.location.reload();
      });

    } catch (err) {
      console.error("Supabase write error (saving locally):", err);
      showToast("Database offline! Saved locally & printing...", true);
      
      // Save locally anyway without duplicates
      const existingReports = JSON.parse(localStorage.getItem('hitech_reports_list') || '[]');
      const filteredReports = existingReports.filter(r => r.report_id !== reportId);
      localStorage.setItem('hitech_reports_list', JSON.stringify([payload, ...filteredReports]));

      const currentNum = parseInt(reportId.replace('RPT-', ''), 10);
      localStorage.setItem('hiTechReportId', currentNum + 1);

      // Trigger print flow anyway
      triggerPrintFlow(() => {
        window.location.reload();
      });
    }
  };

  // If session checking, show clean loading page
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">LOADING SESSION...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show Admin Login Card
  if (!user) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-primary selection:text-white relative">
      
      {/* Toast Notification Box */}
      {toast.message && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-xs font-bold font-mono tracking-wide uppercase border animate-slide-in flex items-center gap-2 print:hidden ${
          toast.isError 
            ? 'bg-red-500/95 border-red-400 text-white' 
            : 'bg-primary/95 border-primary/50 text-white'
        }`}>
          <span>{toast.isError ? '✕' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Custom Reset Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-500">
              <span className="text-xl">⚠️</span>
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide font-mono">Reset Form</h3>
            </div>
            <p className="text-xs text-slate-600 leading-normal">
              Are you sure you want to clear all fields? This will reset all current input data permanently.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setIsClearModalOpen(false)} 
                className="px-3 py-1.5 rounded border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsClearModalOpen(false);
                  window.location.reload();
                }} 
                className="px-4 py-1.5 rounded bg-red-500 hover:bg-red-600 text-xs font-semibold text-white transition-colors shadow-sm focus:outline-none"
              >
                Reset Fields
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Main Header */}
      <Header reportId={reportId} userEmail={user.email} onSignOut={handleSignOut} />

      <main className="flex-1 w-full max-w-4xl mx-auto p-4 print:p-0 printable-area">
        <section aria-label="Hero" className="flex flex-col hero w-full space-y-4">
          
          {/* Printable Container / Report Card */}
          <div className="bg-white shadow-lg border border-slate-200 rounded-xl p-5 md:p-6 space-y-4 print:shadow-none print:border-none print:p-0 print:m-0 print:space-y-2 relative overflow-hidden">
            
            {/* Single Diagonal Print Watermark */}
            <div className="hidden print:flex absolute inset-0 items-center justify-center pointer-events-none z-0 opacity-[0.03] select-none rotate-[30deg] text-slate-900 font-extrabold text-[76px] tracking-wider uppercase text-center whitespace-nowrap">
              Hi-Tech Fuel Automate Ltd
            </div>

            {/* Business Details Header */}
            <div className="flex flex-row justify-between items-start pb-3 border-b-2 border-primary/20 gap-4 relative z-10">
              <div className="flex flex-col text-left space-y-0.5">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-primary leading-none">
                  Hi-Tech Fuel Automate Ltd
                </h1>
                <div className="text-[10px] md:text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                  BRN: C26234033
                </div>
                <div className="text-[11px] md:text-xs text-slate-600 font-medium pt-0.5">
                  Morc Medine Bassin, Quatre Bornes
                </div>
                <div className="text-[11px] md:text-xs text-slate-600 font-medium flex flex-wrap gap-x-4 pt-0.5">
                  <span><span className="font-bold text-primary">M:</span> +230 57453826</span>
                  <span><span className="font-bold text-primary">E:</span> bryan.figaro@hi-techfuelautomate.com</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end text-right space-y-1">
                <div className="bg-primary/5 text-primary border border-primary/20 font-mono text-xs md:text-sm font-bold px-2.5 py-1 rounded shadow-sm tracking-wider uppercase">
                  Report No: <span className="font-extrabold">{reportId}</span>
                </div>
                <div className="text-[9px] md:text-[10px] text-slate-400 font-mono font-semibold tracking-wide uppercase">
                  TECHNICAL INTERVENTION REPORT
                </div>
                
                {/* Compact Date of Intervention & Time fields (No Textboxes style) */}
                <div className="flex flex-col items-end text-right pt-1.5 border-t border-slate-100 print:border-slate-300 w-full font-mono text-slate-600">
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <span className="text-[9px] text-slate-400 uppercase">Date:</span>
                    <input 
                      type="date" 
                      value={interventionDate} 
                      onChange={(e) => setInterventionDate(e.target.value)} 
                      className="bg-transparent border-none p-0 h-auto text-[11px] text-slate-600 font-bold focus:outline-none cursor-pointer w-[110px] text-right" 
                    />
                  </div>
                  
                  <div className="flex items-center gap-1 text-[10px] font-bold mt-0.5">
                    <span className="text-[9px] text-slate-400 uppercase">Time:</span>
                    <div className="flex items-center gap-0.5">
                      <input 
                        type="time" 
                        value={timeIn} 
                        onChange={(e) => setTimeIn(e.target.value)} 
                        className="bg-transparent border-none p-0 h-auto text-[10px] text-slate-600 font-bold focus:outline-none cursor-pointer w-[42px] text-right print:hidden" 
                      />
                      <span className="hidden print:inline text-[10px] text-slate-900 font-mono">
                        {formatTime(timeIn)}
                      </span>
                      <span className="text-slate-400 font-normal mx-0.5">-</span>
                      <input 
                        type="time" 
                        value={timeOut} 
                        onChange={(e) => setTimeOut(e.target.value)} 
                        className="bg-transparent border-none p-0 h-auto text-[10px] text-slate-600 font-bold focus:outline-none cursor-pointer w-[42px] text-right print:hidden" 
                      />
                      <span className="hidden print:inline text-[10px] text-slate-900 font-mono">
                        {formatTime(timeOut)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form ref={formRef} className="space-y-3 print:space-y-1.5 form-grid relative z-10" onSubmit={handleSaveAndPrint}>
              
              {/* Client & Technician Details (Side by Side) */}
              <div className="grid grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
                {/* Client / Site Information */}
                <fieldset className="rounded-lg border border-slate-200 bg-white p-3 print:p-2 print:border-slate-400 print:bg-transparent flex flex-col gap-2 print:gap-1.5 justify-center">
                  <legend className="px-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest text-primary print:text-black">
                    Client / Site Information
                  </legend>
                  
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1 print:border-slate-300">
                    <label htmlFor="client-name" className="text-[10px] text-slate-500 font-mono print:text-black font-bold uppercase tracking-wider whitespace-nowrap shrink-0">Name of Client:</label>
                    <input id="client-name" name="client_name" type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="flex-1 h-5 px-1 bg-transparent border-none text-xs text-slate-900 focus:outline-none print:text-black" />
                  </div>

                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1 print:border-slate-300">
                    <label htmlFor="site-address" className="text-[10px] text-slate-500 font-mono print:text-black font-bold uppercase tracking-wider whitespace-nowrap shrink-0">Site / Address:</label>
                    <input id="site-address" name="site_address" type="text" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} className="flex-1 h-5 px-1 bg-transparent border-none text-xs text-slate-900 focus:outline-none print:text-black" />
                  </div>

                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1 print:border-slate-300">
                    <label htmlFor="client-phone" className="text-[10px] text-slate-500 font-mono print:text-black font-bold uppercase tracking-wider whitespace-nowrap shrink-0">Tel / Mobile:</label>
                    <input id="client-phone" name="client_phone" type="text" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="flex-1 h-5 px-1 bg-transparent border-none text-xs text-slate-900 focus:outline-none print:text-black" />
                  </div>
                </fieldset>

                {/* Right Column: Technician Details, Service Type, and Job Status */}
                <div className="flex flex-col justify-between gap-3 print:gap-1.5">
                  {/* Technician Details */}
                  <fieldset className="rounded-lg border border-slate-200 bg-white p-3 print:p-2 print:border-slate-400 print:bg-transparent flex-1 flex flex-col justify-center gap-2">
                    <legend className="px-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest text-primary print:text-black">
                      Technician Details
                    </legend>
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1 print:border-slate-300">
                      <label htmlFor="technician-name" className="text-[10px] text-slate-500 font-mono print:text-black font-bold uppercase tracking-wider whitespace-nowrap shrink-0">Technician Name:</label>
                      <input id="technician-name" name="technician_name" type="text" value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} className="flex-1 h-5 px-1 bg-transparent border-none text-xs text-slate-900 focus:outline-none print:text-black" />
                    </div>
                  </fieldset>

                  {/* Service Type & Job Status Side-by-Side */}
                  <div className="grid grid-cols-2 gap-3 print:gap-2">
                    <fieldset className="rounded-lg border border-slate-200 bg-white p-2.5 print:p-1.5 print:border-slate-400 print:bg-transparent">
                      <legend className="px-2 text-[10px] font-mono font-bold uppercase tracking-widest text-primary print:text-black">
                        Service Type
                      </legend>
                      <div className="flex flex-col gap-1">
                        <select 
                          id="service-type" 
                          name="service_type" 
                          value={serviceType}
                          onChange={(e) => setServiceType(e.target.value)}
                          className="h-7 px-1.5 rounded bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-primary cursor-pointer print:bg-transparent print:border-slate-300 print:text-black print:border-b print:rounded-none w-full"
                        >
                          <option value="" disabled>Choose service…</option>
                          {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {serviceType === 'Others' && (
                          <input type="text" name="service_type_other" placeholder="Specify..." className="h-7 px-1.5 rounded bg-white border border-slate-300 border-dashed text-xs text-slate-900 focus:outline-none focus:border-primary print:bg-transparent print:border-b print:border-slate-300 print:text-black print:border-solid print:rounded-none w-full mt-1" />
                        )}
                      </div>
                    </fieldset>

                    <fieldset className="rounded-lg border border-slate-200 bg-white p-2.5 print:p-1.5 print:border-slate-400 print:bg-transparent">
                      <legend className="px-2 text-[10px] font-mono font-bold uppercase tracking-widest text-primary print:text-black">
                        Job Status
                      </legend>
                      <div className="flex flex-col gap-1">
                        <select 
                          name="job_status" 
                          value={jobStatus}
                          onChange={(e) => setJobStatus(e.target.value)}
                          className="h-7 px-1.5 rounded bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-primary cursor-pointer print:bg-transparent print:border-slate-300 print:text-black print:border-b print:rounded-none w-full"
                        >
                          <option value="" disabled>Choose status…</option>
                          {['Completed', 'Pending', 'Requires Follow-up', 'Parts on Order'].map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </fieldset>
                  </div>
                </div>
              </div>

              {/* Equipment Details */}
              <fieldset className="rounded-lg border border-slate-200 bg-white p-3 print:p-2 print:border-slate-400 print:bg-transparent">
                <legend className="px-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest text-primary print:text-black">
                  Equipment Details
                </legend>
                <div className="grid grid-cols-4 print:grid-cols-4 gap-1">
                  {EQUIPMENT_TYPES.map(eq => (
                    <label key={eq} className="flex items-center gap-1 cursor-pointer text-[10px] md:text-xs text-slate-700 print:text-black print-hide-unchecked">
                      <input type="checkbox" name="equipment[]" value={eq} className="accent-primary w-3 h-3 md:w-4 md:h-4" />
                      <span className="truncate">{eq}</span>
                    </label>
                  ))}
                </div>
                
                {/* Dynamically named equipment inputs */}
                <div className="grid grid-cols-4 print:grid-cols-4 gap-2 pt-2 border-t border-slate-100 print:border-slate-300">
                  {[
                    'Dispenser Brand', 'Tank Gauge', 
                    'Pump Number', 'Serial Number'
                  ].map(field => (
                    <div key={field} className="flex flex-col">
                      <label className="text-[9px] text-slate-500 font-mono print:text-black leading-none">{field}</label>
                      <input 
                        type="text" 
                        name={field.toLowerCase().replace(/[^a-z0-9]/g, '_')}
                        className="h-6 md:h-7 px-1.5 rounded bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-primary print:bg-transparent print:border-b print:border-slate-300 print:text-black print:rounded-none w-full" 
                      />
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Safety Ticket */}
              <fieldset className="rounded-lg border border-slate-200 bg-white p-3 print:p-2 print:border-slate-400 print:bg-transparent">
                <legend className="px-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest text-primary print:text-black">
                  Safety Ticket / Permit to Work
                </legend>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 print:grid-cols-2">
                  {SAFETY_ITEMS.map((item, idx) => (
                    <div key={idx} role="group" aria-label={item} className="flex items-center justify-between py-0.5 border-b border-slate-100 last:border-0 print:border-b-0 print:py-0 print-hide-unchecked">
                      <span className="text-[10px] md:text-xs text-slate-700 print:text-black">{item}</span>
                      <div className="flex gap-2 shrink-0">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name={`safety_${idx}`} value="yes" className="accent-primary w-3 h-3" />
                          <span className="text-[10px] text-slate-500 print:text-black">Y</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name={`safety_${idx}`} value="no" className="accent-red-500 w-3 h-3" />
                          <span className="text-[10px] text-slate-500 print:text-black">N</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name={`safety_${idx}`} value="na" className="accent-slate-500 w-3 h-3" />
                          <span className="text-[10px] text-slate-500 print:text-black">N/A</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Job Description & Work Performed */}
              <div className="grid grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
                <fieldset className="rounded-lg border border-slate-200 bg-white p-3 print:p-2 print:border-slate-400 print:bg-transparent flex flex-col">
                  <legend className="px-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest text-primary print:text-black">
                    Job Description
                  </legend>
                  <div className="flex-1 flex flex-col w-full relative">
                    <textarea 
                      name="job_description" 
                      maxLength={255}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="w-full h-[72px] px-2 py-1 rounded-md resize-none overflow-hidden bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-primary print:hidden" 
                      placeholder="Enter job description..."
                    ></textarea>
                    <div className="hidden print:block text-[11px] text-slate-900 font-sans whitespace-pre-wrap h-[72px] border-b border-slate-300 pb-1 overflow-hidden">
                      {jobDescription || <span className="text-slate-400 italic">No description provided.</span>}
                    </div>
                    <div className="text-[9px] text-slate-400 text-right font-mono mt-0.5 print:hidden">
                      {jobDescription.length}/255 chars
                    </div>
                  </div>
                </fieldset>

                <fieldset className="rounded-lg border border-slate-200 bg-white p-3 print:p-2 print:border-slate-400 print:bg-transparent flex flex-col">
                  <legend className="px-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest text-primary print:text-black">
                    Work Performed
                  </legend>
                  <div className="flex-1 flex flex-col w-full relative">
                    <textarea 
                      name="work_performed" 
                      maxLength={255}
                      value={workPerformed}
                      onChange={(e) => setWorkPerformed(e.target.value)}
                      className="w-full h-[72px] px-2 py-1 rounded-md resize-none overflow-hidden bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-primary print:hidden" 
                      placeholder="Enter work performed..."
                    ></textarea>
                    <div className="hidden print:block text-[11px] text-slate-900 font-sans whitespace-pre-wrap h-[72px] border-b border-slate-300 pb-1 overflow-hidden">
                      {workPerformed || <span className="text-slate-400 italic">No work performed recorded.</span>}
                    </div>
                    <div className="text-[9px] text-slate-400 text-right font-mono mt-0.5 print:hidden">
                      {workPerformed.length}/255 chars
                    </div>
                  </div>
                </fieldset>
              </div>

              {/* Parts & Remarks */}
              <div className="grid grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
                <fieldset className="rounded-lg border border-slate-200 bg-white p-3 print:p-2 print:border-slate-400 print:bg-transparent flex flex-col">
                  <legend className="px-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest text-primary print:text-black">
                    Parts / Materials Used
                  </legend>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 print:border-slate-300">
                          <th className="pb-1 font-mono text-[9px] text-slate-400 uppercase tracking-wider w-[50%] print:text-black">Description</th>
                          <th className="pb-1 font-mono text-[9px] text-slate-400 uppercase tracking-wider w-[30%] print:text-black">Part #</th>
                          <th className="pb-1 font-mono text-[9px] text-slate-400 uppercase tracking-wider w-[15%] text-center print:text-black">Qty</th>
                          <th className="pb-1 w-[5%] print:hidden"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                        {parts.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                            <td className="py-1 pr-2">
                              <input 
                                type="text" 
                                placeholder="Description" 
                                value={p.desc || ''} 
                                onChange={(e) => handlePartChange(p.id, 'desc', e.target.value)} 
                                className="w-full h-6 px-1 bg-transparent border-none text-xs text-slate-900 focus:outline-none print:text-black" 
                              />
                            </td>
                            <td className="py-1 pr-2">
                              <input 
                                type="text" 
                                placeholder="Part #" 
                                value={p.no || ''} 
                                onChange={(e) => handlePartChange(p.id, 'no', e.target.value)} 
                                className="w-full h-6 px-1 bg-transparent border-none text-xs text-slate-900 focus:outline-none print:text-black font-mono" 
                              />
                            </td>
                            <td className="py-1">
                              <input 
                                type="number" 
                                min="1" 
                                value={p.qty} 
                                onChange={(e) => handlePartChange(p.id, 'qty', parseInt(e.target.value, 10) || 1)} 
                                className="w-full h-6 px-1 bg-transparent border-none text-xs text-slate-900 text-center focus:outline-none print:text-black" 
                              />
                            </td>
                            <td className="py-1 text-center print:hidden">
                              <button type="button" onClick={() => removePartRow(p.id)} className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer text-[10px]">✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" onClick={addPartRow} className="text-[10px] font-mono text-primary print:hidden mt-2 self-start hover:underline">+ Add Part</button>
                </fieldset>

                <fieldset className="rounded-lg border border-slate-200 bg-white p-3 print:p-2 print:border-slate-400 print:bg-transparent flex flex-col">
                  <legend className="px-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest text-primary print:text-black">
                    Remarks
                  </legend>
                  <div className="flex-1 flex flex-col w-full relative">
                    <textarea 
                      name="remarks" 
                      maxLength={255}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full h-[72px] px-2 py-1 rounded-md resize-none overflow-hidden bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-primary print:hidden" 
                      placeholder="Remarks / Observations..."
                    ></textarea>
                    <div className="hidden print:block text-[11px] text-slate-900 font-sans whitespace-pre-wrap h-[72px] border-b border-slate-300 pb-1 overflow-hidden">
                      {remarks || <span className="text-slate-400 italic">No remarks.</span>}
                    </div>
                    <div className="text-[9px] text-slate-400 text-right font-mono mt-0.5 print:hidden">
                      {remarks.length}/255 chars
                    </div>
                  </div>
                </fieldset>
              </div>

              {/* Signatures Row */}
              <div className="grid grid-cols-2 gap-4 mt-2 print:grid-cols-2 print:gap-3">
                <SignaturePad title="Technician Signature" />
                <SignaturePad title="Customer Signature" />
              </div>

              {/* Sleek Simple Thank You Footer */}
              <div className="text-center py-2 print:py-1 w-full border-t border-slate-100 print:border-slate-300 mt-1">
                <p className="text-[10px] font-bold text-slate-500 italic tracking-wider print:text-black font-mono">
                  Thank you for your business!
                </p>
              </div>

            </form>

            {/* Consolidated Premium ActionBar */}
            <div id="action-bar" role="toolbar" className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-200 print:hidden relative z-10">
              <button 
                type="button" 
                onClick={confirmClear} 
                className="px-5 py-2 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all focus:outline-none cursor-pointer"
              >
                Clear Form
              </button>
              
              <button 
                type="button" 
                onClick={handleSaveAndPrint} 
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] focus:outline-none cursor-pointer"
              >
                <span>💾 Save as PDF</span>
              </button>
            </div>
            
          </div>
        </section>
      </main>
    </div>
  );
}
