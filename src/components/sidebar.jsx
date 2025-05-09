import { NavLink } from "react-router-dom";
import { auth } from "../firebase/firebase";
import logo from '../assets/Logogo.png';



export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">  
       
      <NavLink to="/" className="app-logo">
  <img src={logo} alt="CIT-U SHS Logo"  />
</NavLink>

      </div>

      <nav className="sidebar-menu">
        <NavLink to="/" className={({ isActive }) => isActive ? "sidebar-item active" : "sidebar-item"}>
          Dashboard
        </NavLink>
        <NavLink to="/schedule" className={({ isActive }) => isActive ? "sidebar-item active" : "sidebar-item"}>
          Schedule
        </NavLink>
        <NavLink to="/faculty" className={({ isActive }) => isActive ? "sidebar-item active" : "sidebar-item"}>
          Faculty
        </NavLink>
        <NavLink to="/classrooms" className={({ isActive }) => isActive ? "sidebar-item active" : "sidebar-item"}>
          Classrooms
        </NavLink>
        <NavLink to="/courses" className={({ isActive }) => isActive ? "sidebar-item active" : "sidebar-item"}>
          Strand
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => isActive ? "sidebar-item active" : "sidebar-item"}>
          Analytics
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? "sidebar-item active" : "sidebar-item"}>
          Settings
        </NavLink>
      </nav>

      <button
        onClick={() => auth.signOut()}
        className="sidebar-item"
        style={{ marginTop: 'auto', backgroundColor: '#dc2626' }}
      >
        Logout
      </button>
    </div>
  );
}
