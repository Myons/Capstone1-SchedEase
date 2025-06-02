import { useState } from "react";
import { db } from "../firebase/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function ClassroomForm({ onClose, onClassroomAdded }) {
  const [formData, setFormData] = useState({
    building: "",
    floor: "",
    roomNumber: "",
    name: "",
    capacity: "",
    type: "lecture" // Default to lecture
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate name when building, floor, and roomNumber are filled
      ...(name === "building" || name === "floor" || name === "roomNumber" ? {
        name: `${name === "building" ? value : formData.building}-${name === "floor" ? value : formData.floor}-${name === "roomNumber" ? value : formData.roomNumber}`
      } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!formData.building || !formData.floor || !formData.roomNumber || !formData.capacity) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Add to Firestore
      await addDoc(collection(db, "classrooms"), {
        building: formData.building,
        floor: formData.floor,
        roomNumber: formData.roomNumber,
        name: formData.name,
        capacity: parseInt(formData.capacity),
        type: formData.type
      });
      
      // Reset form
      setFormData({
        building: "",
        floor: "",
        roomNumber: "",
        name: "",
        capacity: "",
        type: "lecture"
      });
      
      // Notify parent component
      if (onClassroomAdded) {
        onClassroomAdded();
      }
      
      // Close modal if provided
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Error adding classroom:", err);
      setError("Failed to add classroom: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Add New Classroom</h2>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Building*
            </label>
            <input
              type="text"
              name="building"
              value={formData.building}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              placeholder="e.g., Main, Science, Engineering"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Floor*
            </label>
            <input
              type="text"
              name="floor"
              value={formData.floor}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              placeholder="e.g., 1, 2, Ground"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Number*
            </label>
            <input
              type="text"
              name="roomNumber"
              value={formData.roomNumber}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              placeholder="e.g., 101, 202A"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              placeholder="Auto-generated from building-floor-room"
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-generated but can be customized
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity*
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              placeholder="Maximum number of students"
              min="1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Type*
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              required
            >
              <option value="lecture">Lecture Room</option>
              <option value="laboratory">Laboratory</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Classroom"}
          </button>
        </div>
      </form>
    </div>
  );
}