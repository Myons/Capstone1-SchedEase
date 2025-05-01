import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import "./Faculty.css";

export default function Faculty() {
  // Faculty state
  const [facultyList, setFacultyList] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Full-time");
  const [isTeacher, setIsTeacher] = useState(false);
  
  // Teacher-specific state
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  
  // View mode
  const [activeTab, setActiveTab] = useState("faculty"); // "faculty" or "teachers"
  const [teachersList, setTeachersList] = useState([]);
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Popup state
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetchFaculty();
    fetchTeachers();
    fetchSubjects();
    fetchCourses();
    fetchSections();
  }, []);

  const fetchFaculty = async () => {
    const facultySnapshot = await getDocs(collection(db, "faculty"));
    const facultyData = facultySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setFacultyList(facultyData);
  };

  const fetchTeachers = async () => {
    const teachersSnapshot = await getDocs(collection(db, "teachers"));
    const teachersData = teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTeachersList(teachersData);
  };

  const fetchSubjects = async () => {
    const subjectsSnapshot = await getDocs(collection(db, "subjects"));
    const subjectsData = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSubjects(subjectsData);
  };

  const fetchCourses = async () => {
    const coursesSnapshot = await getDocs(collection(db, "courses"));
    const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCourses(coursesData);
  };

  const fetchSections = async () => {
    const sectionsSnapshot = await getDocs(collection(db, "sections"));
    const sectionsData = sectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSections(sectionsData);
  };

  const handleAddFaculty = async () => {
    if (!name) {
      alert("Please enter a name");
      return;
    }
    
    // Generate faculty ID
    const newFacultyId = `FAC-${String(facultyList.length + 1).padStart(3, "0")}`;
    
    // Generate default email if not provided
    const defaultEmail = `${name.toLowerCase().replace(/\s+/g, '.')}@school.edu`;

    try {
      // First, add to faculty collection
      const facultyDocRef = await addDoc(collection(db, "faculty"), {
        facultyId: newFacultyId,
        name,
        email: defaultEmail,
        status,
        isTeacher,
        createdAt: new Date(),
        currentLoad: "0/21 hrs"
      });

      // If it's a teacher, also add to teachers collection
      if (isTeacher) {
        if (!selectedSubject) {
          alert("Please select a subject for the teacher");
          return;
        }

        const teacherId = `TCH-${String(teachersList.length + 1).padStart(3, "0")}`;
        
        await addDoc(collection(db, "teachers"), {
          teacherId: teacherId,
          name,
          email: defaultEmail,
          facultyId: facultyDocRef.id,
          subjectId: selectedSubject,
          courseId: selectedCourse || null,
          sectionId: selectedSection || null,
          status,
          currentLoad: "0/21 hrs"
        });
      }

      resetForm();
      fetchFaculty();
      fetchTeachers();
      setShowPopup(false);
      
      alert(`${name} has been added successfully ${isTeacher ? 'as a teacher' : ''}`);
    } catch (error) {
      console.error("Error adding faculty:", error);
      alert("Failed to add faculty member. Please try again.");
    }
  };

  const handleDeleteFaculty = async (facultyId) => {
    if (confirm("Are you sure you want to delete this faculty member?")) {
      try {
        await deleteDoc(doc(db, "faculty", facultyId));
        
        // Also check if there's a teacher record to delete
        const teacherQuery = query(collection(db, "teachers"), where("facultyId", "==", facultyId));
        const teacherSnapshot = await getDocs(teacherQuery);
        
        if (!teacherSnapshot.empty) {
          teacherSnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
          });
        }
        
        fetchFaculty();
        fetchTeachers();
      } catch (error) {
        console.error("Error deleting faculty:", error);
        alert("Failed to delete faculty member. Please try again.");
      }
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (confirm("Are you sure you want to delete this teacher?")) {
      try {
        await deleteDoc(doc(db, "teachers", teacherId));
        fetchTeachers();
      } catch (error) {
        console.error("Error deleting teacher:", error);
        alert("Failed to delete teacher. Please try again.");
      }
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setStatus("Full-time");
    setIsTeacher(false);
    setSelectedSubject("");
    setSelectedCourse("");
    setSelectedSection("");
    setIsEditing(false);
    setEditId(null);
  };

  const getSubjectName = (id) => {
    const subject = subjects.find(subject => subject.id === id);
    return subject ? subject.name : "Not Assigned";
  };

  const getCourseName = (id) => {
    const course = courses.find(course => course.id === id);
    return course ? course.name : "Not Assigned";
  };

  const getSectionName = (id) => {
    const section = sections.find(section => section.id === id);
    return section ? section.name : "Not Assigned";
  };

  const filterSectionsByCourse = (courseId) => {
    if (!courseId) return [];
    return sections.filter(section => section.courseId === courseId);
  };

  const openPopupForEdit = (faculty) => {
    setIsEditing(true);
    setEditId(faculty.id);
    setName(faculty.name);
    setStatus(faculty.status);
    setIsTeacher(faculty.isTeacher || false);
    
    // Find associated teacher record if exists
    const teacherRecord = teachersList.find(t => t.facultyId === faculty.id);
    if (teacherRecord) {
      setSelectedSubject(teacherRecord.subjectId || "");
      setSelectedCourse(teacherRecord.courseId || "");
      setSelectedSection(teacherRecord.sectionId || "");
    }
    
    setShowPopup(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Faculty Management</h1>

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 ${activeTab === 'faculty' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('faculty')}
        >
          Faculty List
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'teachers' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('teachers')}
        >
          Teachers
        </button>
      </div>

      {/* Add Schedule Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            resetForm();
            setIsEditing(false);
            setShowPopup(true);
          }}
          className="bg-blue-900 text-white py-2 px-6 rounded hover:bg-blue-800"
        >
          Add Schedule
        </button>
      </div>

      {/* Faculty Popup */}
      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-container">
            {/* Popup Header */}
            <div className="modal-header">
              <h3 className="modal-title">
                {isEditing ? "Edit Faculty Member" : "Add New Faculty Member"}
              </h3>
            </div>
            
            {/* Popup Body */}
            <div className="modal-body">
              {/* Full Name */}
              <div className="popup-form-group">
                <label className="popup-form-label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="popup-form-control"
                  placeholder="John Doe"
                />
              </div>
              
              {/* Status */}
              <div className="popup-form-group">
                <label className="popup-form-label">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="popup-form-control"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Visiting</option>
                </select>
              </div>
              
              {/* Register as Teacher */}
              <div className="popup-checkbox">
                <input
                  id="isTeacher"
                  type="checkbox"
                  checked={isTeacher}
                  onChange={(e) => setIsTeacher(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="isTeacher" className="ml-2 block text-sm text-gray-700">
                  Register as Teacher
                </label>
              </div>
              
              {/* Teacher-specific fields */}
              {isTeacher && (
                <div className="popup-form-section">
                  <h3 className="popup-form-section-title">Teacher Assignment</h3>
                  <div className="popup-form-grid">
                    <div>
                      <label className="popup-form-label">Subject</label>
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="popup-form-control"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="popup-form-label">Grade/Course</label>
                      <select
                        value={selectedCourse}
                        onChange={(e) => {
                          setSelectedCourse(e.target.value);
                          setSelectedSection("");
                        }}
                        className="popup-form-control"
                      >
                        <option value="">Not Assigned</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="popup-form-label">Section</label>
                      <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="popup-form-control"
                        disabled={!selectedCourse}
                      >
                        <option value="">Not Assigned</option>
                        {filterSectionsByCourse(selectedCourse).map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Popup Footer */}
            <div className="modal-footer">
              <button
                onClick={() => setShowPopup(false)}
                className="modal-btn modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFaculty}
                className="modal-btn modal-btn-primary"
              >
                {isEditing ? "Update Faculty" : "Add Faculty"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Table */}
      {activeTab === 'faculty' && (
        <div className="overflow-x-auto bg-white rounded shadow-md">
          <h2 className="text-xl font-semibold p-4 border-b">Faculty List</h2>
          <table className="w-full table-auto">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">ID</th>
                <th className="p-2">Email</th>
                <th className="p-2">Status</th>
                <th className="p-2">Teacher</th>
                <th className="p-2">Current Load</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {facultyList.map((faculty) => (
                <tr key={faculty.id} className="text-center border-b hover:bg-gray-100">
                  <td className="p-2">{faculty.name}</td>
                  <td className="p-2">{faculty.facultyId}</td>
                  <td className="p-2">{faculty.email}</td>
                  <td className="p-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        faculty.status === "Full-time"
                          ? "bg-green-200 text-green-800"
                          : faculty.status === "Part-time"
                          ? "bg-yellow-200 text-yellow-800"
                          : "bg-gray-300 text-gray-800"
                      }`}
                    >
                      {faculty.status}
                    </span>
                  </td>
                  <td className="p-2">
                    {faculty.isTeacher ? (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-200 text-blue-800">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-800">
                        No
                      </span>
                    )}
                  </td>
                  <td className="p-2">{faculty.currentLoad || "0/21 hrs"}</td>
                  <td className="p-2">
                    <button 
                      className="text-blue-600 hover:underline mr-2"
                      onClick={() => openPopupForEdit(faculty)}
                    >
                      Edit
                    </button> 
                    <button
                      onClick={() => handleDeleteFaculty(faculty.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Teachers Table */}
      {activeTab === 'teachers' && (
        <div className="overflow-x-auto bg-white rounded shadow-md">
          <h2 className="text-xl font-semibold p-4 border-b">Teachers List</h2>
          <table className="w-full table-auto">
            <thead className="bg-green-900 text-white">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">ID</th>
                <th className="p-2">Subject</th>
                <th className="p-2">Grade/Course</th>
                <th className="p-2">Section</th>
                <th className="p-2">Status</th>
                <th className="p-2">Load</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachersList.map((teacher) => (
                <tr key={teacher.id} className="text-center border-b hover:bg-gray-100">
                  <td className="p-2">{teacher.name}</td>
                  <td className="p-2">{teacher.teacherId}</td>
                  <td className="p-2">{getSubjectName(teacher.subjectId)}</td>
                  <td className="p-2">{teacher.courseId ? getCourseName(teacher.courseId) : "Not Assigned"}</td>
                  <td className="p-2">{teacher.sectionId ? getSectionName(teacher.sectionId) : "Not Assigned"}</td>
                  <td className="p-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        teacher.status === "Full-time"
                          ? "bg-green-200 text-green-800"
                          : teacher.status === "Part-time"
                          ? "bg-yellow-200 text-yellow-800"
                          : "bg-gray-300 text-gray-800"
                      }`}
                    >
                      {teacher.status}
                    </span>
                  </td>
                  <td className="p-2">{teacher.currentLoad || "0/21 hrs"}</td>
                  <td className="p-2">
                    <button 
                      className="text-blue-600 hover:underline mr-2"
                      onClick={() => {
                        // Find the corresponding faculty record
                        const facultyRecord = facultyList.find(f => f.id === teacher.facultyId);
                        if (facultyRecord) {
                          openPopupForEdit(facultyRecord);
                        }
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTeacher(teacher.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}