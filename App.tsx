import React, { useState, useRef, useEffect } from 'react';
import Layout from './components/Layout';
import AIView from './components/AIView';
import { AppView, LeaveRecord, SubjectRow, Task, TimeTableItem, DocumentItem, Student, SchoolContact } from './types';
import { LEAVE_HISTORY, getGradeDetails, MOCK_TASKS, MOCK_TIMETABLE, MOCK_DOCUMENTS, MOCK_STUDENTS } from './data/signs';
import { chatWithGemini } from './services/geminiService';
import { 
  Calculator, 
  CalendarDays, 
  Plus, 
  Trash2, 
  Users, 
  Clock, 
  Check, 
  MapPin,
  Bot,
  CheckSquare,
  FileText,
  Camera,
  FolderOpen,
  Phone,
  Search,
  MoreVertical,
  X,
  Briefcase,
  Pencil,
  Save,
  UserCog,
  User,
  Table,
  GraduationCap,
  PhoneCall,
  Download,
  BarChart3,
  Sparkles,
  MessageCircle,
  Smartphone,
  Loader2,
  CheckCircle,
  XCircle,
  Edit2,
  DownloadCloud
} from 'lucide-react';

// --- LOCAL STORAGE HELPER ---
const loadData = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage`, error);
    return defaultValue;
  }
};

export default function App() {
  const [currentView, setView] = useState<AppView>(AppView.DASHBOARD);
  
  // --- USER PROFILE STATE ---
  const [teacherName, setTeacherName] = useState(() => loadData('tms_teacherName', 'Mrs. Sarah Silva'));
  const [teacherClass, setTeacherClass] = useState(() => loadData('tms_teacherClass', '10-B'));

  // --- TASKS STATE ---
  const [tasks, setTasks] = useState<Task[]>(() => loadData('tms_tasks', MOCK_TASKS));
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({ title: '', dueDate: '' });

  // --- LEAVE STATE ---
  const [leaves, setLeaves] = useState<LeaveRecord[]>(() => loadData('tms_leaves', LEAVE_HISTORY));
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [newLeave, setNewLeave] = useState<Partial<LeaveRecord>>({
    type: 'Casual',
    days: 1,
    status: 'Pending',
    reason: ''
  });
  // AI & Share State for Leaves
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [sharedRequest, setSharedRequest] = useState<Partial<LeaveRecord> | null>(null);
  // Leave Update Status State
  const [editingLeave, setEditingLeave] = useState<LeaveRecord | null>(null);
  const [approverName, setApproverName] = useState('');

  // --- QUICK CALLS STATE ---
  const [showCallModal, setShowCallModal] = useState(false);
  const [contacts, setContacts] = useState<SchoolContact[]>(() => loadData('tms_contacts', [
    { id: '1', role: 'Principal', name: 'Mr. Wijesinghe', phone: '' },
    { id: '2', role: 'Deputy Principal (DP)', name: 'Mrs. Perera', phone: '' },
    { id: '3', role: 'Assistant Principal (AP)', name: '', phone: '' },
    { id: '4', role: 'Sectional Head', name: '', phone: '' },
    { id: '5', role: 'SDS Secretary', name: '', phone: '' },
  ]));

  // --- GPA/MARKS STATE ---
  const [subjects, setSubjects] = useState<SubjectRow[]>(() => loadData('tms_subjects', [
    { id: '1', name: 'Mathematics', credits: 3, marks: 85, gradePoint: 4.0, gradeLetter: 'A+' },
    { id: '2', name: 'Science', credits: 4, marks: 72, gradePoint: 3.7, gradeLetter: 'A-' },
    { id: '3', name: 'English', credits: 2, marks: 65, gradePoint: 3.3, gradeLetter: 'B+' },
  ]));
  // Mapping: { [studentId]: { [subjectId]: mark } }
  const [studentMarks, setStudentMarks] = useState<Record<string, Record<string, number>>>(() => loadData('tms_studentMarks', {}));

  // --- TIMETABLE STATE ---
  const [timetable, setTimetable] = useState<TimeTableItem[]>(() => loadData('tms_timetable', MOCK_TIMETABLE));
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [newPeriod, setNewPeriod] = useState<Partial<TimeTableItem>>({
    startTime: '08:00',
    endTime: '08:40',
    subject: '',
    grade: '',
    room: '',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
  });

  // --- PWA INSTALL STATE ---
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    // Show the install prompt
    installPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const PERIOD_COLORS = [
    { name: 'Indigo', value: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { name: 'Sky', value: 'bg-sky-100 text-sky-700 border-sky-200' },
    { name: 'Teal', value: 'bg-teal-100 text-teal-700 border-teal-200' },
    { name: 'Cyan', value: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    { name: 'Slate', value: 'bg-slate-100 text-slate-700 border-slate-200' },
  ];

  // --- DOCUMENTS STATE ---
  const [documents, setDocuments] = useState<DocumentItem[]>(() => loadData('tms_documents', MOCK_DOCUMENTS));
  const [showDocForm, setShowDocForm] = useState(false);
  const [newDoc, setNewDoc] = useState<Partial<DocumentItem>>({ title: '', category: 'Other', imageUrl: '' });
  const [selectedDocImage, setSelectedDocImage] = useState<string | null>(null);
  const docCameraInputRef = useRef<HTMLInputElement>(null);
  const docGalleryInputRef = useRef<HTMLInputElement>(null);

  // --- STUDENTS STATE ---
  const [students, setStudents] = useState<Student[]>(() => loadData('tms_students', MOCK_STUDENTS));
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student>>({
    name: '', indexNo: '', parentName: '', contactNumber: '', gender: 'Male', photoUrl: ''
  });
  const studentFileInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => { localStorage.setItem('tms_teacherName', JSON.stringify(teacherName)); }, [teacherName]);
  useEffect(() => { localStorage.setItem('tms_teacherClass', JSON.stringify(teacherClass)); }, [teacherClass]);
  useEffect(() => { localStorage.setItem('tms_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('tms_leaves', JSON.stringify(leaves)); }, [leaves]);
  useEffect(() => { localStorage.setItem('tms_contacts', JSON.stringify(contacts)); }, [contacts]);
  useEffect(() => { localStorage.setItem('tms_subjects', JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem('tms_studentMarks', JSON.stringify(studentMarks)); }, [studentMarks]);
  useEffect(() => { localStorage.setItem('tms_timetable', JSON.stringify(timetable)); }, [timetable]);
  useEffect(() => { 
    try {
      localStorage.setItem('tms_documents', JSON.stringify(documents));
    } catch (e) {
      console.error("Storage limit reached for docs", e);
    }
  }, [documents]);
  useEffect(() => { 
     try {
       localStorage.setItem('tms_students', JSON.stringify(students)); 
     } catch (e) {
       console.error("Storage limit reached for students", e);
     }
  }, [students]);


  // --- GPA LOGIC ---
  const calculateGPA = () => {
    const totalPoints = subjects.reduce((sum, sub) => sum + (sub.gradePoint * sub.credits), 0);
    const totalCredits = subjects.reduce((sum, sub) => sum + sub.credits, 0);
    return totalCredits === 0 ? "0.00" : (totalPoints / totalCredits).toFixed(2);
  };

  const calculateStudentGPA = (studentId: string) => {
    let totalPoints = 0;
    let totalCredits = 0;
    const marks = studentMarks[studentId] || {};

    subjects.forEach(sub => {
      if (marks[sub.id] !== undefined) {
        const { point } = getGradeDetails(marks[sub.id]);
        totalPoints += point * sub.credits;
        totalCredits += sub.credits;
      }
    });

    return totalCredits === 0 ? "0.00" : (totalPoints / totalCredits).toFixed(2);
  };

  const addSubject = () => {
    const id = Date.now().toString();
    setSubjects([...subjects, { id, name: '', credits: 3, marks: 0, gradePoint: 0, gradeLetter: 'E' }]);
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const updateSubjectMark = (id: string, marks: number) => {
    const { letter, point } = getGradeDetails(marks);
    setSubjects(subjects.map(s => s.id === id ? { 
      ...s, 
      marks: marks,
      gradeLetter: letter,
      gradePoint: point
    } : s));
  };

  const updateStudentMark = (studentId: string, subjectId: string, mark: number) => {
    setStudentMarks(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectId]: mark
      }
    }));
  };

  const updateSubject = (id: string, field: keyof SubjectRow, value: any) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // --- QUICK CALLS LOGIC ---
  const updateContact = (id: string, field: keyof SchoolContact, value: string) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addContact = () => {
    setContacts([...contacts, { id: Date.now().toString(), role: 'New Role', name: '', phone: '' }]);
  };

  const deleteContact = (id: string) => {
     if(window.confirm('Delete this contact?')) {
        setContacts(contacts.filter(c => c.id !== id));
     }
  };

  // --- LEAVE LOGIC & AI ---
  const generateLeaveLetter = async () => {
    setIsGeneratingLetter(true);
    setShowAiPrompt(false);
    try {
        const prompt = `Write a formal and polite leave request letter (approx 50-80 words) from a teacher to a principal.
        Details:
        - Teacher Name: ${teacherName}
        - Class: ${teacherClass}
        - Type: ${newLeave.type} Leave
        - Duration: ${newLeave.days} day(s) starting from ${newLeave.startDate}
        - Reason context: ${newLeave.reason || 'Personal reasons'}
        
        Output only the body of the letter. Do not include placeholders.`;
        
        const text = await chatWithGemini(prompt);
        setNewLeave(prev => ({ ...prev, reason: text }));
    } catch (e) {
        console.error(e);
        alert("Could not generate letter. Please check connection.");
    } finally {
        setIsGeneratingLetter(false);
    }
  };

  const handleLeaveSubmitClick = () => {
    if (!newLeave.startDate) {
        alert("Please select a start date.");
        return;
    }
    // Prompt for AI if reason is short or empty
    if (!newLeave.reason || newLeave.reason.length < 30) {
        setShowAiPrompt(true);
    } else {
        processLeaveSubmission();
    }
  };

  const processLeaveSubmission = () => {
    const record: LeaveRecord = {
      id: Date.now().toString(),
      type: newLeave.type as any,
      startDate: newLeave.startDate as string,
      endDate: newLeave.startDate as string, 
      days: newLeave.days || 1,
      status: 'Pending',
      reason: newLeave.reason || ''
    };
    
    setLeaves([record, ...leaves]);
    setSharedRequest(record);
    setShowShareModal(true);
  };

  const shareLeave = (method: 'whatsapp' | 'sms') => {
    if (!sharedRequest) return;
    
    const text = `*Leave Request*\n\n${sharedRequest.reason}\n\n- ${teacherName} (${teacherClass})`;
    const encodedText = encodeURIComponent(text);
    
    if (method === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    } else {
        const ua = navigator.userAgent.toLowerCase(); 
        const isiOS = ua.indexOf("iphone") > -1 || ua.indexOf("ipad") > -1;
        const separator = isiOS ? '&' : '?';
        window.open(`sms:${separator}body=${encodedText}`, '_blank');
    }
    
    closeLeaveForms();
  };

  const closeLeaveForms = () => {
    setShowShareModal(false);
    setSharedRequest(null);
    setShowLeaveForm(false);
    setNewLeave({ type: 'Casual', days: 1, status: 'Pending', reason: '' });
  };
  
  // Update Leave Status Logic
  const handleLeaveStatusUpdate = (status: 'Approved' | 'Rejected') => {
    if (!editingLeave) return;

    if (status === 'Approved' && !approverName.trim()) {
      alert("Please enter who approved this leave.");
      return;
    }

    setLeaves(leaves.map(l => l.id === editingLeave.id ? { 
      ...l, 
      status: status,
      approvedBy: status === 'Approved' ? approverName : undefined 
    } : l));
    
    setEditingLeave(null);
    setApproverName('');
  };

  const openLeaveEdit = (leave: LeaveRecord) => {
    setEditingLeave(leave);
    setApproverName(leave.approvedBy || '');
  };

  // --- TIMETABLE LOGIC ---
  const addPeriod = () => {
    if (!newPeriod.subject || !newPeriod.startTime || !newPeriod.endTime) return;
    
    const item: TimeTableItem = {
      id: Date.now().toString(),
      day: selectedDay as any,
      startTime: newPeriod.startTime!,
      endTime: newPeriod.endTime!,
      subject: newPeriod.subject!,
      grade: newPeriod.grade || '',
      room: newPeriod.room || '',
      color: newPeriod.color || PERIOD_COLORS[0].value
    };

    setTimetable([...timetable, item]);
    setShowPeriodForm(false);
    setNewPeriod({
      startTime: '08:00',
      endTime: '08:40',
      subject: '',
      grade: '',
      room: '',
      color: PERIOD_COLORS[0].value
    });
  };

  const removePeriod = (id: string) => {
    setTimetable(timetable.filter(t => t.id !== id));
  };

  // --- TASK LOGIC ---
  const addTask = () => {
    if (!newTask.title) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      completed: false,
      dueDate: newTask.dueDate || 'No Due Date'
    };
    setTasks([task, ...tasks]);
    setShowTaskForm(false);
    setNewTask({ title: '', dueDate: '' });
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // --- DOCUMENTS LOGIC ---
  const handleDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewDoc({ ...newDoc, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveDocument = () => {
    if (!newDoc.title || !newDoc.category) return;
    const doc: DocumentItem = {
      id: Date.now().toString(),
      title: newDoc.title,
      category: newDoc.category as any,
      date: new Date().toISOString().split('T')[0],
      imageUrl: newDoc.imageUrl || ''
    };
    setDocuments([doc, ...documents]);
    setShowDocForm(false);
    setNewDoc({ title: '', category: 'Other', imageUrl: '' });
  };

  const deleteDocument = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id));
  };

  // --- STUDENT LOGIC ---
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowStudentForm(true);
  };

  const handleDeleteStudent = (id: string) => {
    if(window.confirm("Are you sure you want to delete this student?")) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const handleStudentPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingStudent({ ...editingStudent, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStudent = () => {
    if (!editingStudent.name || !editingStudent.indexNo) return;

    if (editingStudent.id) {
      // Update
      setStudents(students.map(s => s.id === editingStudent.id ? editingStudent as Student : s));
    } else {
      // Create
      const newStudent: Student = {
        ...(editingStudent as Student),
        id: Date.now().toString()
      };
      setStudents([...students, newStudent]);
    }
    setShowStudentForm(false);
    setEditingStudent({ name: '', indexNo: '', parentName: '', contactNumber: '', gender: 'Male', photoUrl: '' });
  };

  // --- EXPORT LOGIC ---
  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportStudents = () => {
    const headers = ['Index No', 'Name', 'Gender', 'Parent Name', 'Contact Number'];
    const rows = students.map(s => [
      s.indexNo,
      `"${s.name}"`,
      s.gender,
      `"${s.parentName}"`,
      s.contactNumber
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(`students_${teacherClass.replace(/\s+/g, '_')}.csv`, csvContent);
  };

  const exportLeaves = () => {
    const headers = ['Type', 'Start Date', 'Days', 'Status', 'Reason'];
    const rows = leaves.map(l => [
      l.type,
      l.startDate,
      l.days,
      l.status,
      `"${l.reason.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(`leave_history.csv`, csvContent);
  };

  const exportMarks = () => {
    const subjectHeaders = subjects.map(s => `"${s.name}"`);
    const headers = ['Index No', 'Name', ...subjectHeaders, 'GPA'];
    const rows = students.map(s => {
      const marks = subjects.map(sub => studentMarks[s.id]?.[sub.id] || 0);
      return [
        s.indexNo,
        `"${s.name}"`,
        ...marks,
        calculateStudentGPA(s.id)
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(`performance_report_${teacherClass.replace(/\s+/g, '_')}.csv`, csvContent);
  };

  const pendingTasksCount = tasks.filter(t => !t.completed).length;
  // Fallback to Monday if today is weekend for demo purposes
  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const displayDay = ['Saturday', 'Sunday'].includes(currentDayName) ? 'Monday' : currentDayName;
  const todaysClassesCount = timetable.filter(t => t.day === displayDay).length;

  // --- VIEWS ---

  const DashboardView = () => (
    <div className="p-4 space-y-6">
      {/* Quick Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCallModal(false)} />
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl relative z-10 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <PhoneCall className="text-indigo-600" size={20} /> Directory
                 </h3>
                 <button onClick={() => setShowCallModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                 </button>
              </div>
              <div className="overflow-y-auto p-4 space-y-4">
                 <p className="text-xs text-slate-400 mb-2">Manage your quick dial contacts.</p>
                 {contacts.map(contact => (
                    <div key={contact.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 group">
                       <div className="flex justify-between items-center mb-2">
                          <input 
                              type="text" 
                              value={contact.role}
                              onChange={(e) => updateContact(contact.id, 'role', e.target.value)}
                              className="text-xs font-bold text-indigo-600 uppercase tracking-wide bg-transparent border-b border-transparent focus:border-indigo-200 focus:outline-none w-full mr-2"
                              placeholder="ROLE / TITLE"
                          />
                          <button 
                             onClick={() => deleteContact(contact.id)}
                             className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                             <Trash2 size={14} />
                          </button>
                       </div>
                       <div className="flex gap-2 mb-2">
                          <div className="flex-1 space-y-2">
                             <input 
                               type="text" 
                               placeholder="Name"
                               value={contact.name}
                               onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                               className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                             />
                             <input 
                               type="tel" 
                               placeholder="Number"
                               value={contact.phone}
                               onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                               className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-400 font-mono"
                             />
                          </div>
                          <a 
                             href={contact.phone ? `tel:${contact.phone}` : '#'}
                             className={`w-12 flex items-center justify-center rounded-xl transition-all shadow-sm
                               ${contact.phone 
                                 ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-500/30' 
                                 : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                          >
                             <Phone size={24} />
                          </a>
                       </div>
                    </div>
                 ))}

                 <button 
                   onClick={addContact}
                   className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                 >
                   <Plus size={18} />
                   Add Contact
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTaskForm(false)} />
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl relative z-10 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add New Task</h3>
            <div className="space-y-3">
              <input 
                autoFocus
                type="text"
                placeholder="What needs to be done?"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
              />
              <input 
                type="text"
                placeholder="Due Date (e.g. Tomorrow)"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowTaskForm(false)}
                className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={addTask}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Card */}
      <div className="bg-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        {/* Abstract decorative shape */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none"></div>

        <h2 className="text-2xl font-bold mb-1 relative z-10">Good Morning, {teacherName.split(' ')[0]}!</h2>
        <p className="text-slate-400 text-sm mb-4 relative z-10">
          You have {pendingTasksCount} pending tasks today.
        </p>
        <div className="flex gap-3 relative z-10">
           <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex-1 text-center cursor-pointer hover:bg-white/20 transition-colors border border-white/5" onClick={() => setView(AppView.LEAVES)}>
              <span className="block text-2xl font-bold">{leaves.length}</span>
              <span className="text-xs text-slate-300">Requests</span>
           </div>
           <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex-1 text-center cursor-pointer hover:bg-white/20 transition-colors border border-white/5" onClick={() => setView(AppView.GPA)}>
              <span className="block text-2xl font-bold">{calculateGPA()}</span>
              <span className="text-xs text-slate-300">Class Avg GPA</span>
           </div>
           <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex-1 text-center cursor-pointer hover:bg-white/20 transition-colors border border-white/5" onClick={() => { setSelectedDay(displayDay); setView(AppView.SCHEDULE); }}>
              <span className="block text-2xl font-bold">{todaysClassesCount}</span>
              <span className="text-xs text-slate-300">Classes ({displayDay})</span>
           </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => { setView(AppView.LEAVES); setShowLeaveForm(true); }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors group"
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full group-hover:bg-indigo-100 transition-colors">
            <Plus size={24} />
          </div>
          <span className="font-semibold text-slate-700 text-sm">New Leave</span>
        </button>
        <button 
          onClick={() => setView(AppView.SCHEDULE)}
          className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors group"
        >
           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full group-hover:bg-indigo-100 transition-colors">
            <Clock size={24} />
          </div>
          <span className="font-semibold text-slate-700 text-sm">View Timetable</span>
        </button>
         <button 
          onClick={() => setShowCallModal(true)}
          className="col-span-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-row items-center justify-center gap-3 hover:bg-slate-50 transition-colors group"
        >
           <div className="p-2 bg-green-50 text-green-600 rounded-full group-hover:bg-green-100 transition-colors">
            <Phone size={20} />
          </div>
          <span className="font-semibold text-slate-700 text-sm">Quick Call (Directory)</span>
        </button>
      </div>

      {/* Tasks Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare size={18} className="text-indigo-600" />
            My Tasks
          </h3>
          <div className="flex items-center gap-2">
             <span className="text-xs text-slate-400 font-medium">{pendingTasksCount} Remaining</span>
             <button 
               onClick={() => setShowTaskForm(true)}
               className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
             >
               <Plus size={18} />
             </button>
          </div>
        </div>
        <div className="space-y-3">
          {tasks.map(task => (
            <div 
              key={task.id} 
              onClick={() => toggleTask(task.id)}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors group"
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors 
                ${task.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white group-hover:border-indigo-400'}`}>
                {task.completed && <Check size={12} className="text-white" />}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium transition-colors ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {task.title}
                </p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Clock size={10} /> {task.dueDate}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const MarksGPAView = () => {
    const [activeTab, setActiveTab] = useState<'gradebook' | 'calculator'>('gradebook');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    const toggleSelectAll = () => {
      if (selectedStudents.length === students.length) {
        setSelectedStudents([]);
      } else {
        setSelectedStudents(students.map(s => s.id));
      }
    };

    const toggleStudent = (id: string) => {
      if (selectedStudents.includes(id)) {
        setSelectedStudents(selectedStudents.filter(sid => sid !== id));
      } else {
        setSelectedStudents([...selectedStudents, id]);
      }
    };

    const getRawGPA = (studentId: string) => {
        return parseFloat(calculateStudentGPA(studentId));
    };

    const selectedStats = (() => {
        if (selectedStudents.length === 0) return null;
        const gpas = selectedStudents.map(id => getRawGPA(id));
        const avg = gpas.reduce((a, b) => a + b, 0) / gpas.length;
        return {
            count: selectedStudents.length,
            avg: avg.toFixed(2),
            min: Math.min(...gpas).toFixed(2),
            max: Math.max(...gpas).toFixed(2)
        };
    })();

    return (
      <div className="h-full flex flex-col bg-slate-50 relative">
        <div className="p-4 bg-white border-b border-slate-100 shadow-sm z-10">
           <div className="flex items-center justify-center p-1 bg-slate-100 rounded-xl mb-4">
              <button 
                onClick={() => setActiveTab('gradebook')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'gradebook' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Class Gradebook
              </button>
              <button 
                onClick={() => setActiveTab('calculator')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'calculator' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Quick Calculator
              </button>
           </div>
           
           {activeTab === 'calculator' && (
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Avg GPA</h2>
                  <span className="text-4xl font-bold text-indigo-600">{calculateGPA()}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Subjects</span>
                  <span className="text-lg font-bold text-slate-700">{subjects.length}</span>
                </div>
              </div>
           )}
           {activeTab === 'gradebook' && (
             <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                   <GraduationCap className="text-indigo-600" /> Gradebook
                </h2>
                <p className="text-xs text-slate-400">Enter marks for {students.length} students across {subjects.length} subjects</p>
             </div>
           )}
        </div>
  
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
          {activeTab === 'calculator' ? (
             <div className="space-y-3">
                {subjects.map((sub) => (
                  <div key={sub.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2">
                       <input 
                         type="text" 
                         value={sub.name}
                         onChange={(e) => updateSubject(sub.id, 'name', e.target.value)}
                         placeholder="Subject Name"
                         className="flex-1 font-bold text-slate-800 placeholder-slate-300 border-none focus:ring-0 p-0 text-lg"
                       />
                       <button onClick={() => removeSubject(sub.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                         <Trash2 size={18} />
                       </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                       <div>
                         <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Credits</label>
                         <select 
                           value={sub.credits}
                           onChange={(e) => updateSubject(sub.id, 'credits', parseInt(e.target.value))}
                           className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
                         >
                           {[1,2,3,4,5].map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                       </div>
                       <div>
                         <label className="text-[10px] uppercase font-bold text-indigo-600 mb-1 block">Marks</label>
                         <input
                           type="number"
                           min="0"
                           max="100"
                           value={sub.marks}
                           onChange={(e) => updateSubjectMark(sub.id, parseInt(e.target.value) || 0)}
                           className="w-full bg-indigo-50 border border-indigo-200 rounded-lg p-2 text-sm font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
                         />
                       </div>
                       <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Grade</span>
                          <div className="flex items-baseline gap-1">
                              <span className="text-xl font-bold text-slate-800">{sub.gradeLetter}</span>
                              <span className="text-xs text-slate-500 font-mono">({sub.gradePoint})</span>
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={addSubject}
                  className="w-full py-4 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-400 font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add Subject
                </button>
             </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-20">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50">
                       <tr>
                          <th className="p-3 w-10 sticky left-0 bg-slate-50 z-20 border-b border-slate-200 border-r border-slate-100">
                             <input 
                               type="checkbox" 
                               className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                               checked={selectedStudents.length === students.length && students.length > 0}
                               onChange={toggleSelectAll}
                             />
                          </th>
                          <th className="p-3 text-xs font-bold text-slate-500 uppercase sticky left-10 bg-slate-50 z-10 border-b border-slate-200 min-w-[150px]">Student Name</th>
                          {subjects.map(sub => (
                             <th key={sub.id} className="p-3 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 min-w-[80px] text-center">
                                {sub.name}
                             </th>
                          ))}
                          <th className="p-3 text-xs font-bold text-indigo-600 uppercase border-b border-slate-200 min-w-[60px] text-center">GPA</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {students.map(student => (
                         <tr key={student.id} className={`hover:bg-slate-50/50 ${selectedStudents.includes(student.id) ? 'bg-indigo-50/30' : ''}`}>
                            <td className="p-3 sticky left-0 bg-white z-20 border-r border-slate-100">
                               <input 
                                 type="checkbox" 
                                 className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                 checked={selectedStudents.includes(student.id)}
                                 onChange={() => toggleStudent(student.id)}
                               />
                            </td>
                            <td className="p-3 sticky left-10 bg-white hover:bg-slate-50/50 z-10 border-r border-slate-100">
                               <div className="font-medium text-sm text-slate-800">{student.name}</div>
                               <div className="text-[10px] text-slate-400">{student.indexNo}</div>
                            </td>
                            {subjects.map(sub => (
                               <td key={sub.id} className="p-2 text-center">
                                  <input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="-"
                                    className="w-12 p-1 text-center bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                    value={studentMarks[student.id]?.[sub.id] || ''}
                                    onChange={(e) => updateStudentMark(student.id, sub.id, parseInt(e.target.value) || 0)}
                                  />
                               </td>
                            ))}
                            <td className="p-3 text-center font-bold text-indigo-600 text-sm">
                               {calculateStudentGPA(student.id)}
                            </td>
                         </tr>
                       ))}
                       {students.length === 0 && (
                          <tr>
                             <td colSpan={subjects.length + 3} className="p-8 text-center text-slate-400 text-sm">
                                No students found. Go to "My Class" to add students.
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
               </div>
               {subjects.length === 0 && (
                   <div className="p-4 text-center">
                      <p className="text-sm text-slate-400 mb-2">No subjects defined.</p>
                      <button onClick={addSubject} className="text-indigo-600 font-medium text-sm hover:underline">Add Subjects in Calculator Tab</button>
                   </div>
               )}
            </div>
          )}
        </div>

        {/* Floating Selection Summary */}
        {selectedStats && (
            <div className="absolute bottom-4 left-4 right-4 bg-indigo-900 text-white p-4 rounded-xl shadow-2xl flex justify-between items-center animate-in slide-in-from-bottom-4 z-30">
                <div className="flex items-center gap-3">
                   <div className="bg-white/10 p-2 rounded-lg">
                      <BarChart3 className="text-white" size={20} />
                   </div>
                   <div>
                      <p className="text-xs text-indigo-200 font-medium">Selected Students: {selectedStats.count}</p>
                      <h3 className="text-lg font-bold">Collective GPA: {selectedStats.avg}</h3>
                   </div>
                </div>
                <div className="text-right flex gap-4">
                   <div>
                      <p className="text-[10px] text-indigo-300 uppercase">Min</p>
                      <p className="font-bold text-sm">{selectedStats.min}</p>
                   </div>
                   <div>
                      <p className="text-[10px] text-indigo-300 uppercase">Max</p>
                      <p className="font-bold text-sm">{selectedStats.max}</p>
                   </div>
                </div>
            </div>
        )}
      </div>
    );
  };

  const ScheduleView = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const filteredSchedule = timetable.filter(item => item.day === selectedDay).sort((a, b) => a.startTime.localeCompare(b.startTime));

    return (
      <div className="h-full flex flex-col bg-slate-50 relative">
        {showPeriodForm ? (
          <div className="p-4 h-full flex flex-col animate-in slide-in-from-right bg-slate-50 z-20 absolute inset-0">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Add Period ({selectedDay})</h2>
                <button onClick={() => setShowPeriodForm(false)} className="text-slate-400 hover:text-slate-600">Close</button>
             </div>
             
             <div className="space-y-4 flex-1">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                   <input 
                     type="text"
                     placeholder="e.g. Mathematics"
                     className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                     value={newPeriod.subject}
                     onChange={(e) => setNewPeriod({...newPeriod, subject: e.target.value})}
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                      <input 
                        type="time"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newPeriod.startTime}
                        onChange={(e) => setNewPeriod({...newPeriod, startTime: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                      <input 
                        type="time"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newPeriod.endTime}
                        onChange={(e) => setNewPeriod({...newPeriod, endTime: e.target.value})}
                      />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Grade/Class</label>
                      <input 
                        type="text"
                        placeholder="e.g. 10-A"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newPeriod.grade}
                        onChange={(e) => setNewPeriod({...newPeriod, grade: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Room</label>
                      <input 
                        type="text"
                        placeholder="e.g. Lab 1"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newPeriod.room}
                        onChange={(e) => setNewPeriod({...newPeriod, room: e.target.value})}
                      />
                  </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Color Tag</label>
                   <div className="flex gap-3">
                      {PERIOD_COLORS.map(c => (
                        <button
                          key={c.name}
                          onClick={() => setNewPeriod({...newPeriod, color: c.value})}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${c.value.split(' ')[0]} 
                            ${newPeriod.color === c.value ? 'border-slate-600 scale-110' : 'border-transparent'}`}
                          title={c.name}
                        />
                      ))}
                   </div>
                </div>
             </div>

             <button 
               onClick={addPeriod}
               className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all mt-4"
             >
               Add to Timetable
             </button>
          </div>
        ) : (
          <>
            <div className="bg-white border-b border-slate-200 pt-4 px-4 pb-0 sticky top-0 z-10 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CalendarDays className="text-indigo-600" /> 
                Time Table
              </h2>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0">
                {days.map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-5 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors
                      ${selectedDay === day 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
              {filteredSchedule.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <Clock size={48} className="mb-2 opacity-20" />
                  <p>No classes scheduled for {selectedDay}</p>
                  <button 
                     onClick={() => setShowPeriodForm(true)}
                     className="mt-4 text-indigo-600 font-medium hover:underline text-sm"
                  >
                    Add your first class
                  </button>
                </div>
              ) : (
                filteredSchedule.map(item => (
                  <div key={item.id} className="flex gap-4 group relative">
                    <div className="w-16 flex flex-col items-end text-xs font-medium text-slate-400 py-3">
                        <span>{item.startTime}</span>
                        <span className="h-full w-0.5 bg-slate-200 my-1 group-last:hidden rounded-full"></span>
                    </div>
                    <div className={`flex-1 p-4 rounded-xl border mb-2 shadow-sm transition-transform active:scale-[0.99] ${item.color} relative`}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg">{item.subject}</h3>
                          <span className="text-xs font-bold px-2 py-1 bg-white/40 rounded-lg">{item.grade}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs opacity-80 font-medium">
                          <span className="flex items-center gap-1"><MapPin size={12} /> {item.room}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {item.endTime}</span>
                        </div>
                        
                        <button 
                           onClick={(e) => { e.stopPropagation(); removePeriod(item.id); }}
                           className="absolute top-2 right-2 p-1.5 bg-white/50 rounded-full text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-red-500"
                        >
                           <Trash2 size={14} />
                        </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
               onClick={() => setShowPeriodForm(true)}
               className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full text-white shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all z-20 shadow-indigo-500/30 active:scale-90"
            >
               <Plus size={28} />
            </button>
          </>
        )}
      </div>
    );
  };

  const LeavesView = () => (
    <div className="h-full flex flex-col bg-slate-50 relative">
      {/* Update Leave Status Modal */}
      {editingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingLeave(null)} />
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                 <h3 className="text-lg font-bold text-slate-800">Update Status</h3>
                 <button onClick={() => setEditingLeave(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                 <p className="text-xs text-slate-400 font-medium mb-1 uppercase">Request Summary</p>
                 <p className="text-sm font-bold text-slate-800">{editingLeave.type} Leave</p>
                 <p className="text-xs text-slate-600">{editingLeave.days} Day(s) • {editingLeave.startDate}</p>
                 <p className="text-xs text-slate-500 mt-1 italic">"{editingLeave.reason}"</p>
              </div>

              <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">Set Status to:</p>
                  
                  {/* Approve Option */}
                  <div className="border border-green-100 rounded-xl p-3 bg-green-50/50">
                      <button 
                        onClick={() => approverName.trim() ? handleLeaveStatusUpdate('Approved') : alert("Please enter approver's name")}
                        className="w-full flex items-center gap-2 text-green-700 font-bold mb-2 hover:bg-green-100 p-2 rounded-lg transition-colors justify-center"
                      >
                         <CheckCircle size={18} /> Approve
                      </button>
                      <input 
                        type="text" 
                        placeholder="Approved By (e.g. Principal)" 
                        className="w-full bg-white border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                        value={approverName}
                        onChange={(e) => setApproverName(e.target.value)}
                      />
                  </div>

                  {/* Reject Option */}
                  <button 
                    onClick={() => handleLeaveStatusUpdate('Rejected')}
                    className="w-full py-3 border border-red-100 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                     <XCircle size={18} /> Reject
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* AI Prompt Modal */}
      {showAiPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAiPrompt(false)} />
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10 animate-in zoom-in-95">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                 <Sparkles size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Enhance with AI?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                 Your leave reason is quite short. Would you like the AI Assistant to draft a formal, professional letter for you?
              </p>
              <div className="flex flex-col gap-3">
                 <button 
                   onClick={generateLeaveLetter}
                   className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                 >
                   <Bot size={18} /> Yes, Draft Letter
                 </button>
                 <button 
                   onClick={() => { setShowAiPrompt(false); processLeaveSubmission(); }}
                   className="w-full py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl"
                 >
                   No, Send as is
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Share Options Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeLeaveForms} />
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10 animate-in zoom-in-95">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                 <Check size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center mb-1">Leave Recorded!</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                 Select a method to submit your request to the Principal.
              </p>
              <div className="flex flex-col gap-3">
                 <button 
                   onClick={() => shareLeave('whatsapp')}
                   className="w-full py-3 bg-[#25D366] text-white rounded-xl font-bold shadow-lg shadow-green-500/20 hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-2"
                 >
                   <MessageCircle size={20} /> Submit via WhatsApp
                 </button>
                 <button 
                   onClick={() => shareLeave('sms')}
                   className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-500/20 hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                 >
                   <Smartphone size={20} /> Submit via SMS
                 </button>
                 <button 
                   onClick={closeLeaveForms}
                   className="w-full py-3 text-slate-400 font-medium hover:text-slate-600"
                 >
                   Close
                 </button>
              </div>
           </div>
        </div>
      )}

      {showLeaveForm ? (
        <div className="p-4 h-full flex flex-col animate-in slide-in-from-right relative z-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Request Leave</h2>
            <button onClick={() => setShowLeaveForm(false)} className="text-slate-400 hover:text-slate-600">Close</button>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
               <select 
                 className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                 value={newLeave.type}
                 onChange={(e) => setNewLeave({...newLeave, type: e.target.value as any})}
               >
                 <option value="Casual">Casual Leave</option>
                 <option value="Medical">Medical Leave</option>
                 <option value="Duty">Duty Leave</option>
                 <option value="Short">Short Leave</option>
               </select>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    onChange={(e) => setNewLeave({...newLeave, startDate: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Days)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={newLeave.days}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    onChange={(e) => setNewLeave({...newLeave, days: parseInt(e.target.value)})}
                  />
               </div>
             </div>

             <div className="relative">
               <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium text-slate-700">Reason / Letter</label>
                  <button 
                     onClick={generateLeaveLetter}
                     disabled={isGeneratingLetter}
                     className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                  >
                     {isGeneratingLetter ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                     {isGeneratingLetter ? 'Drafting...' : 'AI Draft'}
                  </button>
               </div>
               <textarea 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-48 resize-none"
                  placeholder="Enter reason or auto-generate a letter..."
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})}
               ></textarea>
               <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                 <Bot size={12} />
                 Tip: Tap 'AI Draft' to generate a formal letter instantly.
               </p>
             </div>
          </div>

          <button 
            onClick={handleLeaveSubmitClick}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all shrink-0 mt-4"
          >
            Submit Request
          </button>
        </div>
      ) : (
        <>
          <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-lg font-bold text-slate-800">Leave History</h2>
            <button 
              onClick={() => setShowLeaveForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Apply
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {leaves.map((leave) => (
               <div 
                  key={leave.id} 
                  onClick={() => openLeaveEdit(leave)}
                  className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4 active:scale-[0.98] transition-transform cursor-pointer group"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 
                    ${leave.type === 'Medical' ? 'bg-red-50 text-red-600' : 
                      leave.type === 'Duty' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                    <CalendarDays size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                       <h3 className="font-bold text-slate-800">{leave.type} Leave</h3>
                       <div className="flex flex-col items-end gap-1">
                         <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase
                           ${leave.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                             leave.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                           {leave.status}
                         </span>
                         {leave.status === 'Pending' && (
                           <span className="text-[10px] text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                             Tap to Update
                           </span>
                         )}
                       </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{leave.reason}</p>
                    
                    {leave.status === 'Approved' && leave.approvedBy && (
                       <div className="flex items-center gap-1 mt-2 text-xs font-medium text-green-600 bg-green-50/50 p-1.5 rounded-lg w-fit">
                          <CheckCircle size={10} />
                          <span>Approved by {leave.approvedBy}</span>
                       </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 font-medium">
                       <span className="flex items-center gap-1"><Clock size={12} /> {leave.startDate}</span>
                       <span className="flex items-center gap-1"><Briefcase size={12} /> {leave.days} Day(s)</span>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        </>
      )}
    </div>
  );

  const DocumentsView = () => (
    <div className="h-full flex flex-col bg-slate-50 relative">
      {/* Lightbox for viewing images */}
      {selectedDocImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedDocImage(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-red-400">
             <X size={32} />
          </button>
          <img src={selectedDocImage} className="max-w-full max-h-full rounded-lg" alt="Document" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Add Document Form */}
      {showDocForm && (
        <div className="p-4 h-full flex flex-col animate-in slide-in-from-right bg-slate-50 z-20 absolute inset-0">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Add Document</h2>
              <button onClick={() => setShowDocForm(false)} className="text-slate-400 hover:text-slate-600">Close</button>
           </div>
           
           <div className="space-y-4 flex-1">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Document Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Appointment Letter 2024"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
               <select 
                 className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                 value={newDoc.category}
                 onChange={(e) => setNewDoc({...newDoc, category: e.target.value as any})}
               >
                 <option value="Appointment">Appointment Letter</option>
                 <option value="Certificates">Certificates</option>
                 <option value="Payslips">Payslips</option>
                 <option value="Other">Other</option>
               </select>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Attach Document</label>
                
                {/* Camera Input */}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden"
                  ref={docCameraInputRef}
                  onChange={handleDocFileSelect}
                />
                
                {/* Gallery Input */}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden"
                  ref={docGalleryInputRef}
                  onChange={handleDocFileSelect}
                />

                {newDoc.imageUrl ? (
                   <div className="relative rounded-xl overflow-hidden border border-indigo-100 shadow-sm">
                      <img src={newDoc.imageUrl} alt="Preview" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-between p-3">
                         <span className="text-white text-xs font-medium">Image Selected</span>
                         <button 
                           onClick={() => setNewDoc({...newDoc, imageUrl: ''})}
                           className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                   </div>
                ) : (
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => docCameraInputRef.current?.click()}
                        className="h-32 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col items-center justify-center gap-2 text-indigo-600 hover:bg-indigo-100 transition-all active:scale-95"
                      >
                         <Camera size={28} />
                         <span className="text-xs font-bold">Scan Camera</span>
                      </button>
                      
                      <button 
                        onClick={() => docGalleryInputRef.current?.click()}
                        className="h-32 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
                      >
                         <FolderOpen size={28} />
                         <span className="text-xs font-bold">From Gallery</span>
                      </button>
                   </div>
                )}
             </div>
           </div>

           <button 
             onClick={saveDocument}
             className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all mt-4"
           >
             Save Document
           </button>
        </div>
      )}

      {/* Documents List */}
      {!showDocForm && (
        <>
          <div className="bg-white border-b border-slate-200 pt-4 px-4 pb-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
             <div>
               <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <FileText className="text-indigo-600" /> 
                 My Docs
               </h2>
               <p className="text-xs text-slate-400">Secure storage for personal files</p>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
             <div className="grid grid-cols-2 gap-4">
               {documents.map(doc => (
                 <div key={doc.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 group relative">
                    <div 
                      className="aspect-[4/5] bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer relative"
                      onClick={() => doc.imageUrl ? setSelectedDocImage(doc.imageUrl) : null}
                    >
                       {doc.imageUrl ? (
                         <img src={doc.imageUrl} alt={doc.title} className="w-full h-full object-cover" />
                       ) : (
                         <FileText size={48} className="text-slate-300" />
                       )}
                       
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    <div>
                       <h3 className="font-bold text-sm text-slate-800 truncate">{doc.title}</h3>
                       <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{doc.category}</span>
                          <button onClick={() => deleteDocument(doc.id)} className="text-slate-300 hover:text-red-500">
                             <Trash2 size={14} />
                          </button>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>

          <button
             onClick={() => setShowDocForm(true)}
             className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full text-white shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all z-20 shadow-indigo-500/30 active:scale-90"
          >
             <Plus size={28} />
          </button>
        </>
      )}
    </div>
  );

  const StudentsView = () => (
    <div className="h-full flex flex-col bg-slate-50 relative">
       {showStudentForm && (
         <div className="absolute inset-0 z-20 bg-slate-50 p-4 animate-in slide-in-from-right flex flex-col">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">{editingStudent.id ? 'Edit Student' : 'Add Student'}</h2>
              <button onClick={() => setShowStudentForm(false)} className="text-slate-400 hover:text-slate-600">Close</button>
           </div>
           
           <div className="space-y-4 flex-1">
             <div className="flex justify-center mb-6">
               <div className="relative">
                 <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                     {editingStudent.photoUrl ? (
                         <img src={editingStudent.photoUrl} alt="Student" className="w-full h-full object-cover" />
                     ) : (
                         <User size={40} className="text-slate-300" />
                     )}
                 </div>
                 <button 
                     onClick={() => studentFileInputRef.current?.click()}
                     className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors"
                 >
                     <Camera size={14} />
                 </button>
                 <input 
                     type="file" 
                     ref={studentFileInputRef}
                     className="hidden" 
                     accept="image/*"
                     onChange={handleStudentPhotoSelect}
                 />
               </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                />
             </div>
             
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Index Number</label>
                <input 
                  type="text"
                  placeholder="e.g. 10052"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingStudent.indexNo}
                  onChange={(e) => setEditingStudent({...editingStudent, indexNo: e.target.value})}
                />
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
               <select 
                 className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                 value={editingStudent.gender}
                 onChange={(e) => setEditingStudent({...editingStudent, gender: e.target.value as any})}
               >
                 <option value="Male">Male</option>
                 <option value="Female">Female</option>
               </select>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent/Guardian Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Mr. Smith"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingStudent.parentName}
                  onChange={(e) => setEditingStudent({...editingStudent, parentName: e.target.value})}
                />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                <input 
                  type="tel"
                  placeholder="e.g. 0771234567"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingStudent.contactNumber}
                  onChange={(e) => setEditingStudent({...editingStudent, contactNumber: e.target.value})}
                />
             </div>
           </div>

           <button 
             onClick={handleSaveStudent}
             className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all mt-4"
           >
             Save Student
           </button>
         </div>
       )}

       <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Users className="text-indigo-600" /> 
            My Class ({teacherClass})
          </h2>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Search student by name..."
               className="w-full bg-slate-100 pl-10 pr-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
               value={studentSearch}
               onChange={(e) => setStudentSearch(e.target.value)}
             />
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
          {students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).map(student => (
            <div key={student.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 group">
               <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden shrink-0
                 ${student.gender === 'Female' ? 'bg-pink-50 text-pink-600' : 'bg-indigo-50 text-indigo-600'}`}>
                 {student.photoUrl ? (
                    <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                 ) : (
                    student.name.charAt(0)
                 )}
               </div>
               <div className="flex-1 min-w-0">
                 <h3 className="font-bold text-slate-800 truncate">{student.name}</h3>
                 <p className="text-xs text-slate-500">Index: {student.indexNo}</p>
                 <p className="text-[10px] text-slate-400 mt-1 truncate">Guardian: {student.parentName}</p>
               </div>
               <div className="flex gap-2">
                 <button 
                    onClick={() => handleEditStudent(student)}
                    className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
                 >
                   <Pencil size={16} />
                 </button>
                 <button 
                    onClick={() => handleDeleteStudent(student.id)}
                    className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                 >
                   <Trash2 size={16} />
                 </button>
                 <a 
                   href={`tel:${student.contactNumber}`}
                   className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors shadow-sm border border-green-100"
                 >
                   <Phone size={16} />
                 </a>
               </div>
            </div>
          ))}
          {students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 && (
             <div className="text-center py-10 text-slate-400 text-sm">
                No students found.
             </div>
          )}
       </div>

       <button
          onClick={() => {
            setEditingStudent({ name: '', indexNo: '', parentName: '', contactNumber: '', gender: 'Male', photoUrl: '' });
            setShowStudentForm(true);
          }}
          className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full text-white shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all z-20 shadow-indigo-500/30 active:scale-90"
       >
          <Plus size={28} />
       </button>
    </div>
  );

  const SettingsView = () => (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <UserCog className="text-indigo-600" /> 
          Settings
        </h2>
      </div>

      <div className="p-4 space-y-6">
        
        {/* INSTALL APP BANNER */}
        {installPrompt && (
          <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg text-white flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                   <DownloadCloud size={24} className="text-white" />
                </div>
                <div>
                   <h3 className="font-bold text-sm">Install Smart TMS</h3>
                   <p className="text-[10px] text-indigo-100">Add to Home Screen for quick access</p>
                </div>
             </div>
             <button 
               onClick={handleInstallClick}
               className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-50 transition-colors"
             >
               Install
             </button>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl uppercase">
                  {teacherName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div>
                 <h3 className="font-bold text-lg text-slate-800">Profile Settings</h3>
                 <p className="text-xs text-slate-400">Update your personal information</p>
              </div>
           </div>

           <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teacher Name</label>
                <div className="relative">
                   <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                     type="text" 
                     value={teacherName}
                     onChange={(e) => setTeacherName(e.target.value)}
                     className="w-full bg-slate-50 pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class In-Charge</label>
                <div className="relative">
                   <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                     type="text" 
                     value={teacherClass}
                     onChange={(e) => setTeacherClass(e.target.value)}
                     className="w-full bg-slate-50 pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>
              </div>
           </div>
        </div>

        {/* EXPORT CARD */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-lg text-slate-800 mb-4">Export Data (CSV)</h3>
           <p className="text-xs text-slate-400 mb-4">Download your data for backup or reporting.</p>
           
           <div className="space-y-3">
             <button 
               onClick={exportStudents}
               className="w-full py-3 px-4 bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-between group"
             >
               <span className="flex items-center gap-2"><Users size={18} /> Student List</span>
               <Download size={18} className="text-indigo-400 group-hover:text-indigo-600" />
             </button>
             
             <button 
               onClick={exportMarks}
               className="w-full py-3 px-4 bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-between group"
             >
               <span className="flex items-center gap-2"><GraduationCap size={18} /> Marks & GPA Report</span>
               <Download size={18} className="text-indigo-400 group-hover:text-indigo-600" />
             </button>

             <button 
               onClick={exportLeaves}
               className="w-full py-3 px-4 bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-between group"
             >
               <span className="flex items-center gap-2"><CalendarDays size={18} /> Leave History</span>
               <Download size={18} className="text-indigo-400 group-hover:text-indigo-600" />
             </button>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-lg text-slate-800 mb-4">Data Management</h3>
           <button 
             onClick={() => {
               if(window.confirm("Are you sure? This will reset all students and documents to default mock data.")) {
                 setStudents(MOCK_STUDENTS);
                 setDocuments(MOCK_DOCUMENTS);
                 setTasks(MOCK_TASKS);
                 setTimetable(MOCK_TIMETABLE);
                 setStudentMarks({});
               }
             }}
             className="w-full py-3 border border-red-200 text-red-500 font-medium rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
           >
             <Trash2 size={18} />
             Reset All Data
           </button>
        </div>

        <div className="text-center py-6 text-slate-400">
           <p className="text-xs font-medium">Powered by</p>
           <p className="text-sm font-bold text-slate-500">Mindsoft Tech Solution</p>
           <a href="mailto:mindsofttechsolution@gmail.com" className="text-xs text-indigo-500 hover:underline mt-1 block">mindsofttechsolution@gmail.com</a>
           <p className="text-[10px] mt-1">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </div>
  );

  return (
    <Layout currentView={currentView} setView={setView} teacherName={teacherName} teacherClass={teacherClass}>
      {currentView === AppView.DASHBOARD && <DashboardView />}
      {currentView === AppView.GPA && <MarksGPAView />}
      {currentView === AppView.SCHEDULE && <ScheduleView />}
      {currentView === AppView.LEAVES && <LeavesView />}
      {currentView === AppView.DOCUMENTS && <DocumentsView />}
      {currentView === AppView.STUDENTS && <StudentsView />}
      {currentView === AppView.SETTINGS && <SettingsView />}
      {currentView === AppView.AI_ASSIST && <AIView />}
    </Layout>
  );
}