import { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
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

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user role
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, "faculty", user.uid));
          setUserRole(userDoc.data()?.role);
        }

        const [coursesData, sectionsData, teachersData] = await Promise.all([
          getDocs(collection(db, "courses")),
          getDocs(collection(db, "sections")),
          getDocs(collection(db, "teachers"))
        ]);

        setCourses(coursesData.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setSections(sectionsData.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTeachers(teachersData.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="courses-container">
      {/* Header Section */}
      <div className="courses-header">
        <h1 className="courses-title">Course & Strand Management</h1>
        {canModifyData(userRole) && (
          <button className="add-course-btn">
            <Plus size={20} />
            Add New Course/Strand
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Courses</h3>
            <p>{stats.totalCourses}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <GraduationCap size={24} />
          </div>
          <div className="stat-content">
            <h3>Active Teachers</h3>
            <p>{stats.totalTeachers}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>Active Strands</h3>
            <p>{stats.activeStrands}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-section">
          <button 
            className="filter-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            Filters
            <ChevronDown size={16} />
          </button>
          {showFilters && (
            <div className="filter-dropdown">
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
      <div className="courses-grid">
        {filteredCourses.map((course) => (
          <div key={course.id} className="course-card">
            <div className="course-header">
              <h3>{course.name}</h3>
              <span className={`status-badge ${course.status?.toLowerCase()}`}>
                {course.strand || "No Strand"}
              </span>
            </div>
            
            <p className="course-description">
              {course.description || "No description available"}
            </p>
            
            <div className="course-metrics">
              <div className="metric">
                <span className="metric-label">Sections</span>
                <span className="metric-value">
                  {sections.filter(s => s.courseId === course.id).length}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Teachers</span>
                <span className="metric-value">
                  {teachers.filter(t => t.courseId === course.id).length}
                </span>
              </div>
            </div>

            <div className="course-coordinator">
              <img 
                src={teachers.find(t => t.id === course.teacherId)?.photoURL || "/default-avatar.png"} 
                alt="Coordinator"
                className="coordinator-avatar"
              />
              <div className="coordinator-info">
                <span className="coordinator-name">
                  {teachers.find(t => t.id === course.teacherId)?.name || "Unassigned"}
                </span>
                <span className="coordinator-title">Course Coordinator</span>
              </div>
            </div>

            <div className="schedule-preview">
              <h4>Schedule Preview</h4>
              <div className="schedule-slots">
                {course.schedule ? (
                  <div className="schedule-info">{course.schedule}</div>
                ) : (
                  <p className="no-schedule">No schedule set</p>
                )}
              </div>
            </div>

            {canModifyData(userRole) && (
              <div className="course-actions">
                <button className="edit-btn">
                  <Edit size={16} />
                  Edit
                </button>
                <button className="delete-btn">
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
