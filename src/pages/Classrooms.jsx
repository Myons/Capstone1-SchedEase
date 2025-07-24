import { useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { canModifyData } from "../utils/auth";
import ClassroomForm from "./ClassroomForm";
import api from "../api/axios";
import { Plus, Trash2 } from "lucide-react";
import "./Classroom.css";

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ building: "", floor: "", type: "" });
  const [userRole, setUserRole] = useState(null);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const res = await api.get("/classrooms");
      setClassrooms(res.data);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const userDoc = await api.get(`/faculty/${user.uid}`);
        setUserRole(userDoc.data?.role);
      } catch (err) {
        setUserRole(null);
      }
      
      await fetchClassrooms();
    };
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this classroom?");
    if (confirmDelete) {
      try {
        await api.delete(`/classrooms/${id}`);
        setClassrooms(prev => prev.filter(classroom => classroom.id !== id));
      } catch (error) {
        console.error("Error deleting classroom:", error);
        alert("Failed to delete classroom");
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const buildings = [...new Set(classrooms.map(room => room.building))].filter(Boolean);
  const floors = [...new Set(classrooms.map(room => room.floor))].filter(Boolean);

  const filteredClassrooms = classrooms.filter(room => {
    return (
      (filter.building === "" || room.building === filter.building) &&
      (filter.floor === "" || room.floor === filter.floor) &&
      (filter.type === "" || room.type === filter.type)
    );
  });

  const handleAddClassroom = async (classroomData) => {
    try {
      await api.post("/classrooms", classroomData);
      await fetchClassrooms();
      setShowAddForm(false);
    } catch (error) {
      alert("Failed to add classroom");
    }
  };

  return (
    <div className="classrooms-container">
      <div className="classrooms-header">
        <h1 className="classrooms-title">Classroom Management</h1>
      </div>

      {canModifyData(userRole) && (
        <div className="add-classroom-container">
          <button onClick={() => setShowAddForm(true)} className="add-classroom-btn">
            <Plus size={20} /> Add Classroom
          </button>
        </div>
      )}

      <div className="filters-container">
        <div className="filters-grid">
          <div className="filter-group">
            <select name="building" value={filter.building} onChange={handleFilterChange}>
              <option value="">All Buildings</option>
              {buildings.map(building => (
                <option key={building} value={building}>{building}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select name="floor" value={filter.floor} onChange={handleFilterChange}>
              <option value="">All Floors</option>
              {floors.map(floor => (
                <option key={floor} value={floor}>{floor}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select name="type" value={filter.type} onChange={handleFilterChange}>
              <option value="">All Types</option>
              <option value="lecture">Lecture Room</option>
              <option value="laboratory">Laboratory</option>
            </select>
          </div>
        </div>
      </div>

      {showAddForm && canModifyData(userRole) && (
        <div className="modal-overlay">
          <div className="modal-container">
            <ClassroomForm 
              onClose={() => setShowAddForm(false)} 
              onClassroomAdded={handleAddClassroom} 
            />
          </div>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="p-6 text-center">Loading classrooms...</div>
        ) : (
          <table className="classrooms-table">
            <thead>
              <tr>
                <th>Building</th>
                <th>Floor</th>
                <th>Room</th>
                <th>Room Name</th>
                <th>Capacity</th>
                <th>Type</th>
                {canModifyData(userRole) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredClassrooms.map((room) => (
                <tr key={room.id}>
                  <td>{room.building}</td>
                  <td>{room.floor}</td>
                  <td>{room.roomNumber}</td>
                  <td>{room.name}</td>
                  <td>{room.capacity}</td>
                  <td>
                    <span className={`room-type ${room.type}`}>
                      {room.type === "lecture" ? "Lecture" : "Laboratory"}
                    </span>
                  </td>
                  {canModifyData(userRole) && (
                    <td>
                      <button className="delete-btn" onClick={() => handleDelete(room.id)}>
                        <Trash2 size={20} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}