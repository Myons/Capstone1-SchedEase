import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Define time blocks to match Schedule.jsx
const timeBlocks = [
  { id: "1", label: "7:30 - 9:00", start: "07:30", end: "09:00" },
  { id: "2", label: "9:15 - 10:45", start: "09:15", end: "10:45" },
  { id: "3", label: "10:45 - 12:15", start: "10:45", end: "12:15" },
  { id: "4", label: "1:15 - 2:45", start: "13:15", end: "14:45" },
  { id: "5", label: "2:45 - 4:15", start: "14:45", end: "16:15" },
  { id: "6", label: "4:30 - 6:00", start: "16:30", end: "18:00" },
];

const colors = ["#86efac", "#fca5a5", "#fde68a", "#a5b4fc", "#f9a8d4"]; // pastel green, red, yellow, etc.

export default function Dashboard() {
  const [schedules, setSchedules] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedTeachers, setExpandedTeachers] = useState({});
  const [viewMode, setViewMode] = useState("sections"); // "sections" or "teachers"

  useEffect(() => {
    const fetchData = async () => {
      // Fetch schedules
      const schedulesSnapshot = await getDocs(collection(db, "schedules"));
      const schedulesData = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchedules(schedulesData);

      // Fetch sections
      const sectionsSnapshot = await getDocs(collection(db, "sections"));
      const sectionsData = sectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSections(sectionsData);
      
      // Fetch subjects
      const subjectsSnapshot = await getDocs(collection(db, "subjects"));
      const subjectsData = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjects(subjectsData);
      
      // Fetch rooms
      const roomsSnapshot = await getDocs(collection(db, "rooms"));
      const roomsData = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(roomsData);
      
      // Fetch teachers
      const teachersSnapshot = await getDocs(collection(db, "teachers"));
      const teachersData = teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(teachersData);
      
      // Fetch courses
      const coursesSnapshot = await getDocs(collection(db, "courses"));
      const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(coursesData);
      
      // Initialize all sections as expanded by default
      const initialSectionExpandedState = {};
      sectionsData.forEach(section => {
        initialSectionExpandedState[section.id] = true;
      });
      setExpandedSections(initialSectionExpandedState);
      
      // Initialize all teachers as expanded by default
      const initialTeacherExpandedState = {};
      teachersData.forEach(teacher => {
        initialTeacherExpandedState[teacher.id] = true;
      });
      setExpandedTeachers(initialTeacherExpandedState);
    };

    fetchData();
  }, []);

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
    // Pick color based on hash of subjectId
    if (!subjectId) return colors[0];
    const index = subjectId.charCodeAt(0) % colors.length;
    return colors[index];
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4" > Dashboard</h1>
      
      {/* View mode toggle */}
      <div className="mb-6 flex space-x-4">
        <button 
          onClick={() => setViewMode("sections")}
          className={`px-4 py-2 rounded-lg ${viewMode === "sections" 
            ? "bg-blue-600 text-white font-bold" 
            : "bg-gray-200 text-gray-800"}`}
        >
          Section Timetables
        </button>
        <button 
          onClick={() => setViewMode("teachers")}
          className={`px-4 py-2 rounded-lg ${viewMode === "teachers" 
            ? "bg-blue-600 text-white font-bold" 
            : "bg-gray-200 text-gray-800"}`}
        >
          Teacher Schedules
        </button>
      </div>

      {/* Section View */}
      {viewMode === "sections" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Section Timetables</h2>
          
          {Object.keys(groupedSchedulesBySection).map((sectionId) => (
            <div key={sectionId} className="mb-8 border rounded-lg shadow-sm overflow-hidden">
              <div 
                className="bg-blue-100 p-4 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection(sectionId)}
              >
                <h2 className="text-xl font-bold text-blue-900">{getSectionName(sectionId)}</h2>
                <div className="text-blue-800">
                  {expandedSections[sectionId] ? (
                    <span className="block font-bold text-xl">▲</span>
                  ) : (
                    <span className="block font-bold text-xl">▼</span>
                  )}
                </div>
              </div>

              {/* Collapsible Grid */}
              {expandedSections[sectionId] && (
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed border">
                    <thead className="bg-blue-900 text-white">
                      <tr>
                        <th className="p-2 w-28">Time</th>
                        {days.map((day) => (
                          <th key={day} className="p-2">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeBlocks.map((block) => (
                        <tr key={block.id}>
                          <td className="p-2 font-semibold">{block.label}</td>
                          {days.map((day) => {
                            const scheduledClass = groupedSchedulesBySection[sectionId]?.find(
                              (s) => s.day === day && s.timeBlockId === block.id
                            );
                            return (
                              <td key={day} className="border p-2 h-20 align-top">
                                {scheduledClass && (
                                  <div
                                    style={{
                                      backgroundColor: getColor(scheduledClass.subjectId),
                                      padding: "6px",
                                      borderRadius: "8px",
                                      textAlign: "center",
                                      fontSize: "14px",
                                    }}
                                  >
                                    <div className="font-semibold">{getSubjectName(scheduledClass.subjectId)}</div>
                                    <div>{scheduledClass.teacherName}</div>
                                    <div>{getRoomName(scheduledClass.room)}</div>
                                    <div className="text-xs mt-1">{scheduledClass.classType}</div>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Teacher View */}
      {viewMode === "teachers" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Teacher Schedules</h2>
          
          {Object.keys(groupedSchedulesByTeacher).map((teacherId) => {
            const teacher = teachers.find(t => t.id === teacherId);
            return (
              <div key={teacherId} className="mb-8 border rounded-lg shadow-sm overflow-hidden">
                <div 
                  className="bg-green-100 p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleTeacher(teacherId)}
                >
                  <div>
                    <h2 className="text-xl font-bold text-green-900">
                      {teacher?.name || "Unknown Teacher"}
                    </h2>
                    <p className="text-green-800">
                      {getSubjectName(teacher?.subjectId)} Teacher
                    </p>
                  </div>
                  <div className="text-green-800">
                    {expandedTeachers[teacherId] ? (
                      <span className="block font-bold text-xl">▲</span>
                    ) : (
                      <span className="block font-bold text-xl">▼</span>
                    )}
                  </div>
                </div>

                {/* Collapsible Grid */}
                {expandedTeachers[teacherId] && (
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed border">
                      <thead className="bg-green-900 text-white">
                        <tr>
                          <th className="p-2 w-28">Time</th>
                          {days.map((day) => (
                            <th key={day} className="p-2">{day}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeBlocks.map((block) => (
                          <tr key={block.id}>
                            <td className="p-2 font-semibold">{block.label}</td>
                            {days.map((day) => {
                              const scheduledClass = groupedSchedulesByTeacher[teacherId]?.find(
                                (s) => s.day === day && s.timeBlockId === block.id
                              );
                              return (
                                <td key={day} className="border p-2 h-20 align-top">
                                  {scheduledClass && (
                                    <div
                                      style={{
                                        backgroundColor: getColor(scheduledClass.subjectId),
                                        padding: "6px",
                                        borderRadius: "8px",
                                        textAlign: "center",
                                        fontSize: "14px",
                                      }}
                                    >
                                      <div className="font-semibold">{getCourseName(scheduledClass.courseId)} - {getSectionName(scheduledClass.sectionId)}</div>
                                      <div>{getSubjectName(scheduledClass.subjectId)}</div>
                                      <div>{getRoomName(scheduledClass.room)}</div>
                                      <div className="text-xs mt-1">{scheduledClass.classType}</div>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}