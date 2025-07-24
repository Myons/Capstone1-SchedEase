import { useEffect, useState } from "react";
import api from "../api/axios";
import { auth } from "../firebase/firebase";
import { 
  Users, UserPlus, Trash2, Edit, ChevronDown, X, Search, Award, BookOpen, 
  Briefcase, Filter, Download, AlertTriangle, GraduationCap, Building2,
  TrendingUp, TrendingDown, Clock, UserCheck
} from "lucide-react";
import "./Faculty.css";

export default function Faculty() {
  // State management
  const [userRole, setUserRole] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    schoolId: "",
    status: "Full-time",
    isTeacher: false,
    selectedSubject: "",
    selectedCourse: "",
    selectedSection: "",
    role: "teacher"
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState("faculty");
  const [showPopup, setShowPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);
  const [createdSchoolId, setCreatedSchoolId] = useState("");
  const [createdPassword, setCreatedPassword] = useState("");

  // Stats calculations
  const stats = {
    totalFaculty: facultyList.length,
    activeTeachers: teachersList.length,
    fullTime: facultyList.filter(f => f.status === "Full-time").length,
    partTime: facultyList.filter(f => f.status === "Part-time").length
  };

  const validateSchoolId = (id) => {
    const pattern = /^\d{2}-\d{4}-\d{3}$/;
    return pattern.test(id);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await api.get(`/faculty/${user.uid}`);
        setUserRole(userDoc.data?.role);
      }

      const [facultyRes, teachersRes, subjectsRes, coursesRes, sectionsRes] = await Promise.all([
        api.get("/faculty/with-teaching-info"),
        api.get("/teachers"),
        api.get("/subjects"),
        api.get("/courses"),
        api.get("/sections")
      ]);

      setFacultyList(facultyRes.data);
      setTeachersList(teachersRes.data);
      setSubjects(subjectsRes.data);
      setCourses(coursesRes.data);
      setSections(sectionsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : "Not Assigned";
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      schoolId: "",
      status: "Full-time",
      isTeacher: false,
      selectedSubject: "",
      selectedCourse: "",
      selectedSection: "",
      role: "teacher"
    });
    setIsEditing(false);
    setEditId(null);
    setFormError("");
  };

  const generateSecurePassword = () => {
    const length = 12;
    const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijkmnpqrstuvwxyz';
    const numberChars = '23456789';
    const specialChars = '@#$%^&*';
    
    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
    
    let password = 
      uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)] +
      lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)] +
      numberChars[Math.floor(Math.random() * numberChars.length)] +
      specialChars[Math.floor(Math.random() * specialChars.length)];
    
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setFormError("Please enter a name");
      return;
    }

    if (!formData.schoolId.trim()) {
      setFormError("Please enter a school ID");
      return;
    }

    if (!validateSchoolId(formData.schoolId)) {
      setFormError("School ID must follow the pattern: 22-2222-222");
      return;
    }

    if (formData.role === "teacher" && !formData.selectedSubject) {
      setFormError("Please select a subject for the teacher");
      return;
    }

    if (formData.role === "teacher" && !formData.selectedCourse) {
      setFormError("Please select a course/grade level for the teacher");
      return;
    }

    const initialPassword = generateSecurePassword();
    const facultyData = {
      name: formData.name.trim(),
      schoolId: formData.schoolId.trim(),
      status: formData.status,
      role: formData.role,
      tempPassword: initialPassword,
      subjectId: formData.selectedSubject,
      courseId: formData.selectedCourse,
      sectionId: formData.selectedSection || null,
    };

    try {
      if (isEditing) {
        await api.put(`/faculty/${editId}`, facultyData);
      } else {
        await api.post("/faculty", facultyData);
        setCreatedSchoolId(formData.schoolId);
        setCreatedPassword(initialPassword);
        setShowCredentials(true);
      }
      
      resetForm();
      setShowPopup(false);
      fetchData();

    } catch (error) {
      console.error("Error saving faculty:", error);
      setFormError(error.response?.data?.message || "Failed to save faculty member.");
    }
  };

  const handleEdit = (item) => {
    const faculty = item.facultyProfile || item;
    const teacher = teachersList.find(t => t.facultyId === faculty.id);
    
    setIsEditing(true);
    setEditId(faculty.id);
    
    setFormData({
      name: faculty.name,
      schoolId: faculty.schoolId,
      status: faculty.status,
      role: faculty.role,
      isTeacher: faculty.role === "teacher",
      selectedSubject: teacher?.subjectId || "",
      selectedCourse: teacher?.courseId || "",
      selectedSection: teacher?.sectionId || "",
    });
    
    setShowPopup(true);
  };

  const handleDelete = (id) => {
    setPendingDelete(id);
    setShowConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    
    try {
      await api.delete(`/faculty/${pendingDelete}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting faculty:", error);
      alert("Failed to delete faculty member. Please try again.");
    } finally {
      setShowConfirmation(false);
      setPendingDelete(null);
    }
  };

  const hasAdminPrivileges = () => userRole === "admin";

  const filteredFaculty = facultyList.filter(item => {
    const faculty = item.facultyProfile || item;
    const matchesSearch = faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          faculty.schoolId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || faculty.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="faculty-container">Loading...</div>;
  }

  return (
    <div className="faculty-container">
      <div className="faculty-content">
        <div className="faculty-header">
          <div className="header-top">
            <div className="header-title">
              <h1><Users size={32} /> Faculty Management</h1>
              <p>Manage faculty members and their teaching assignments</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-secondary"><Download size={20} /> Export Data</button>
              {hasAdminPrivileges() && (
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowPopup(true); }}>
                  <UserPlus size={20} /> Add New Faculty
                </button>
              )}
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon"><Users size={20} /></div>
                <div>
                  <p className="stat-title">Total Faculty</p>
                  <h3 className="stat-value">{stats.totalFaculty}</h3>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon"><GraduationCap size={20} /></div>
                <div>
                  <p className="stat-title">Active Teachers</p>
                  <h3 className="stat-value">{stats.activeTeachers}</h3>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon"><UserCheck size={20} /></div>
                <div>
                  <p className="stat-title">Full-time Staff</p>
                  <h3 className="stat-value">{stats.fullTime}</h3>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon"><Clock size={20} /></div>
                <div>
                  <p className="stat-title">Part-time Staff</p>
                  <h3 className="stat-value">{stats.partTime}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="faculty-tabs">
          <button className={`tab-button ${activeTab === "faculty" ? "active" : ""}`} onClick={() => setActiveTab("faculty")}>
            <Users size={20} /> All Faculty
          </button>
          <button className={`tab-button ${activeTab === "teachers" ? "active" : ""}`} onClick={() => setActiveTab("teachers")}>
            <GraduationCap size={20} /> Teachers
          </button>
        </div>

        <div className="search-filters">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={20} /> Filters
          </button>
        </div>

        <div className="faculty-main">
          <table className="faculty-table">
            <thead>
              <tr>
                <th>Faculty Member</th>
                <th>Status</th>
                <th>Role</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.map(item => {
                const faculty = item.facultyProfile || item;
                const teacher = teachersList.find(t => t.facultyId === faculty.id);
                return (
                  <tr key={faculty.id}>
                    <td>
                      <div className="faculty-card">
                        <div className="faculty-avatar">{faculty.name.charAt(0).toUpperCase()}</div>
                        <div className="faculty-info">
                          <span className="faculty-name">{faculty.name}</span>
                          <span className="faculty-email">{faculty.schoolId}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className={`status-badge status-${faculty.status.toLowerCase()}`}>{faculty.status}</span></td>
                    <td>
                      <div className="faculty-role">
                        {faculty.role === "teacher" ? <GraduationCap size={16} /> : <Briefcase size={16} />}
                        {faculty.role === "teacher" ? " Teaching Faculty" : " Administrative"}
                      </div>
                    </td>
                    <td>{faculty.role === "teacher" && teacher ? getSubjectName(teacher.subjectId) : "N/A"}</td>
                    <td>
                      <div className="action-buttons">
                        {hasAdminPrivileges() ? (
                          <>
                            <button className="btn btn-secondary" onClick={() => handleEdit(item)}><Edit size={16} /> Edit</button>
                            <button className="btn btn-danger" onClick={() => handleDelete(faculty.id)}><Trash2 size={16} /> Delete</button>
                          </>
                        ) : (<span className="text-muted">View Only</span>)}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {showPopup && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">{isEditing ? "Edit Faculty Member" : "Add New Faculty Member"}</h3>
                <button className="btn btn-secondary" onClick={() => { setShowPopup(false); resetForm(); }}><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-section">
                    <h4 className="section-title"><Users size={20} /> Basic Information</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input type="text" className="form-input" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter full name" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">School ID</label>
                        <input type="text" className="form-input" name="schoolId" value={formData.schoolId} onChange={handleInputChange} placeholder="Format: 22-2222-222" pattern="\d{2}-\d{4}-\d{3}" title="Please use the format: 22-2222-222" required />
                        <small>Format: 22-2222-222</small>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Employment Status</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Visiting">Visiting</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select className="form-select" name="role" value={formData.role} onChange={handleInputChange}>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>
                  {formData.role === "teacher" && (
                    <div className="form-section">
                      <h4 className="section-title"><BookOpen size={20} /> Teaching Assignment</h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Subject Area</label>
                          <select className="form-select" name="selectedSubject" value={formData.selectedSubject} onChange={handleInputChange} required>
                            <option value="">Select a subject</option>
                            {subjects.map(subject => (<option key={subject.id} value={subject.id}>{subject.name}</option>))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Course/Grade Level</label>
                          <select className="form-select" name="selectedCourse" value={formData.selectedCourse} onChange={handleInputChange} required>
                            <option value="">Select a course</option>
                            {courses.map(course => (<option key={course.id} value={course.id}>{course.name}</option>))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                  {formError && <div className="form-error">{formError}</div>}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowPopup(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{isEditing ? "Save Changes" : "Add Faculty"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showConfirmation && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Confirm Deletion</h3>
                <button className="btn btn-secondary" onClick={() => setShowConfirmation(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="confirmation-message">
                  <AlertTriangle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete this faculty member? This action cannot be undone.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirmation(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {showCredentials && (
          <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: 400 }}>
              <div className="modal-header">
                <h3 className="modal-title">Account Created</h3>
                <button className="close-button" onClick={() => setShowCredentials(false)}>×</button>
              </div>
              <div className="modal-content">
                <p>Give these credentials to the new user. They will be required to change their password on first login.</p>
                <div style={{ margin: '1rem 0' }}>
                  <strong>School ID:</strong> {createdSchoolId}<br />
                  <strong>Temporary Password:</strong> {createdPassword}
                </div>
                <button className="btn btn-primary" onClick={() => setShowCredentials(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}