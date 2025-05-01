import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    const fetchClassrooms = async () => {
      const classroomSnapshot = await getDocs(collection(db, "classrooms"));
      const classroomData = classroomSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClassrooms(classroomData);
    };

    fetchClassrooms();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Classroom Management</h1>

      <div className="overflow-x-auto bg-white rounded shadow-md">
        <table className="w-full table-auto">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="p-3 text-left">Room Name</th>
              <th className="p-3 text-left">Capacity</th>
            </tr>
          </thead>
          <tbody>
            {classrooms.map((room) => (
              <tr key={room.id} className="border-b hover:bg-gray-100">
                <td className="p-3">{room.name}</td>
                <td className="p-3">{room.capacity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
