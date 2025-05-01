import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Courses() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const coursesSnapshot = await getDocs(collection(db, "courses"));
      const courseData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(courseData);
    };

    fetchCourses();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Strand Management</h1>

      <div className="overflow-x-auto bg-white rounded shadow-md">
        <table className="w-full table-auto">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="p-3 text-left">Course Name</th>
              <th className="p-3 text-left">Grade Level</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-b hover:bg-gray-100">
                <td className="p-3">{course.name}</td>
                <td className="p-3">{course.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
