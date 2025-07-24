import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import "./Dashboard.css";
import api from "../api/axios";
import { auth } from "../firebase/firebase";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA00FF", "#4CAF50"];
const slotColors = ["#86efac", "#fca5a5", "#fde68a", "#a5b4fc", "#f9a8d4"];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const timeBlocks = [
  { id: "1", label: "7:30 - 9:00", start: "07:30", end: "09:00" },
  { id: "2", label: "9:15 - 10:45", start: "09:15", end: "10:45" },
  { id: "3", label: "10:45 - 12:15", start: "10:45", end: "12:15" },
  { id: "4", label: "1:15 - 2:45", start: "13:15", end: "14:45" },
  { id: "5", label: "2:45 - 4:15", start: "14:45", end: "16:15" },
  { id: "6", label: "4:30 - 6:00", start: "16:30", end: "18:00" },
];

export default function ImprovedDashboard() {
  const [schedules, setSchedules] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [viewMode, setViewMode] = useState("dashboard"); // "dashboard" or "sections"
  const [scheduleView, setScheduleView] = useState("weekly"); // Only "weekly" now
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedTeachers, setExpandedTeachers] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Wait for user to be authenticated
      const user = auth.currentUser;
      if (!user) {
        console.log("⏳ Waiting for user authentication...");
        setLoading(false);
        return;
      }
      
      // Add a small delay to ensure token is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        console.log("🔍 Fetching dashboard data for user:", user.uid);
        
        // Fetch schedules from backend API
        const schedulesRes = await api.get("/schedules");
        setSchedules(schedulesRes.data);

        // Fetch all other data from backend API
        const [sectionsRes, subjectsRes, roomsRes, teachersRes, coursesRes] = await Promise.all([
          api.get("/sections"),
          api.get("/subjects"),
          api.get("/classrooms"),
          api.get("/teachers"),
          api.get("/courses")
        ]);
        const sectionsData = sectionsRes.data;
        setSections(sectionsData);
        setSubjects(subjectsRes.data);
        setRooms(roomsRes.data);
        setTeachers(teachersRes.data);
        setCourses(coursesRes.data);

        // Set default selected section (first one)
        if (sectionsData.length > 0) {
          setSelectedSection(sectionsData[0].id);
        }

        // Initialize expanded states
        const initialSectionExpandedState = {};
        sectionsData.forEach(section => {
          initialSectionExpandedState[section.id] = true;
        });
        setExpandedSections(initialSectionExpandedState);

        const initialTeacherExpandedState = {};
        teachersRes.data.forEach(teacher => {
          initialTeacherExpandedState[teacher.id] = true;
        });
        setExpandedTeachers(initialTeacherExpandedState);
      } catch (err) {
        console.error("❌ Error fetching dashboard data:", err);
        setSchedules([]);
        setSections([]);
        setSubjects([]);
        setRooms([]);
        setTeachers([]);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [auth.currentUser]); // Add auth.currentUser as dependency

  // Helper functions
  const getSectionName = (id) => {
    const section = sections.find(sec => sec.id === id);
    return section ? section.name : "Unknown Section";
  };
  
  const getSubjectName = (id) => {
    const subject = subjects.find(sub => sub.id === id);
    return subject ? subject.name : "Unknown Subject";
  };
  
  const getRoomName = (id) => {
    const room = rooms.find(r => r.id === id);
    return room ? room.name : "Unknown Room";
  };
  
  const getCourseName = (id) => {
    const course = courses.find(c => c.id === id);
    return course ? course.name : "Unknown Grade";
  };

  const getColor = (subjectId) => {
    if (!subjectId) return slotColors[0];
    const index = subjectId.charCodeAt(0) % slotColors.length;
    return slotColors[index];
  };
  
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  const toggleTeacher = (teacherId) => {
    setExpandedTeachers(prev => ({
      ...prev,
      [teacherId]: !prev[teacherId]
    }));
  };

  const getTeacherName = (id) => {
    const teacher = teachers.find(t => t.id === id);
    return teacher ? teacher.name : "Unknown Teacher";
  };

  // Analytics calculations
  const calculateSummaryStats = () => {
    return {
      facultyCount: teachers.length,
      classroomCount: rooms.length,
      totalSchedules: schedules.length
    };
  };

  const calculateRoomUtilization = () => {
    const roomUtilization = {};
    
    // Initialize all rooms with 0 usage
    rooms.forEach(room => {
      roomUtilization[room.id] = 0;
    });
    
    // Count scheduled classes per room
    schedules.forEach(schedule => {
      if (roomUtilization.hasOwnProperty(schedule.room)) {
        roomUtilization[schedule.room]++;
      }
    });
    
    // Convert to array format for chart
    return Object.keys(roomUtilization).map(roomId => {
      const room = rooms.find(r => r.id === roomId);
      return {
        name: room ? room.name : "Unknown",
        value: roomUtilization[roomId]
      };
    }).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5 rooms
  };

  const calculateTeacherWorkload = () => {
    const teacherLoad = {};
    let totalLoad = 0;
    
    // Count classes per teacher
    schedules.forEach(schedule => {
      if (!teacherLoad[schedule.teacherId]) {
        teacherLoad[schedule.teacherId] = 0;
      }
      teacherLoad[schedule.teacherId]++;
      totalLoad++;
    });
    
    // Calculate workload status
    const workloadStatus = {
      balanced: 0,
      overloaded: 0,
      underloaded: 0
    };
    
    Object.keys(teacherLoad).forEach(teacherId => {
      const load = teacherLoad[teacherId];
      const teacher = teachers.find(t => t.id === teacherId);
      const maxLoad = teacher && teacher.status === "Full-time" ? 20 : 12;
      
      if (load > maxLoad) {
        workloadStatus.overloaded++;
      } else if (load < maxLoad * 0.7) {
        workloadStatus.underloaded++;
      } else {
        workloadStatus.balanced++;
      }
    });
    
    // Calculate percentage of balanced teachers
    const balancedPercentage = teachers.length > 0 
      ? Math.round((workloadStatus.balanced / teachers.length) * 100) 
      : 0;
    
    return {
      balancedPercentage,
      workloadStatus
    };
  };

  const calculateDayDistribution = () => {
    const dayDistribution = {};
    
    // Initialize all days with 0
    days.forEach(day => {
      dayDistribution[day] = 0;
    });
    
    // Count schedules per day
    schedules.forEach(schedule => {
      if (dayDistribution.hasOwnProperty(schedule.day)) {
        dayDistribution[schedule.day]++;
      }
    });
    
    // Convert to array format for chart
    return Object.keys(dayDistribution).map(day => ({
      name: day,
      classes: dayDistribution[day]
    }));
  };

  // Group schedules by sectionId
  const groupedSchedulesBySection = schedules.reduce((groups, schedule) => {
    if (!groups[schedule.sectionId]) {
      groups[schedule.sectionId] = [];
    }
    groups[schedule.sectionId].push(schedule);
    return groups;
  }, {});
  
  // Group schedules by teacherId
  const groupedSchedulesByTeacher = schedules.reduce((groups, schedule) => {
    if (!groups[schedule.teacherId]) {
      groups[schedule.teacherId] = [];
    }
    groups[schedule.teacherId].push(schedule);
    return groups;
  }, {});

  // Get computed values
  const stats = calculateSummaryStats();
  const roomUtilization = calculateRoomUtilization();
  const { balancedPercentage } = calculateTeacherWorkload();
  const dayDistribution = calculateDayDistribution();

  // Filter schedules for selected section's weekly view
  const filteredSchedules = selectedSection 
    ? schedules.filter(s => s.sectionId === selectedSection)
    : [];

  // Remove toggleScheduleView, only weekly view remains

  if (loading) {
    return (
      <div className="main-content-expanded">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Loading dashboard...</h1>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="main-content-expanded">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            School Scheduler Dashboard
          </h1>
          <div className="user-info">
            <span>Admin</span>
            <div className="user-avatar">A</div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-value">{stats.facultyCount}</div>
            <div className="card-label">Faculty Members</div>
          </div>
          <div className="summary-card">
            <div className="card-value">{stats.classroomCount}</div>
            <div className="card-label">Classrooms</div>
          </div>
          <div className="summary-card">
            <div className="card-value">{stats.totalSchedules}</div>
            <div className="card-label">Total Classes</div>
          </div>
        </div>

        {/* Schedule Section with Toggle */}
        <div className="section-container full-width">
          <div className="section-title" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
            <div>
              <span
                style={{
                  fontWeight: viewMode === "dashboard" ? "bold" : "normal",
                  cursor: "pointer",
                  marginRight: "20px"
                }}
                onClick={() => setViewMode("dashboard")}
              >Section Weekly Schedule</span>
              <span
                style={{
                  fontWeight: viewMode === "teachers" ? "bold" : "normal",
                  cursor: "pointer"
                }}
                onClick={() => setViewMode("teachers")}
              >Teacher Weekly Schedule</span>
              {viewMode === "dashboard" && sections.length > 0 && (
                <select 
                  value={selectedSection || ''}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  style={{ marginLeft: "15px", padding: "4px", fontSize: "14px", borderRadius: "4px", maxWidth: "200px" }}
                >
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Weekly Schedule View - Section or Teacher */}
          {viewMode === "dashboard" ? (
            <div className="schedule-grid">
              {days.map(day => (
                <div key={day} className="day-column">
                  <div className="day-header">{day}</div>
                  {timeBlocks.map(block => {
                    const scheduledClass = filteredSchedules.find(
                      s => s.day === day && s.timeBlockId === block.id
                    );
                    return (
                      <div 
                        key={`${day}-${block.id}`} 
                        className={`schedule-slot ${!scheduledClass ? 'empty' : ''}`}
                        style={{ 
                          backgroundColor: scheduledClass ? getColor(scheduledClass.subjectId) : undefined,
                        }}
                      >
                        {scheduledClass ? (
                          <>
                            <div style={{ fontWeight: 'bold' }}>{getSubjectName(scheduledClass.subjectId)}</div>
                            <div style={{ fontSize: '11px' }}>{block.label}</div>
                            <div style={{ fontSize: '11px' }}>{getTeacherName(scheduledClass.teacherId)}</div>
                            <div style={{ fontSize: '11px' }}>{getRoomName(scheduledClass.room)}</div>
                          </>
                        ) : (
                          <div style={{ color: '#94a3b8', fontSize: '11px' }}>{block.label}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div>
              {teachers.map(teacher => (
                <div key={teacher.id} style={{ marginBottom: "32px" }}>
                  <h3 style={{ marginBottom: "8px", color: "#003366" }}>{teacher.name} ({teacher.status})</h3>
                  <div className="schedule-grid">
                    {days.map(day => (
                      <div key={day} className="day-column">
                        <div className="day-header">{day}</div>
                        {timeBlocks.map(block => {
                          const scheduledClass = groupedSchedulesByTeacher[teacher.id]?.find(
                            s => s.day === day && s.timeBlockId === block.id
                          );
                          return (
                            <div 
                              key={`${teacher.id}-${day}-${block.id}`} 
                              className={`schedule-slot ${!scheduledClass ? 'empty' : ''}`}
                              style={{ 
                                backgroundColor: scheduledClass ? getColor(scheduledClass.subjectId) : undefined,
                              }}
                            >
                              {scheduledClass ? (
                                <>
                                  <div style={{ fontWeight: 'bold' }}>{getSubjectName(scheduledClass.subjectId)}</div>
                                  <div style={{ fontSize: '11px' }}>{block.label}</div>
                                  <div style={{ fontSize: '11px' }}>{getSectionName(scheduledClass.sectionId)}</div>
                                  <div style={{ fontSize: '11px' }}>{getRoomName(scheduledClass.room)}</div>
                                </>
                              ) : (
                                <div style={{ color: '#94a3b8', fontSize: '11px' }}>{block.label}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analytics Section */}
        <div className="analytics-container">
          {/* Classroom Utilization Chart */}
          <div className="analytics-card">
            <div className="section-title">
              <span>Classroom Utilization</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={roomUtilization}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#64748b" />
                <YAxis tick={{fontSize: 12}} stroke="#64748b" />
                <Tooltip 
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="value" fill="#003366" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Faculty Workload Chart */}
          <div className="analytics-card">
            <div className="section-title">
              <span>Faculty Workload</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Balanced', value: balancedPercentage },
                    { name: 'Other', value: 100 - balancedPercentage }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#003366"
                  dataKey="value"
                >
                  <Cell fill="#003366" />
                  <Cell fill="#e2e8f0" />
                </Pie>
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontSize: '24px', fontWeight: 'bold', fill: '#003366' }}
                >
                  {balancedPercentage}%
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Distribution Chart */}
        <div className="section-container">
          <div className="section-title">
            <span>Classes Per Day</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dayDistribution}>
              <defs>
                <linearGradient id="colorClasses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#003366" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#003366" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#64748b" />
              <YAxis tick={{fontSize: 12}} stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="classes" 
                stroke="#003366" 
                fillOpacity={1} 
                fill="url(#colorClasses)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}