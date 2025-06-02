import { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import { collection, getDocs, addDoc, onSnapshot, deleteDoc, doc, getDoc } from "firebase/firestore";
import { canModifyData } from "../utils/auth";
import "./Schedule.css";

export default function Schedule() {
  const [schedules, setSchedules] = useState([]);
  const [userRole, setUserRole] = useState(null);
  
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
  const [availableTeachers, setAvailableTeachers] = useState([]);
  
  // Modal states - use Boolean values
  const [showSelectionForm, setShowSelectionForm] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  
  const [conflictDetails, setConflictDetails] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSolution, setSelectedSolution] = useState(null);

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
    // Get user role
    const getUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "faculty", user.uid));
        setUserRole(userDoc.data()?.role);
      }
    };
    getUserRole();

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

  // Update available teachers when course changes
  useEffect(() => {
    if (selectedCourse) {
      const filteredTeachers = teachers.filter(teacher => 
        teacher.courseId === selectedCourse || 
        (teacher.assignedCourses && teacher.assignedCourses.includes(selectedCourse))
      );
      setAvailableTeachers(filteredTeachers);
      
      // Clear selected teacher if not available for this course
      if (selectedTeacher && !filteredTeachers.find(t => t.id === selectedTeacher)) {
        setSelectedTeacher("");
      }
    } else {
      setAvailableTeachers([]);
      setSelectedTeacher("");
    }
  }, [selectedCourse, teachers, selectedTeacher]);

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

      {/* Add Schedule Button - Only show for admins */}
      {canModifyData(userRole) && (
        <div className="mb-6">
          <button 
            onClick={() => setShowSelectionForm(true)} 
            className="add-button"
          >
            Add Schedule
          </button>
        </div>
      )}

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
                    {availableTeachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} - {getTeacherSubject(teacher.id)}
                      </option>
                    ))}
                  </select>
                  {selectedCourse && availableTeachers.length === 0 && (
                    <p className="helper-text">No teachers available for this course/grade level</p>
                  )}
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
          <div className="conflict-modal">
            <div className="conflict-modal-header">
              <h2>Resolve Conflict: Room Double-Booking</h2>
              <button 
                onClick={() => setShowConflictModal(false)} 
                className="close-button"
              >
                ×
              </button>
            </div>
            
            <div className="conflict-modal-content">
              <div className="conflict-details">
                <p className="conflict-id">Conflict ID: CON-{String(conflictDetails[0]?.id || '001').padStart(3, '0')}</p>
                <p>Room {getRoomName(room)} is double-booked for the following classes:</p>
                
                <table className="conflict-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Faculty</th>
                      <th>Schedule</th>
                      <th>Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conflictDetails.map((conflict, index) => (
                      <tr key={index}>
                        <td>{getCourseName(conflict.courseId)} - {getSectionName(conflict.sectionId)}</td>
                        <td>{conflict.teacherName}</td>
                        <td>{`${conflict.day}, ${conflict.timeBlockLabel}`}</td>
                        <td>{sections.find(s => s.id === conflict.sectionId)?.studentCount || 'N/A'}</td>
                      </tr>
                    ))}
                    <tr>
                      <td>{getCourseName(selectedCourse)} - {getSectionName(selectedSection)}</td>
                      <td>{getTeacherName(selectedTeacher)}</td>
                      <td>{`${day}, ${timeBlocks.find(b => b.id === timeBlock)?.label}`}</td>
                      <td>{sections.find(s => s.id === selectedSection)?.studentCount || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="solutions-section">
                <h3>Recommended Solutions:</h3>
                
                {/* Available Rooms */}
                {rooms
                  .filter(r => r.type === classType && !conflictDetails.some(c => c.room === r.id))
                  .map((availableRoom, index) => (
                    <div 
                      key={`room-${index}`}
                      className={`solution-option ${selectedSolution?.type === 'room' && selectedSolution.value === availableRoom.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSolution({ type: 'room', value: availableRoom.id })}
                    >
                      <div className="solution-radio">
                        <div className="radio-inner"></div>
                      </div>
                      <div className="solution-content">
                        <p>Move to Room {availableRoom.name}</p>
                        <span className="solution-detail">Room is available during this time slot and has adequate capacity</span>
                      </div>
                    </div>
                  ))}

                {/* Available Time Slots */}
                {suggestions.map((slot, index) => (
                  <div 
                    key={`time-${index}`}
                    className={`solution-option ${selectedSolution?.type === 'time' && selectedSolution.value === slot.id ? 'selected' : ''}`}
                    onClick={() => setSelectedSolution({ type: 'time', value: slot.id })}
                  >
                    <div className="solution-radio">
                      <div className="radio-inner"></div>
                    </div>
                    <div className="solution-content">
                      <p>Reschedule to {slot.label}</p>
                      <span className="solution-detail">This time slot is available for all parties</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="conflict-actions">
                <button 
                  className="apply-button"
                  onClick={async () => {
                    if (selectedSolution) {
                      if (selectedSolution.type === 'room') {
                        setRoom(selectedSolution.value);
                      } else if (selectedSolution.type === 'time') {
                        setTimeBlock(selectedSolution.value);
                      }
                      setShowConflictModal(false);
                      await handleAddSchedule();
                    }
                  }}
                  disabled={!selectedSolution}
                >
                  Apply Solution
                </button>
                <button 
                  className="cancel-button"
                  onClick={() => setShowConflictModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="ignore-button"
                  onClick={async () => {
                    setShowConflictModal(false);
                    await handleAddSchedule();
                  }}
                >
                  Ignore Conflict
                </button>
              </div>
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
              {canModifyData(userRole) && <th>Actions</th>}
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
                {canModifyData(userRole) && (
                  <td>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}