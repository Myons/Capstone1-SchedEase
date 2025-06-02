import { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import { collection, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { canModifyData } from "../utils/auth";
import ClassroomForm from "./ClassroomForm";

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ building: "", floor: "", type: "" });
  const [userRole, setUserRole] = useState(null);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const classroomSnapshot = await getDocs(collection(db, "classrooms"));
      const classroomData = classroomSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClassrooms(classroomData);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // Get user role
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "faculty", user.uid));
        setUserRole(userDoc.data()?.role);
      }
      
      await fetchClassrooms();
    };
    
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this classroom?");
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "classrooms", id));
        // Update the UI by removing the deleted classroom
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

  // Get unique buildings and floors for filters
  const buildings = [...new Set(classrooms.map(room => room.building))].filter(Boolean);
  const floors = [...new Set(classrooms.map(room => room.floor))].filter(Boolean);

  // Apply filters
  const filteredClassrooms = classrooms.filter(room => {
    return (
      (filter.building === "" || room.building === filter.building) &&
      (filter.floor === "" || room.floor === filter.floor) &&
      (filter.type === "" || room.type === filter.type)
    );
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Classroom Management</h1>
        {canModifyData(userRole) && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Classroom
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
            <select
              name="building"
              value={filter.building}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            >
              <option value="">All Buildings</option>
              {buildings.map(building => (
                <option key={building} value={building}>{building}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <select
              name="floor"
              value={filter.floor}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            >
              <option value="">All Floors</option>
              {floors.map(floor => (
                <option key={floor} value={floor}>{floor}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
            <select
              name="type"
              value={filter.type}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            >
              <option value="">All Types</option>
              <option value="lecture">Lecture Room</option>
              <option value="laboratory">Laboratory</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add Classroom Form Modal */}
      {showAddForm && canModifyData(userRole) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-2xl w-full mx-4">
            <ClassroomForm 
              onClose={() => setShowAddForm(false)} 
              onClassroomAdded={fetchClassrooms} 
            />
          </div>
        </div>
      )}

      {/* Classrooms Table */}
      <div className="overflow-x-auto bg-white rounded shadow-md">
        {loading ? (
          <div className="p-6 text-center">Loading classrooms...</div>
        ) : filteredClassrooms.length > 0 ? (
          <table className="w-full table-auto">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="p-3 text-left">Building</th>
                <th className="p-3 text-left">Floor</th>
                <th className="p-3 text-left">Room</th>
                <th className="p-3 text-left">Room Name</th>
                <th className="p-3 text-left">Capacity</th>
                <th className="p-3 text-left">Room Type</th>
                {canModifyData(userRole) && <th className="p-3 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredClassrooms.map((room) => (
                <tr key={room.id} className="border-b hover:bg-gray-100">
                  <td className="p-3">{room.building}</td>
                  <td className="p-3">{room.floor}</td>
                  <td className="p-3">{room.roomNumber}</td>
                  <td className="p-3">{room.name}</td>
                  <td className="p-3">{room.capacity}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      room.type === "lecture" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {room.type === "lecture" ? "Lecture Room" : "Laboratory"}
                    </span>
                  </td>
                  {canModifyData(userRole) && (
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center">
            No classrooms found matching your filters. Please add a classroom or adjust your filters.
          </div>
        )}
      </div>
    </div>
  );
}