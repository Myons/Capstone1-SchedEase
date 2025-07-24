import { NavLink } from "react-router-dom";
import { auth } from "../firebase/firebase";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  School,
  BookOpen,
  BarChart2,
  LogOut,
  Calendar
} from "lucide-react";
import "./sidebar.css";

export function AdminSidebar() {
  const menuItems = [
    { path: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/schedule", icon: <CalendarDays size={20} />, label: "Schedule" },
    { path: "/courses", icon: <BookOpen size={20} />, label: "Strand" },
    { path: "/faculty", icon: <Users size={20} />, label: "Faculty" },
    { path: "/classrooms", icon: <School size={20} />, label: "Classrooms" },
    { path: "/analytics", icon: <BarChart2 size={20} />, label: "Analytics" },
  ];
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/" className="app-logo">
          <Calendar size={32} className="logo-icon" />
          <span className="logo-text">SchedEase</span>
        </NavLink>
      </div>
      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? "active" : ""}`
            }
          >
            {item.icon}
            <span className="sidebar-item-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <button
        onClick={() => auth.signOut()}
        className="sidebar-item logout-button"
      >
        <LogOut size={20} />
        <span className="sidebar-item-label">Logout</span>
      </button>
    </div>
  );
}

export function TeacherSidebar() {
  const menuItems = [
    { path: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/schedule", icon: <CalendarDays size={20} />, label: "Schedule" },
    { path: "/courses", icon: <BookOpen size={20} />, label: "Strand" },
    { path: "/faculty", icon: <Users size={20} />, label: "Faculty" },
  ];
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/" className="app-logo">
          <Calendar size={32} className="logo-icon" />
          <span className="logo-text">SchedEase</span>
        </NavLink>
      </div>
      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? "active" : ""}`
            }
          >
            {item.icon}
            <span className="sidebar-item-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <button
        onClick={() => auth.signOut()}
        className="sidebar-item logout-button"
      >
        <LogOut size={20} />
        <span className="sidebar-item-label">Logout</span>
      </button>
    </div>
  );
}
