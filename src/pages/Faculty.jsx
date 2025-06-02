import { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { 
  Users, UserPlus, Trash2, Edit, ChevronDown, X, Search, Award, BookOpen, 
  Briefcase, Filter, Download, AlertTriangle, GraduationCap, Building2,
  TrendingUp, TrendingDown, Clock, UserCheck
} from "lucide-react";
import "./Faculty.css";

// Initialize a separate Firebase Auth instance for user creation
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

// Password generation utility
const generateSecurePassword = () => {
  const length = 12;
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';  // Excluding I and O
  const lowercaseChars = 'abcdefghijkmnpqrstuvwxyz';  // Excluding l and o
  const numberChars = '23456789';  // Excluding 0 and 1
  const specialChars = '@#$%^&*';
  
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  
  // Ensure at least one of each type
  let password = 
    uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)] +
    lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)] +
    numberChars[Math.floor(Math.random() * numberChars.length)] +
    specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

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

  // Stats calculations
  const stats = {
    totalFaculty: facultyList.length,
    activeTeachers: teachersList.length,
    fullTime: facultyList.filter(f => f.status === "Full-time").length,
    partTime: facultyList.filter(f => f.status === "Part-time").length
  };

  // Add this function at the top level of the component, after the stats calculation
  const validateSchoolId = (id) => {
    const pattern = /^\d{2}-\d{4}-\d{3}$/;
    return pattern.test(id);
  };

  useEffect(() => {
    fetchData();
    // Add user role check
    const checkUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "faculty", user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
    };
    checkUserRole();
  }, []);

  // Data fetching functions
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [facultyData, teachersData, subjectsData, coursesData, sectionsData] = await Promise.all([
        getDocs(collection(db, "faculty")),
        getDocs(collection(db, "teachers")),
        getDocs(collection(db, "subjects")),
        getDocs(collection(db, "courses")),
        getDocs(collection(db, "sections"))
      ]);

      setFacultyList(facultyData.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTeachersList(teachersData.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSubjects(subjectsData.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setCourses(coursesData.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSections(sectionsData.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const facultySnapshot = await getDocs(collection(db, "faculty"));
      setFacultyList(facultySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching faculty:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const teachersSnapshot = await getDocs(collection(db, "teachers"));
      setTeachersList(teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert("Please enter a name");
      return;
    }

    if (!formData.schoolId.trim()) {
      alert("Please enter a school ID");
      return;
    }

    // Validate school ID format
    if (!validateSchoolId(formData.schoolId)) {
      alert("School ID must follow the pattern: 22-2222-222");
      return;
    }

    try {
      console.log("[DEBUG] Starting account creation process");
      
      // Generate IDs
      const newFacultyId = `FAC-${String(facultyList.length + 1).padStart(3, "0")}`;
      
      // Create user account in Firebase Auth using secondary instance
      let userCredential = null;
      
      // Generate a secure random password
      const initialPassword = generateSecurePassword();
      
      try {
        console.log("[DEBUG] Creating user account with secondary auth instance");
        // Create user account using secondary auth instance with a generated email
        const generatedEmail = `${formData.schoolId}@school.edu`; // Create email from school ID
        userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          generatedEmail,
          initialPassword
        );
        console.log("[DEBUG] User created with secondary auth. User:", userCredential.user.uid);
        console.log("[DEBUG] Checking main auth state:", auth.currentUser?.uid);
      } catch (authError) {
        console.error("Error creating user account:", authError);
        alert("Failed to create user account. School ID might already be in use.");
        return;
      }

      // Prepare faculty data
      const facultyData = {
        facultyId: newFacultyId,
        name: formData.name.trim(),
        schoolId: formData.schoolId.trim(),
        email: `${formData.schoolId}@school.edu`,
        status: formData.status,
        isTeacher: formData.role === "teacher",
        createdAt: new Date(),
        currentLoad: "0/21 hrs",
        uid: userCredential.user.uid,
        role: formData.role,
        firstLogin: true,
        passwordChanged: false
      };

      console.log("[DEBUG] About to save faculty data:", { 
        firstLogin: facultyData.firstLogin, 
        passwordChanged: facultyData.passwordChanged 
      });

      // Add to faculty collection using the user's UID as the document ID
      await setDoc(doc(db, "faculty", userCredential.user.uid), facultyData);
      console.log("[DEBUG] Faculty data saved to Firestore");

      // Verify the saved data
      const savedDoc = await getDoc(doc(db, "faculty", userCredential.user.uid));
      console.log("[DEBUG] Saved faculty data firstLogin value:", savedDoc.data()?.firstLogin);

      // Add to teachers collection if applicable
      if (formData.role === "teacher") {
        if (!formData.selectedSubject) {
          alert("Please select a subject for the teacher");
          // Rollback faculty creation
          await deleteDoc(doc(db, "faculty", userCredential.user.uid));
          return;
        }

        if (!formData.selectedCourse) {
          alert("Please select a course/grade level for the teacher");
          // Rollback faculty creation
          await deleteDoc(doc(db, "faculty", userCredential.user.uid));
          return;
        }

        const teacherId = `TCH-${String(teachersList.length + 1).padStart(3, "0")}`;
        const teacherData = {
          teacherId,
          name: formData.name.trim(),
          email: `${formData.schoolId}@school.edu`, // Use generated email
          facultyId: userCredential.user.uid,
          subjectId: formData.selectedSubject,
          courseId: formData.selectedCourse,
          sectionId: formData.selectedSection || null,
          status: formData.status,
          currentLoad: "0/21 hrs",
          uid: userCredential.user.uid,
          role: "teacher",
          assignedCourses: [formData.selectedCourse]
        };

        await addDoc(collection(db, "teachers"), teacherData);
        console.log("Teacher record added successfully");
      }

      // Sign out the user from the secondary auth instance
      console.log("[DEBUG] Before secondary auth signout. Secondary auth user:", secondaryAuth.currentUser?.uid);
      console.log("[DEBUG] Main auth state before secondary signout:", auth.currentUser?.uid);
      
      await secondaryAuth.signOut();
      
      console.log("[DEBUG] After secondary auth signout. Secondary auth user:", secondaryAuth.currentUser?.uid);
      console.log("[DEBUG] Main auth state after secondary signout:", auth.currentUser?.uid);

      // Show credentials to admin
      alert(`Account created successfully!\n\nSchool ID: ${formData.schoolId}\nTemporary Password: ${initialPassword}\n\nPlease provide these credentials to the user. They will be required to change their password on first login.`);

      // Reset form and refresh data
      resetForm();
      await fetchData();
      setShowPopup(false);
      setActiveTab("faculty");
      
    } catch (error) {
      console.error("Error adding faculty:", error);
      alert(`Failed to add faculty member: ${error.message}`);
      
      // Make sure to sign out of secondary auth instance if something went wrong
      try {
        console.log("[DEBUG] Attempting to sign out of secondary auth after error");
        await secondaryAuth.signOut();
        console.log("[DEBUG] Successfully signed out of secondary auth after error");
      } catch (signOutError) {
        console.error("Error signing out of secondary auth:", signOutError);
      }
    }
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setEditId(item.id);
    
    // Populate form data
    setFormData({
      name: item.name,
      schoolId: item.schoolId,
      status: item.status,
      isTeacher: item.role === "teacher",
      selectedSubject: item.subjectId || "",
      selectedCourse: item.courseId || "",
      selectedSection: item.sectionId || "",
      role: item.role
    });
    
    setShowPopup(true);
  };

  // Helper functions
  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : "Not Assigned";
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
  };

  const handleDelete = async (id, type) => {
    setPendingDelete({ id, type });
    setShowConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    
    try {
      if (pendingDelete.type === "faculty") {
        // Delete from faculty collection
        await deleteDoc(doc(db, "faculty", pendingDelete.id));
        
        // Delete associated teacher record if exists
        const teacherQuery = query(collection(db, "teachers"), where("facultyId", "==", pendingDelete.id));
        const teacherDocs = await getDocs(teacherQuery);
        teacherDocs.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      } else {
        // Delete teacher record
        await deleteDoc(doc(db, "teachers", pendingDelete.id));
      }

      // Refresh the lists
      await Promise.all([fetchFaculty(), fetchTeachers()]);
      
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete. Please try again.");
    } finally {
      setShowConfirmation(false);
      setPendingDelete(null);
    }
  };

  // Add helper function to check admin privileges
  const hasAdminPrivileges = () => userRole === "admin";

  if (isLoading) {
    return <div className="faculty-container">Loading...</div>;
  }

  return (
    <div className="faculty-container">
      <div className="faculty-content">
        {/* Header Section */}
        <div className="faculty-header">
          <div className="header-top">
            <div className="header-title">
              <h1>
                <Users size={32} />
                Faculty Management
              </h1>
              <p>Manage faculty members and their teaching assignments</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-secondary">
                <Download size={20} />
                Export Data
              </button>
              <button className="btn btn-primary" onClick={() => setShowPopup(true)}>
                <UserPlus size={20} />
                Add New Faculty
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon">
                  <Users size={20} />
                </div>
                <div>
                  <p className="stat-title">Total Faculty</p>
                  <h3 className="stat-value">{stats.totalFaculty}</h3>
                  <div className="stat-trend trend-up">
                    <TrendingUp size={16} />
                    <span>12% increase</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <p className="stat-title">Active Teachers</p>
                  <h3 className="stat-value">{stats.activeTeachers}</h3>
                  <div className="stat-trend trend-up">
                    <TrendingUp size={16} />
                    <span>8% increase</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon">
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="stat-title">Full-time Staff</p>
                  <h3 className="stat-value">{stats.fullTime}</h3>
                  <div className="stat-trend trend-up">
                    <TrendingUp size={16} />
                    <span>5% increase</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="stat-title">Part-time Staff</p>
                  <h3 className="stat-value">{stats.partTime}</h3>
                  <div className="stat-trend trend-down">
                    <TrendingDown size={16} />
                    <span>3% decrease</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="faculty-tabs">
          <button 
            className={`tab-button ${activeTab === "faculty" ? "active" : ""}`}
            onClick={() => setActiveTab("faculty")}
          >
            <Users size={20} />
            All Faculty
          </button>
          <button 
            className={`tab-button ${activeTab === "teachers" ? "active" : ""}`}
            onClick={() => setActiveTab("teachers")}
          >
            <GraduationCap size={20} />
            Teachers
          </button>
          <button 
            className={`tab-button ${activeTab === "departments" ? "active" : ""}`}
            onClick={() => setActiveTab("departments")}
          >
            <Building2 size={20} />
            Departments
          </button>
        </div>

        {/* Search and Filters */}
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
            <Filter size={20} />
            Filters
          </button>
        </div>

        {/* Main Content */}
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
              {facultyList
                .filter(faculty => {
                  const matchesSearch = faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    faculty.schoolId.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesStatus = statusFilter === "All" || faculty.status === statusFilter;
                  return matchesSearch && matchesStatus;
                })
                .map(faculty => (
                  <tr key={faculty.id}>
                    <td>
                      <div className="faculty-card">
                        <div className="faculty-avatar">
                          {faculty.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="faculty-info">
                          <span className="faculty-name">{faculty.name}</span>
                          <span className="faculty-email">{faculty.schoolId}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${faculty.status.toLowerCase()}`}>
                        {faculty.status}
                      </span>
                    </td>
                    <td>
                      {faculty.role === "teacher" ? (
                        <div className="faculty-role">
                          <GraduationCap size={16} />
                          Teaching Faculty
                        </div>
                      ) : (
                        <div className="faculty-role">
                          <Briefcase size={16} />
                          Administrative
                        </div>
                      )}
                    </td>
                    <td>
                      {faculty.role === "teacher" ? getSubjectName(teachersList.find(t => t.facultyId === faculty.id)?.subjectId) : "N/A"}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {hasAdminPrivileges() ? (
                          <>
                            <button 
                              className="btn btn-secondary"
                              onClick={() => handleEdit(faculty)}
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            <button 
                              className="btn btn-danger"
                              onClick={() => handleDelete(faculty.id, "faculty")}
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className="text-muted">View Only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Modal */}
        {showPopup && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">
                  {isEditing ? "Edit Faculty Member" : "Add New Faculty Member"}
                </h3>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPopup(false);
                    resetForm();
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-section">
                    <h4 className="section-title">
                      <Users size={20} />
                      Basic Information
                    </h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                          type="text"
                          className="form-input"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter full name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">School ID</label>
                        <input
                          type="text"
                          className="form-input"
                          name="schoolId"
                          value={formData.schoolId}
                          onChange={handleInputChange}
                          placeholder="Format: 22-2222-222"
                          pattern="\d{2}-\d{4}-\d{3}"
                          title="Please use the format: 22-2222-222"
                          required
                        />
                        <small style={{ color: 'var(--neutral-500)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                          Format: 22-2222-222
                        </small>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Employment Status</label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Visiting">Visiting</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select
                        className="form-select"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                      >
                        <option value="teacher">Teacher</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                    
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        className="checkbox-input"
                        id="isTeacher"
                        name="isTeacher"
                        checked={formData.role === "teacher"}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            isTeacher: e.target.checked,
                            role: e.target.checked ? "teacher" : "admin"
                          }));
                        }}
                      />
                      <label className="checkbox-label" htmlFor="isTeacher">
                        Register as Teaching Faculty
                      </label>
                    </div>
                  </div>

                  {formData.role === "teacher" && (
                    <div className="form-section">
                      <h4 className="section-title">
                        <BookOpen size={20} />
                        Teaching Assignment
                      </h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Subject Area</label>
                          <select
                            className="form-select"
                            name="selectedSubject"
                            value={formData.selectedSubject}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Select a subject</option>
                            {subjects.map(subject => (
                              <option key={subject.id} value={subject.id}>
                                {subject.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Course/Grade Level</label>
                          <select
                            className="form-select"
                            name="selectedCourse"
                            value={formData.selectedCourse}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Select a course</option>
                            {courses.map(course => (
                              <option key={course.id} value={course.id}>
                                {course.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowPopup(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {isEditing ? "Save Changes" : "Add Faculty"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Confirm Deletion</h3>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmation(false)}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="confirmation-message">
                  <AlertTriangle size={48} className="warning-icon" />
                  <p>Are you sure you want to delete this faculty member? This action cannot be undone.</p>
                  
                  {pendingDelete?.type === "faculty" && (
                    <p className="warning-note">
                      This will also delete any associated teaching assignments.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}