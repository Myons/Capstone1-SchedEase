import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import "./Schedule.css"; // Import the new CSS file

export default function Schedule() {
  const [schedules, setSchedules] = useState([]);
  
  // Form fields
  const [classType, setClassType] = useState("lecture");
  const [room, setRoom] = useState("");
  const [day, setDay] = useState("Monday");
  const [timeBlock, setTimeBlock] = useState("");
  
  // Data collections
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // Selection state
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  
  // Modal states - use Boolean values
  const [showSelectionForm, setShowSelectionForm] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  
  const [conflictDetails, setConflictDetails] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // Predefined time blocks
  const timeBlocks = [
    { id: "1", label: "7:30 - 9:00", start: "07:30", end: "09:00" },
    { id: "2", label: "9:15 - 10:45", start: "09:15", end: "10:45" },
    { id: "3", label: "10:45 - 12:15", start: "10:45", end: "12:15" },
    { id: "4", label: "1:15 - 2:45", start: "13:15", end: "14:45" },
    { id: "5", label: "2:45 - 4:15", start: "14:45", end: "16:15" },
    { id: "6", label: "4:30 - 6:00", start: "16:30", end: "18:00" },
  ];

  useEffect(() => {
    // Subscribe to schedules collection
    const unsubscribe = onSnapshot(collection(db, "schedules"), (snapshot) => {
      const scheduleData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSchedules(scheduleData);
    });

    // Fetch courses (grade levels)
    const fetchCourses = async () => {
      const courseSnapshot = await getDocs(collection(db, "courses"));
      setCourses(courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    // Fetch sections
    const fetchSections = async () => {
      const sectionSnapshot = await getDocs(collection(db, "sections"));
      setSections(sectionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    // Fetch subjects
    const fetchSubjects = async () => {
      const subjectSnapshot = await getDocs(collection(db, "subjects"));
      setSubjects(subjectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    
    // Fetch teachers
    const fetchTeachers = async () => {
      const teacherSnapshot = await getDocs(collection(db, "teachers"));
      setTeachers(teacherSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    // Fetch rooms
    const fetchRooms = async () => {
      const roomSnapshot = await getDocs(collection(db, "rooms"));
      setRooms(roomSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchCourses();
    fetchSections();
    fetchSubjects();
    fetchTeachers();
    fetchRooms();

    return () => unsubscribe();
  }, []);

  const getCourseName = (id) => courses.find(course => course.id === id)?.name || "Unknown";
  const getSectionName = (id) => sections.find(section => section.id === id)?.name || "Unknown";
  const getSubjectName = (id) => subjects.find(subject => subject.id === id)?.name || "Unknown";
  const getTeacherName = (id) => teachers.find(teacher => teacher.id === id)?.name || "Unknown";
  const getRoomName = (id) => rooms.find(room => room.id === id)?.name || "Unknown";
  
  const getTeacherSubject = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher && teacher.subjectId) {
      return getSubjectName(teacher.subjectId);
    }
    return "Unknown Subject";
  };

  // Show selection summary before submitting
  const handleShowSelections = () => {
    // Check if essential fields are selected
    if (!selectedTeacher || !selectedCourse || !selectedSection || !room || !timeBlock) {
      alert("Please fill all required fields before reviewing!");
      return;
    }
    
    setShowSelectionModal(true);
  };

  const handleAddSchedule = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!selectedTeacher || !selectedCourse || !selectedSection || !room || !timeBlock) {
      alert("Please fill all fields!");
      return;
    }

    const selectedTimeBlock = timeBlocks.find(block => block.id === timeBlock);
    const startTime = selectedTimeBlock.start;
    const endTime = selectedTimeBlock.end;

    // Check for room conflicts with overlapping time
    const roomConflict = schedules.find(s =>
      s.day === day &&
      s.room === room &&
      s.timeBlockId === timeBlock
    );

    // Check for teacher conflicts
    const teacherConflict = schedules.find(s =>
      s.day === day &&
      s.teacherId === selectedTeacher &&
      s.timeBlockId === timeBlock
    );

    // Check for section conflicts
    const sectionConflict = schedules.find(s =>
      s.day === day &&
      s.sectionId === selectedSection &&
      s.timeBlockId === timeBlock
    );

    if (roomConflict || teacherConflict || sectionConflict) {
      // Determine conflict type and collect details
      let conflictingSchedules = [];
      
      if (roomConflict) {
        conflictingSchedules = schedules.filter(s =>
          s.day === day &&
          s.room === room &&
          s.timeBlockId === timeBlock
        );
      } else if (teacherConflict) {
        conflictingSchedules = schedules.filter(s =>
          s.day === day &&
          s.teacherId === selectedTeacher &&
          s.timeBlockId === timeBlock
        );
      } else if (sectionConflict) {
        conflictingSchedules = schedules.filter(s =>
          s.day === day &&
          s.sectionId === selectedSection &&
          s.timeBlockId === timeBlock
        );
      }

      // Find available time blocks for this room/teacher/section on this day
      const usedTimeBlocks = schedules
        .filter(s => 
          s.day === day && 
          (s.room === room || s.teacherId === selectedTeacher || s.sectionId === selectedSection)
        )
        .map(s => s.timeBlockId);
      
      const freeTimeBlocks = timeBlocks.filter(block => !usedTimeBlocks.includes(block.id));

      setConflictDetails(conflictingSchedules);
      setSuggestions(freeTimeBlocks);
      setShowConflictModal(true);
      return;
    }

    // Get teacher's subject ID
    const teacher = teachers.find(t => t.id === selectedTeacher);
    const subjectId = teacher?.subjectId || "";
    const selectedTimeBlockDetails = timeBlocks.find(block => block.id === timeBlock);

    await addDoc(collection(db, "schedules"), {
      teacherId: selectedTeacher,
      teacherName: getTeacherName(selectedTeacher),
      courseId: selectedCourse,
      sectionId: selectedSection,
      subjectId: subjectId,
      room,
      classType,
      day,
      timeBlockId: timeBlock,
      timeBlockLabel: selectedTimeBlockDetails.label,
      startTime: selectedTimeBlockDetails.start,
      endTime: selectedTimeBlockDetails.end,
    });

    clearForm();
  };

  const clearForm = () => {
    setClassType("lecture"); 
    setSelectedTeacher("");
    setSelectedCourse("");
    setSelectedSection("");
    setRoom("");
    setTimeBlock("");
    setDay("Monday");
    setShowSelectionForm(false); // Hide the modal after adding a schedule
    setShowSelectionModal(false);
  };

  const handleDelete = async (id) => {
    const confirmDelete = confirm("Are you sure you want to delete this schedule?");
    if (confirmDelete) {
      await deleteDoc(doc(db, "schedules", id));
    }
  };

  // Filter rooms based on selected class type
  const filteredRooms = rooms.filter(room => room.type === classType);

  return (
    <div className="schedule-container">
      <h1 className="text-2xl font-bold mb-6">Schedule Management</h1>

      {/* Add Schedule Button */}
      <div className="mb-6">
        <button 
          onClick={() => setShowSelectionForm(true)} 
          className="add-button"
        >
          Add Schedule
        </button>
      </div>

      {/* Add Schedule Form Modal */}
      {showSelectionForm && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Create New Schedule</h2>
              <button 
                onClick={() => setShowSelectionForm(false)} 
                className="close-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddSchedule}>
              <div className="form-grid">
                {/* Class Type selection */}
                <div className="form-group">
                  <label className="form-label">Class Type</label>
                  <select
                    value={classType}
                    onChange={(e) => {
                      setClassType(e.target.value);
                      setRoom(""); // Reset room when class type changes
                    }}
                    className="form-control"
                    required
                  >
                    <option value="lecture">Lecture</option>
                    <option value="laboratory">Laboratory</option>
                  </select>
                </div>
                
                {/* Room selection */}
                <div className="form-group">
                  <label className="form-label">Room</label>
                  <select
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="form-control"
                    required
                  >
                    <option value="">Select Room</option>
                    {filteredRooms.map((room) => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Day selection */}
                <div className="form-group">
                  <label className="form-label">Day</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="form-control"
                    required
                  >
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                    <option>Saturday</option>
                  </select>
                </div>

                {/* Course/grade level selection */}
                <div className="form-group">
                  <label className="form-label">Grade Level</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => {
                      setSelectedCourse(e.target.value);
                      setSelectedSection("");
                      setSelectedTeacher("");
                    }}
                    className="form-control"
                    required
                  >
                    <option value="">Select Grade Level</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>

                {/* Section selection */}
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => {
                      setSelectedSection(e.target.value);
                      setSelectedTeacher("");
                    }}
                    className="form-control"
                    disabled={!selectedCourse}
                    required
                  >
                    <option value="">Select Section</option>
                    {sections
                      .filter((section) => section.courseId === selectedCourse)
                      .map((section) => (
                        <option key={section.id} value={section.id}>{section.name}</option>
                      ))}
                  </select>
                </div>

                {/* Teacher selection */}
                <div className="form-group">
                  <label className="form-label">Teacher</label>
                  <select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    className="form-control"
                    disabled={!selectedSection}
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers
                      .filter((teacher) => teacher.sectionId === selectedSection || !teacher.sectionId)
                      .map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} ({getSubjectName(teacher.subjectId)})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Time block selection */}
                <div className="form-group">
                  <label className="form-label">Time Block</label>
                  <select
                    value={timeBlock}
                    onChange={(e) => setTimeBlock(e.target.value)}
                    className="form-control"
                    required
                  >
                    <option value="">Select Time Block</option>
                    {timeBlocks.map((block) => (
                      <option key={block.id} value={block.id}>{block.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                {/* Review Selections Button */}
                <button 
                  type="button" 
                  onClick={handleShowSelections} 
                  className="btn btn-success"
                >
                  Review Selections
                </button>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Save Schedule
                </button>
                
                {/* Cancel Button */}
                <button 
                  type="button" 
                  onClick={() => setShowSelectionForm(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selection Summary Modal */}
      {showSelectionModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2 className="modal-title">Confirm Your Selections</h2>
              <button 
                onClick={() => setShowSelectionModal(false)} 
                className="close-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="modal-content">
              <div className="summary-grid">
                <div className="summary-label">Class Type:</div>
                <div>{classType === "lecture" ? "Lecture" : "Laboratory"}</div>
                
                <div className="summary-label">Room:</div>
                <div>{getRoomName(room)}</div>
                
                <div className="summary-label">Day:</div>
                <div>{day}</div>
                
                <div className="summary-label">Grade Level:</div>
                <div>{getCourseName(selectedCourse)}</div>
                
                <div className="summary-label">Section:</div>
                <div>{getSectionName(selectedSection)}</div>
                
                <div className="summary-label">Teacher:</div>
                <div>{getTeacherName(selectedTeacher)}</div>
                
                <div className="summary-label">Subject:</div>
                <div>{getTeacherSubject(selectedTeacher)}</div>
                
                <div className="summary-label">Time Block:</div>
                <div>{timeBlocks.find(block => block.id === timeBlock)?.label || ""}</div>
              </div>
            </div>

            <div className="form-actions">
              <button
                onClick={() => setShowSelectionModal(false)}
                className="btn btn-secondary"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  setShowSelectionModal(false);
                  handleAddSchedule(e);
                }}
                className="btn btn-primary"
              >
                Confirm & Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Modal */}
      {showConflictModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2 className="modal-title">Conflict Detected</h2>
              <button 
                onClick={() => setShowConflictModal(false)} 
                className="close-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="modal-content">
              <p className="mb-2">Conflicting schedules found:</p>
              <ul>
                {conflictDetails.map((conflict, idx) => (
                  <li key={idx}>
                    {conflict.teacherName} | {conflict.room} | {conflict.day} | {conflict.timeBlockLabel}
                  </li>
                ))}
              </ul>
              <p className="font-semibold mt-4">Suggested available time blocks:</p>
              <ul>
                {suggestions.length > 0 ? suggestions.map((slot, idx) => (
                  <li key={idx}>
                    {slot.label}
                  </li>
                )) : (
                  <li>No available time blocks for this day</li>
                )}
              </ul>
            </div>

            <div className="form-actions">
              <button
                onClick={() => setShowConflictModal(false)}
                className="btn btn-danger"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Table */}
      <div className="overflow-x-auto">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Subject</th>
              <th>Grade Level</th>
              <th>Section</th>
              <th>Room</th>
              <th>Class Type</th>
              <th>Day</th>
              <th>Time Block</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.id}>
                <td>{schedule.teacherName}</td>
                <td>{getSubjectName(schedule.subjectId)}</td>
                <td>{getCourseName(schedule.courseId)}</td>
                <td>{getSectionName(schedule.sectionId)}</td>
                <td>{schedule.room}</td>
                <td>{schedule.classType || "N/A"}</td>
                <td>{schedule.day}</td>
                <td>{schedule.timeBlockLabel || `${schedule.startTime}-${schedule.endTime}`}</td>
                <td>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}