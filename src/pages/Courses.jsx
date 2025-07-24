import { useEffect, useState } from "react";
import React from "react";
import { auth } from "../firebase/firebase";
import { canModifyData } from "../utils/auth";
import {
  BookOpen,
  Users,
  GraduationCap,
  Clock,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  ChevronDown
} from "lucide-react";
import "./Courses.css";
import api from "../api/axios";

export default function Courses() {
  // Section modal state
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [newSection, setNewSection] = useState({ name: "", status: "active", courseId: null });
  const [sectionCourseId, setSectionCourseId] = useState(null);

  // Add Section handler
  const handleAddSection = async (sectionData) => {
    setSectionLoading(true);
    try {
      await api.post("/sections", sectionData);
      const res = await api.get("/sections");
      setSections(res.data);
      setShowSectionModal(false);
      setNewSection({ name: "", adviser: "", status: "active", courseId: null });
    } catch (err) {
      alert("Failed to add section.");
    } finally {
      setSectionLoading(false);
    }
  };
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: "",
    description: "",
    strand: "STEM",
    status: "active"
  });
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.log("⏳ Waiting for user authentication...");
        setLoading(false);
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAddModal]);
        return;
      }
      
      // Add a small delay to ensure token is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        console.log("🔍 Fetching courses data for user:", user.uid);
        
        // Get user role from backend
          const userDoc = await api.get(`/faculty/${user.uid}`);
          setUserRole(userDoc.data?.role);
        
        // Fetch courses, sections, teachers from backend
        const [coursesRes, sectionsRes, teachersRes] = await Promise.all([
          api.get("/courses"),
          api.get("/sections"),
          api.get("/teachers")
        ]);
        setCourses(coursesRes.data);
        setSections(sectionsRes.data);
        setTeachers(teachersRes.data);
      } catch (err) {
        console.error("❌ Error fetching courses data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [auth.currentUser]); // Add auth.currentUser as dependency

  // Stats calculations
  const stats = {
    totalCourses: courses.length,
    totalTeachers: teachers.length,
    activeStrands: new Set(courses.map(course => course.strand)).size
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || course.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Add, Edit, Delete handlers (to be implemented with backend API)
  const handleAddCourse = async (courseData) => {
    setAddLoading(true);
    try {
      await api.post("/courses", courseData);
      const res = await api.get("/courses");
      setCourses(res.data);
      setShowAddModal(false);
      setNewCourse({ name: "", description: "", strand: "STEM", status: "active" });
    } catch (err) {
      alert("Failed to add course.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditCourse = async (id, courseData) => {
    try {
      await api.put(`/courses/${id}`, courseData);
      const res = await api.get("/courses");
      setCourses(res.data);
    } catch (err) {
      alert("Failed to update course.");
    }
  };

  const handleDeleteCourse = async (id) => {
    try {
      await api.delete(`/courses/${id}`);
      setCourses(courses.filter(c => c.id !== id));
    } catch (err) {
      alert("Failed to delete course.");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="courses-container improved">
      {/* Header Section */}
      <div className="courses-header-wrapper" style={{ width: '80%', margin: '10 auto' }}>
        <div className="courses-header improved-header">
          <h1 className="courses-title">Course & Strand Management</h1>
          {canModifyData(userRole) && (
            <button className="add-course-btn improved-btn" onClick={() => setShowAddModal(true)}>
              <Plus size={20} />
              Add New Course/Strand
            </button>
          )}
        </div>
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <>
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 style={{marginBottom: 18}}>Add New Course/Strand</h2>
              <form onSubmit={e => {
                e.preventDefault();
                handleAddCourse(newCourse);
              }}>
                <div style={{marginBottom: 12}}>
                  <label style={{fontWeight: 500}}>Name</label>
                  <input type="text" required value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})} style={{width: "100%", padding: 8, borderRadius: 6, border: "1px solid #eaeaea", marginTop: 4}} />
                </div>
                <div style={{marginBottom: 12}}>
                  <label style={{fontWeight: 500}}>Description</label>
                  <textarea value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} style={{width: "100%", padding: 8, borderRadius: 6, border: "1px solid #eaeaea", marginTop: 4}} />
                </div>
                <div style={{marginBottom: 12}}>
                  <label style={{fontWeight: 500}}>Strand</label>
                  <select value={newCourse.strand} onChange={e => setNewCourse({...newCourse, strand: e.target.value})} style={{width: "100%", padding: 8, borderRadius: 6, border: "1px solid #eaeaea", marginTop: 4}}>
                    <option value="STEM">STEM</option>
                    <option value="ABM">ABM</option>
                    <option value="HUMSS">HUMSS</option>
                    <option value="GAS">GAS</option>
                    <option value="TVL">TVL</option>
                  </select>
                </div>
                <div style={{marginBottom: 12}}>
                  <label style={{fontWeight: 500}}>Status</label>
                  <select value={newCourse.status} onChange={e => setNewCourse({...newCourse, status: e.target.value})} style={{width: "100%", padding: 8, borderRadius: 6, border: "1px solid #eaeaea", marginTop: 4}}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div style={{display: "flex", gap: 12, marginTop: 18}}>
                  <button type="submit" className="improved-btn" disabled={addLoading} style={{flex: 1}}>
                    {addLoading ? "Adding..." : "Add Course"}
                  </button>
                  <button type="button" className="improved-delete-btn" style={{flex: 1}} onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Stats Cards */}
      <div className="stats-grid improved-stats">
        <div className="stat-card improved-stat-card">
          <div className="stat-icon stat-bg-blue">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Courses</h3>
            <p>{stats.totalCourses}</p>
          </div>
        </div>
        <div className="stat-card improved-stat-card">
          <div className="stat-icon stat-bg-green">
            <GraduationCap size={24} />
          </div>
          <div className="stat-content">
            <h3>Active Teachers</h3>
            <p>{stats.totalTeachers}</p>
          </div>
        </div>
        <div className="stat-card improved-stat-card">
          <div className="stat-icon stat-bg-purple">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>Active Strands</h3>
            <p>{stats.activeStrands}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section improved-search-filter">
        <div className="search-bar improved-search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-section improved-filter-section">
          <button 
            className="filter-button improved-filter-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            Filters
            <ChevronDown size={16} />
          </button>
          {showFilters && (
            <div className="filter-dropdown improved-filter-dropdown">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Strands</option>
                <option value="STEM">STEM</option>
                <option value="ABM">ABM</option>
                <option value="HUMSS">HUMSS</option>
                <option value="GAS">GAS</option>
                <option value="TVL">TVL</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="courses-grid improved-courses-grid">
        {filteredCourses.map((course) => (
          <div key={course.id} className="course-card improved-course-card">
            <div className="course-header improved-course-header">
              <h3>{course.name}</h3>
              <span className={`status-badge improved-status-badge ${course.status?.toLowerCase()}`}> 
                {course.strand || "No Strand"}
              </span>
            </div>
            <p className="course-description improved-course-description">
              {course.description || "No description available"}
            </p>
            <div className="course-metrics improved-course-metrics">
              <div className="metric improved-metric">
                <span className="metric-label">Sections</span>
                <span className="metric-value">
                  {sections.filter(s => s.courseId === course.id).length}
                </span>
                {canModifyData(userRole) && (
                  <button className="add-section-btn improved-btn" style={{marginLeft: 8, fontSize: 12, padding: '2px 8px'}} onClick={() => { setShowSectionModal(true); setSectionCourseId(course.id); setNewSection({ ...newSection, courseId: course.id }); }}>
                    <Plus size={14} /> Add Section
                  </button>
                )}
              </div>
              <div className="metric improved-metric">
                <span className="metric-label">Teachers</span>
                <span className="metric-value">
                  {teachers.filter(t => t.courseId === course.id).length}
                </span>
              </div>
            </div>
            <div className="course-coordinator improved-course-coordinator">
              <img 
                src={teachers.find(t => t.id === course.teacherId)?.photoURL || "/default-avatar.png"} 
                alt="Coordinator"
                className="coordinator-avatar improved-coordinator-avatar"
              />
              <div className="coordinator-info improved-coordinator-info">
                <span className="coordinator-name">
                  {teachers.find(t => t.id === course.teacherId)?.name || "Unassigned"}
                </span>
                <span className="coordinator-title">Course Coordinator</span>
              </div>
            </div>
            <div className="schedule-preview improved-schedule-preview">
              <h4>Schedule Preview</h4>
              <div className="schedule-slots improved-schedule-slots">
                {course.schedule ? (
                  <div className="schedule-info improved-schedule-info">{course.schedule}</div>
                ) : (
                  <p className="no-schedule improved-no-schedule">No schedule set</p>
                )}
              </div>
            </div>
            {canModifyData(userRole) && (
              <div className="course-actions improved-course-actions">
                <button className="edit-btn improved-edit-btn">
                  <Edit size={16} />
                  Edit
                </button>
                <button className="delete-btn improved-delete-btn">
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Section Modal */}
      {showSectionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{marginBottom: 18}}>Add New Section</h2>
            <form onSubmit={e => {
              e.preventDefault();
              handleAddSection(newSection);
            }}>
              <div style={{marginBottom: 12}}>
                <label style={{fontWeight: 500}}>Section Name</label>
                <input type="text" required value={newSection.name} onChange={e => setNewSection({...newSection, name: e.target.value})} style={{width: "100%", padding: 8, borderRadius: 6, border: "1px solid #eaeaea", marginTop: 4}} />
              </div>
              <div style={{marginBottom: 12}}>
                <label style={{fontWeight: 500}}>Status</label>
                <select value={newSection.status} onChange={e => setNewSection({...newSection, status: e.target.value})} style={{width: "100%", padding: 8, borderRadius: 6, border: "1px solid #eaeaea", marginTop: 4}}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{display: "flex", gap: 12, marginTop: 18}}>
                <button type="submit" className="improved-btn" disabled={sectionLoading} style={{flex: 1}}>
                  {sectionLoading ? "Adding..." : "Add Section"}
                </button>
                <button type="button" className="improved-delete-btn" style={{flex: 1}} onClick={() => setShowSectionModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
