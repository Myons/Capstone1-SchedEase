import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
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

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create queries
        const schedulesQuery = query(
          collection(db, "schedules"),
          orderBy("startTime", "asc"),
          limit(1000)
        );
        
        const teachersQuery = query(collection(db, "teachers"));
        const roomsQuery = query(collection(db, "rooms"));
        const sectionsQuery = query(collection(db, "sections"));
        
        // Subscribe to schedules
        const unsubscribeSchedules = onSnapshot(schedulesQuery, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSchedules(data);
        });
        
        // Fetch other collections
        const [teachersSnap, roomsSnap, sectionsSnap] = await Promise.all([
          getDocs(teachersQuery),
          getDocs(roomsQuery),
          getDocs(sectionsQuery)
        ]);
        
        setTeachers(teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setRooms(roomsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setSections(sectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        setIsLoading(false);
        
        return () => unsubscribeSchedules();
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

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

      {/* Stats Grid */}
      <div className="analytics-dashboard__stats-grid">
        {stats && Object.entries(stats).map(([key, stat]) => (
          <div key={key} className="analytics-dashboard__stat-card">
            <div className="analytics-dashboard__stat-header">
              <div className="analytics-dashboard__stat-icon">
                {key === "totalClasses" && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </svg>
                )}
                {key === "activeTeachers" && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )}
                {key === "activeRooms" && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                )}
                {key === "avgClassesPerDay" && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                )}
              </div>
              <h3 className="analytics-dashboard__stat-title">
                {key === "totalClasses" && "Total Classes"}
                {key === "activeTeachers" && "Active Teachers"}
                {key === "activeRooms" && "Active Rooms"}
                {key === "avgClassesPerDay" && "Avg. Classes/Day"}
              </h3>
            </div>
            <p className="analytics-dashboard__stat-value">{stat.value}</p>
            <div className={`analytics-dashboard__stat-trend ${stat.isPositive ? "analytics-dashboard__trend--positive" : "analytics-dashboard__trend--negative"}`}>
              {stat.isPositive ? "↑" : "↓"} {stat.trend} from last {timeRange}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="analytics-dashboard__charts-grid">
        {/* Teacher Workload Distribution */}
        <div className="analytics-dashboard__chart-card">
          <div className="analytics-dashboard__chart-header">
            <h3 className="analytics-dashboard__chart-title">Teacher Workload Distribution</h3>
          </div>
          <div className="analytics-dashboard__chart-content">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.teacherLoad}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'Classes', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Utilization */}
        <div className="analytics-dashboard__chart-card">
          <div className="analytics-dashboard__chart-header">
            <h3 className="analytics-dashboard__chart-title">Room Utilization</h3>
          </div>
          <div className="analytics-dashboard__chart-content">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.roomUtilization}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="utilization" fill={COLORS.warning} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="analytics-dashboard__chart-card analytics-dashboard__chart--full-width">
          <div className="analytics-dashboard__chart-header">
            <h3 className="analytics-dashboard__chart-title">Hourly Class Distribution</h3>
          </div>
          <div className="analytics-dashboard__chart-content">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="classes" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Distribution */}
        <div className="analytics-dashboard__chart-card analytics-dashboard__chart--full-width">
          <div className="analytics-dashboard__chart-header">
            <h3 className="analytics-dashboard__chart-title">Classes Per Day</h3>
          </div>
          <div className="analytics-dashboard__chart-content">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.dailyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="classes" fill={COLORS.success} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      {insights && (
        <div className="analytics-dashboard__insights">
          <div className="analytics-dashboard__insights-header">
            <h3 className="analytics-dashboard__insights-title">Key Insights</h3>
          </div>
          
          <div className="analytics-dashboard__insights-grid">
            <div className="analytics-dashboard__insight-card">
              <div className="analytics-dashboard__insight-header">
                <svg className="analytics-dashboard__insight-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <h4 className="analytics-dashboard__insight-title">Resource Utilization</h4>
              </div>
              <ul className="analytics-dashboard__insight-list">
                {insights.resourceUtilization.map((insight, index) => (
                  <li key={index} className="analytics-dashboard__insight-item">
                    {insight.text}: <span className="analytics-dashboard__insight-value">{insight.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="analytics-dashboard__insight-card">
              <div className="analytics-dashboard__insight-header">
                <svg className="analytics-dashboard__insight-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <h4 className="analytics-dashboard__insight-title">Schedule Balance</h4>
              </div>
              <ul className="analytics-dashboard__insight-list">
                {insights.scheduleBalance.map((insight, index) => (
                  <li key={index} className="analytics-dashboard__insight-item">
                    {insight.text}: <span className="analytics-dashboard__insight-value">{insight.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;