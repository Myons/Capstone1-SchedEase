import { useEffect, useState, useMemo } from "react";
import { auth } from "../firebase/firebase";
import api from "../api/axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import "./Analytics.css";

// Color palette
const COLORS = {
  primary: "#003366",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  neutral: "#64748b",
  chart: ["#003366", "#004d99", "#0066cc", "#0080ff", "#3399ff", "#66b3ff", "#99ccff", "#cce6ff"]
};

const Analytics = () => {
  // State management
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [sections, setSections] = useState([]);
  const [timeRange, setTimeRange] = useState("week");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Advanced Metrics ---
  // Room Capacity vs. Actual Occupancy
  const roomCapacityStats = useMemo(() => {
    if (!rooms.length || !schedules.length) return [];
    return rooms.map(room => {
      const scheduledCount = schedules.filter(s => s.room === room.name).length;
      return {
        name: room.name,
        capacity: room.capacity || 40,
        scheduled: scheduledCount,
        utilization: Math.round((scheduledCount / (room.capacity || 40)) * 100)
      };
    });
  }, [rooms, schedules]);

  // Number of teachers per room
  const teachersPerRoom = useMemo(() => {
    if (!schedules.length) return [];
    const roomTeacherMap = {};
    schedules.forEach(s => {
      if (!roomTeacherMap[s.room]) roomTeacherMap[s.room] = new Set();
      roomTeacherMap[s.room].add(s.teacherName);
    });
    return Object.entries(roomTeacherMap).map(([room, teachers]) => ({
      room,
      teacherCount: teachers.size
    }));
  }, [schedules]);

  // Rooms per teacher
  const roomsPerTeacher = useMemo(() => {
    if (!schedules.length) return [];
    const teacherRoomMap = {};
    schedules.forEach(s => {
      if (!teacherRoomMap[s.teacherName]) teacherRoomMap[s.teacherName] = new Set();
      teacherRoomMap[s.teacherName].add(s.room);
    });
    return Object.entries(teacherRoomMap).map(([teacher, rooms]) => ({
      teacher,
      roomCount: rooms.size
    }));
  }, [schedules]);

  // Total teaching hours per teacher
  const teachingHoursPerTeacher = useMemo(() => {
    if (!schedules.length) return [];
    // Assume each class is 1.5 hours (adjust if needed)
    return Object.entries(schedules.reduce((acc, curr) => {
      acc[curr.teacherName] = (acc[curr.teacherName] || 0) + 1.5;
      return acc;
    }, {})).map(([teacher, hours]) => ({ teacher, hours }));
  }, [schedules]);

  // Utilization distribution (High/Medium/Low)
  const utilizationDistribution = useMemo(() => {
    if (!roomCapacityStats.length) return [];
    let high = 0, medium = 0, low = 0;
    roomCapacityStats.forEach(r => {
      if (r.utilization >= 70) high++;
      else if (r.utilization >= 30) medium++;
      else low++;
    });
    return [
      { name: "High", value: high },
      { name: "Medium", value: medium },
      { name: "Low", value: low }
    ];
  }, [roomCapacityStats]);

  // Room-to-room comparison for Radar Chart
  const radarRoomData = useMemo(() => {
    if (!roomCapacityStats.length) return [];
    return roomCapacityStats.map(r => ({
      subject: r.name,
      utilization: r.utilization,
      teacherCount: teachersPerRoom.find(t => t.room === r.name)?.teacherCount || 0
    }));
  }, [roomCapacityStats, teachersPerRoom]);

  // Teacher efficiency scatter plot
  const teacherEfficiencyData = useMemo(() => {
    if (!roomsPerTeacher.length || !teachingHoursPerTeacher.length) return [];
    return roomsPerTeacher.map(t => {
      const hours = teachingHoursPerTeacher.find(h => h.teacher === t.teacher)?.hours || 0;
      return { teacher: t.teacher, rooms: t.roomCount, hours };
    });
  }, [roomsPerTeacher, teachingHoursPerTeacher]);

  // Most/least utilized rooms
  const mostUtilizedRooms = useMemo(() => {
    return [...roomCapacityStats].sort((a, b) => b.utilization - a.utilization).slice(0, 3);
  }, [roomCapacityStats]);
  const leastUtilizedRooms = useMemo(() => {
    return [...roomCapacityStats].sort((a, b) => a.utilization - b.utilization).slice(0, 3);
  }, [roomCapacityStats]);

  // Overall utilization percentage
  const overallUtilization = useMemo(() => {
    if (!roomCapacityStats.length) return 0;
    return Math.round(roomCapacityStats.reduce((acc, curr) => acc + curr.utilization, 0) / roomCapacityStats.length);
  }, [roomCapacityStats]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.log("⏳ Waiting for user authentication...");
        setIsLoading(false);
        return;
      }
      
      // Add a small delay to ensure token is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsLoading(true);
      setError(null);
      try {
        console.log("🔍 Fetching analytics data for user:", user.uid);
        
        // Fetch schedules from backend API
        const schedulesRes = await api.get("/schedules");
        setSchedules(schedulesRes.data);
        // Fetch other collections from backend API
        const [teachersRes, roomsRes, sectionsRes] = await Promise.all([
          api.get("/teachers"),
          api.get("/classrooms"),
          api.get("/sections")
        ]);
        setTeachers(teachersRes.data);
        setRooms(roomsRes.data);
        setSections(sectionsRes.data);
        setIsLoading(false);
      } catch (err) {
        console.error("❌ Error fetching analytics data:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [auth.currentUser]); // Add auth.currentUser as dependency

  // Computed statistics
  const stats = useMemo(() => {
    if (!schedules.length) return null;
    
    const totalClasses = schedules.length;
    const activeTeachers = new Set(schedules.map(s => s.teacherName)).size;
    const activeRooms = new Set(schedules.map(s => s.room)).size;
    const avgClassesPerDay = totalClasses / 5; // Assuming 5 working days
    
    return {
      totalClasses: {
        value: totalClasses,
        trend: "+5%",
        isPositive: true
      },
      activeTeachers: {
        value: activeTeachers,
        trend: "0%",
        isPositive: true
      },
      activeRooms: {
        value: activeRooms,
        trend: "-2%",
        isPositive: false
      },
      avgClassesPerDay: {
        value: Math.round(avgClassesPerDay),
        trend: "+3%",
        isPositive: true
      }
    };
  }, [schedules]);

  // Chart data computations
  const chartData = useMemo(() => {
    if (!schedules.length) return {};
    
    // Teacher workload distribution
    const teacherLoad = schedules.reduce((acc, curr) => {
      acc[curr.teacherName] = (acc[curr.teacherName] || 0) + 1;
      return acc;
    }, {});
    
    const teacherLoadData = Object.entries(teacherLoad)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Room utilization
    const roomUsage = schedules.reduce((acc, curr) => {
      acc[curr.room] = (acc[curr.room] || 0) + 1;
      return acc;
    }, {});
    
    const roomUtilizationData = Object.entries(roomUsage)
      .map(([name, value]) => ({
        name,
        utilization: (value / 40) * 100 // Assuming 40 slots per week is 100% utilization
      }))
      .sort((a, b) => b.utilization - a.utilization);

    // Hourly distribution
    const hourlyDistribution = schedules.reduce((acc, curr) => {
      const hour = curr.startTime.split(":")[0];
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    
    const hourlyData = Array.from({ length: 10 }, (_, i) => {
      const hour = String(i + 7).padStart(2, "0");
      return {
        hour: `${hour}:00`,
        classes: hourlyDistribution[hour] || 0
      };
    });

    // Daily distribution
    const dailyDistribution = schedules.reduce((acc, curr) => {
      acc[curr.day] = (acc[curr.day] || 0) + 1;
      return acc;
    }, {});
    
    const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const dailyData = daysOrder.map(day => ({
      day,
      classes: dailyDistribution[day] || 0
    }));

    return {
      teacherLoad: teacherLoadData,
      roomUtilization: roomUtilizationData,
      hourlyDistribution: hourlyData,
      dailyDistribution: dailyData
    };
  }, [schedules]);

  // Insights computation
  const insights = useMemo(() => {
    if (!schedules.length || !chartData.roomUtilization || !chartData.teacherLoad) return null;
    
    return {
      resourceUtilization: [
        {
          text: "Average room utilization",
          value: `${Math.round(chartData.roomUtilization.reduce((acc, curr) => acc + curr.utilization, 0) / chartData.roomUtilization.length)}%`
        },
        {
          text: "Rooms under 30% utilization",
          value: chartData.roomUtilization.filter(r => r.utilization < 30).length,
          isWarning: true
        },
        {
          text: "Most utilized room",
          value: chartData.roomUtilization[0]?.name
        }
      ],
      scheduleBalance: [
        {
          text: "Peak teaching hour",
          value: chartData.hourlyDistribution.reduce((a, b) => a.classes > b.classes ? a : b).hour
        },
        {
          text: "Teachers with optimal load",
          value: chartData.teacherLoad.filter(t => t.value >= 15 && t.value <= 25).length
        },
        {
          text: "Overloaded teachers",
          value: chartData.teacherLoad.filter(t => t.value > 25).length,
          isWarning: true
        }
      ]
    };
  }, [schedules, chartData]);

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-message">
          Error loading analytics: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-dashboard__header">
        <div className="analytics-dashboard__header-content">
          <div className="analytics-dashboard__title-wrapper">
            <svg className="analytics-dashboard__title-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
              <path d="M16 5V3" />
              <path d="M8 5V3" />
              <path d="M3 9h18" />
              <circle cx="18" cy="18" r="3" />
              <path d="M18 14v1" />
            </svg>
            <h1 className="analytics-dashboard__title">Schedule Analytics</h1>
          </div>
          <div className="analytics-dashboard__actions">
            <select 
              className="analytics-dashboard__select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="semester">This Semester</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- Summary Statistics --- */}
      <div className="analytics-dashboard__stats-grid">
        <div className="analytics-dashboard__stat-card">
          <h3>Overall Utilization</h3>
          <div className="progress-bar" style={{ width: "100%", background: COLORS.neutral, borderRadius: 8 }}>
            <div style={{ width: `${overallUtilization}%`, background: COLORS.success, height: 16, borderRadius: 8 }} />
          </div>
          <p>{overallUtilization}%</p>
        </div>
        <div className="analytics-dashboard__stat-card">
          <h3>Usage Distribution</h3>
          <PieChart width={180} height={180}>
            <Pie data={utilizationDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
              {utilizationDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
        <div className="analytics-dashboard__stat-card">
          <h3>Most Utilized Rooms</h3>
          <ul>
            {mostUtilizedRooms.map(r => (
              <li key={r.name}>{r.name}: {r.utilization}%</li>
            ))}
          </ul>
        </div>
        <div className="analytics-dashboard__stat-card">
          <h3>Least Utilized Rooms</h3>
          <ul>
            {leastUtilizedRooms.map(r => (
              <li key={r.name}>{r.name}: {r.utilization}%</li>
            ))}
          </ul>
        </div>
      </div>

      {/* --- Room-Level Metrics --- */}
      <div className="analytics-dashboard__charts-grid">
        <div className="analytics-dashboard__chart-card">
          <h3>Room Utilization Rate</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart layout="vertical" data={roomCapacityStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="utilization" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="analytics-dashboard__chart-card">
          <h3>Capacity vs. Actual Occupancy</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={roomCapacityStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="capacity" fill={COLORS.neutral} />
              <Bar dataKey="scheduled" fill={COLORS.success} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="analytics-dashboard__chart-card">
          <h3>Number of Teachers per Room</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={teachersPerRoom}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="room" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="teacherCount" fill={COLORS.warning} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="analytics-dashboard__chart-card">
          <h3>Room-to-Room Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarRoomData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis />
              <Radar name="Utilization" dataKey="utilization" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.6} />
              <Radar name="Teacher Count" dataKey="teacherCount" stroke={COLORS.warning} fill={COLORS.warning} fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- Time-Based Analysis --- */}
      <div className="analytics-dashboard__charts-grid">
        <div className="analytics-dashboard__chart-card">
          <h3>Hourly Utilization Patterns</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData.hourlyDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="classes" stroke={COLORS.primary} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="analytics-dashboard__chart-card">
          <h3>Daily/Weekly Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData.dailyDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="classes" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- Teacher Usage Patterns --- */}
      <div className="analytics-dashboard__charts-grid">
        <div className="analytics-dashboard__chart-card">
          <h3>Rooms per Teacher</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart layout="vertical" data={roomsPerTeacher}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="teacher" type="category" />
              <Tooltip />
              <Bar dataKey="roomCount" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="analytics-dashboard__chart-card">
          <h3>Total Teaching Hours per Teacher</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart layout="vertical" data={teachingHoursPerTeacher}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="teacher" type="category" />
              <Tooltip />
              <Bar dataKey="hours" fill={COLORS.success} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="analytics-dashboard__chart-card">
          <h3>Teacher Efficiency</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis dataKey="rooms" name="Rooms Used" />
              <YAxis dataKey="hours" name="Teaching Hours" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Teachers" data={teacherEfficiencyData} fill={COLORS.warning} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- Comparative Analysis --- */}
      <div className="analytics-dashboard__charts-grid">
        <div className="analytics-dashboard__chart-card">
          <h3>Utilization Distribution</h3>
          <PieChart width={300} height={250}>
            <Pie data={utilizationDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {utilizationDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

      {/* --- Key Insights --- */}
      <div className="analytics-dashboard__insights">
        <div className="analytics-dashboard__insights-header">
          <h3 className="analytics-dashboard__insights-title">Key Insights</h3>
        </div>
        <div className="analytics-dashboard__insights-grid">
          <div className="analytics-dashboard__insight-card">
            <h4>Underutilized Rooms</h4>
            <ul>
              {roomCapacityStats.filter(r => r.utilization < 30).map(r => (
                <li key={r.name}>{r.name}: {r.utilization}%</li>
              ))}
            </ul>
          </div>
          <div className="analytics-dashboard__insight-card">
            <h4>Peak Congestion Times</h4>
            <ul>
              {chartData.hourlyDistribution && [chartData.hourlyDistribution.reduce((a, b) => a.classes > b.classes ? a : b)].map((h, i) => (
                <li key={i}>{h.hour}: {h.classes} classes</li>
              ))}
            </ul>
          </div>
          <div className="analytics-dashboard__insight-card">
            <h4>Teacher Workload Distribution</h4>
            <ul>
              {teacherEfficiencyData.map(t => (
                <li key={t.teacher}>{t.teacher}: {t.hours} hrs, {t.rooms} rooms</li>
              ))}
            </ul>
          </div>
          <div className="analytics-dashboard__insight-card">
            <h4>Space Planning Opportunities</h4>
            <ul>
              {roomCapacityStats.filter(r => r.utilization < 20).map(r => (
                <li key={r.name}>{r.name} (Consider repurposing)</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;