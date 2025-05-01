// src/pages/Analytics.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA00FF", "#FF4C4C", "#4CAF50", "#9C27B0"];

export default function Analytics() {
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState("weekly");
  const [selectedMetric, setSelectedMetric] = useState("teacherLoad");

  useEffect(() => {
    // Subscribe to schedules collection
    const unsubscribeSchedules = onSnapshot(collection(db, "schedules"), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      setSchedules(data);
    });

    // Fetch faculty data
    const fetchTeachers = async () => {
      const snapshot = await getDocs(collection(db, "faculty"));
      setTeachers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    // Fetch room data
    const fetchRooms = async () => {
      const snapshot = await getDocs(collection(db, "classrooms"));
      setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    // Fetch sections data
    const fetchSections = async () => {
      const snapshot = await getDocs(collection(db, "sections"));
      setSections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    // Fetch subjects data
    const fetchSubjects = async () => {
      const snapshot = await getDocs(collection(db, "subjects"));
      setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchTeachers();
    fetchRooms();
    fetchSections();
    fetchSubjects();

    return () => {
      unsubscribeSchedules();
    };
  }, []);

  // Basic analytics calculations
  const teacherLoad = schedules.reduce((acc, curr) => {
    acc[curr.teacherName] = (acc[curr.teacherName] || 0) + 1;
    return acc;
  }, {});

  const roomUsage = schedules.reduce((acc, curr) => {
    acc[curr.room] = (acc[curr.room] || 0) + 1;
    return acc;
  }, {});

  const dayDistribution = schedules.reduce((acc, curr) => {
    acc[curr.day] = (acc[curr.day] || 0) + 1;
    return acc;
  }, {});

  // Advanced analytics calculations
  const calculateTeacherEfficiency = () => {
    // Calculate teacher workload efficiency (classes vs capacity)
    const teacherEfficiency = {};
    
    teachers.forEach(teacher => {
      const classCount = schedules.filter(s => s.teacherName === teacher.name).length;
      const maxLoad = teacher.status === "Full-time" ? 21 : 12;
      const efficiency = classCount / maxLoad * 100;
      teacherEfficiency[teacher.name] = efficiency;
    });
    
    return Object.keys(teacherEfficiency).map(name => ({
      name,
      efficiency: teacherEfficiency[name]
    }));
  };

  const calculateRoomUtilization = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const workingHours = 9; // 7am-4pm (9 hours)
    const roomUtilization = {};
    
    // Initialize room utilization
    rooms.forEach(room => {
      roomUtilization[room.name] = {
        totalPossibleHours: days.length * workingHours,
        scheduledHours: 0
      };
    });
    
    // Calculate scheduled hours
    schedules.forEach(schedule => {
      const startHour = parseInt(schedule.startTime.split(':')[0]);
      const endHour = parseInt(schedule.endTime.split(':')[0]);
      const duration = endHour - startHour + (endHour < startHour ? 24 : 0);
      
      if (roomUtilization[schedule.room]) {
        roomUtilization[schedule.room].scheduledHours += duration;
      }
    });
    
    // Calculate utilization percentage
    return Object.keys(roomUtilization).map(room => ({
      name: room,
      utilization: (roomUtilization[room].scheduledHours / roomUtilization[room].totalPossibleHours) * 100
    }));
  };

  const calculateHourlyDistribution = () => {
    const hours = ["07", "08", "09", "10", "11", "12", "13", "14", "15", "16"];
    const hourlyData = hours.map(hour => ({
      hour: `${hour}:00`,
      count: schedules.filter(s => s.startTime.startsWith(hour) || 
                               (parseInt(s.startTime.split(':')[0]) < parseInt(hour) && 
                                parseInt(s.endTime.split(':')[0]) > parseInt(hour))).length
    }));
    
    return hourlyData;
  };

  const calculateSectionLoad = () => {
    const sectionLoad = {};
    
    schedules.forEach(schedule => {
      sectionLoad[schedule.sectionId] = (sectionLoad[schedule.sectionId] || 0) + 1;
    });
    
    return Object.keys(sectionLoad).map(sectionId => ({
      name: sections.find(s => s.id === sectionId)?.name || "Unknown",
      classes: sectionLoad[sectionId]
    }));
  };

  // Convert to array format for charts
  const teacherLoadData = Object.keys(teacherLoad).map((key) => ({ name: key, value: teacherLoad[key] }));
  const roomUsageData = Object.keys(roomUsage).map((key) => ({ name: key, value: roomUsage[key] }));
  const dayDistributionData = Object.keys(dayDistribution).map((key) => ({ day: key, classes: dayDistribution[key] }));
  const teacherEfficiencyData = calculateTeacherEfficiency();
  const roomUtilizationData = calculateRoomUtilization();
  const hourlyDistributionData = calculateHourlyDistribution();
  const sectionLoadData = calculateSectionLoad();

  // Format teachers by workload status
  const teachersByStatus = teachers.reduce((acc, teacher) => {
    const classCount = schedules.filter(s => s.teacherName === teacher.name).length;
    const status = classCount === 0 ? "Unassigned" : 
                  classCount < 10 ? "Underloaded" : 
                  classCount > 20 ? "Overloaded" : "Optimal";
    
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const teacherStatusData = Object.keys(teachersByStatus).map(key => ({
    name: key,
    value: teachersByStatus[key]
  }));

  return (
    <div className="analytics-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics & Reports</h1>
        
        <div className="filter-controls">
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="border rounded p-2"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="semester">Semester</option>
          </select>
          
          <select 
            value={selectedMetric} 
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="border rounded p-2"
          >
            <option value="teacherLoad">Teacher Load</option>
            <option value="roomUsage">Room Usage</option>
            <option value="scheduleDistribution">Schedule Distribution</option>
            <option value="sectionLoad">Section Load</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="analytics-card summary-card">
          <h3 className="text-gray-500 text-sm">Total Classes</h3>
          <p className="text-2xl font-bold">{schedules.length}</p>
        </div>
        <div className="analytics-card summary-card">
          <h3 className="text-gray-500 text-sm">Active Teachers</h3>
          <p className="text-2xl font-bold">{Object.keys(teacherLoad).length}</p>
        </div>
        <div className="analytics-card summary-card">
          <h3 className="text-gray-500 text-sm">Rooms In Use</h3>
          <p className="text-2xl font-bold">{Object.keys(roomUsage).length}</p>
        </div>
        <div className="analytics-card summary-card">
          <h3 className="text-gray-500 text-sm">Avg Classes Per Day</h3>
          <p className="text-2xl font-bold">
            {dayDistributionData.length > 0 ? 
              (schedules.length / dayDistributionData.length).toFixed(1) : 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Teacher Load Pie Chart */}
        <div className="chart-container">
          <h2 className="text-xl font-bold mb-4">Teacher Load</h2>
          <div className="pie-chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={teacherLoadData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {teacherLoadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Teacher Status Distribution */}
        <div className="chart-container">
          <h2 className="text-xl font-bold mb-4">Teacher Workload Status</h2>
          <div className="pie-chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={teacherStatusData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {teacherStatusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.name === "Optimal" ? "#4CAF50" : 
                        entry.name === "Underloaded" ? "#FFC107" : 
                        entry.name === "Overloaded" ? "#F44336" : 
                        "#9E9E9E"
                      } 
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Utilization */}
        <div className="chart-container">
          <h2 className="text-xl font-bold mb-4">Room Utilization</h2>
          <div className="bar-chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roomUtilizationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="utilization" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Teacher Efficiency */}
        <div className="chart-container">
          <h2 className="text-xl font-bold mb-4">Teacher Efficiency</h2>
          <div className="bar-chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teacherEfficiencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Efficiency %', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="efficiency" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Class Distribution */}
        <div className="chart-container md:col-span-2">
          <h2 className="text-xl font-bold mb-4">Hourly Class Distribution</h2>
          <div className="area-chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hourlyDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class Per Day Distribution */}
        <div className="chart-container md:col-span-2">
          <h2 className="text-xl font-bold mb-4">Classes Per Day</h2>
          <div className="bar-chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="classes" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Insights Section */}
      <div className="mt-8 insights-container">
        <h2 className="text-xl font-bold mb-4">Key Insights</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-lg mb-2">Resource Utilization</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Room utilization is {
                  roomUtilizationData.length > 0 ? 
                    `${(roomUtilizationData.reduce((sum, item) => sum + item.utilization, 0) / roomUtilizationData.length).toFixed(1)}%` : 
                    'loading...'
                }
              </li>
              <li>
                Most utilized room: {
                  roomUtilizationData.length > 0 ?
                    roomUtilizationData.sort((a, b) => b.utilization - a.utilization)[0]?.name :
                    'loading...'
                }
              </li>
              <li>
                Least utilized room: {
                  roomUtilizationData.length > 0 ?
                    roomUtilizationData.sort((a, b) => a.utilization - b.utilization)[0]?.name :
                    'loading...'
                }
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-2">Schedule Balance</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Peak teaching hour: {
                  hourlyDistributionData.length > 0 ?
                    hourlyDistributionData.sort((a, b) => b.count - a.count)[0]?.hour :
                    'loading...'
                }
              </li>
              <li>
                Busiest day: {
                  dayDistributionData.length > 0 ?
                    dayDistributionData.sort((a, b) => b.classes - a.classes)[0]?.day :
                    'loading...'
                }
              </li>
              <li>
                Teacher workload distribution: {
                  teacherEfficiencyData.length > 0 ?
                    `${teacherEfficiencyData.filter(t => t.efficiency >= 90 && t.efficiency <= 110).length} teachers with optimal load` :
                    'loading...'
                }
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Export Report Section */}
      <div className="mt-8 flex justify-end">
        <button className="export-button">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export Report
        </button>
      </div>
    </div>
  );
}