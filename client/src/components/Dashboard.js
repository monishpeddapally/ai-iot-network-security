// components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import './Dashboard.css';

// Custom colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const SEVERITY_COLORS = {
  low: '#FFBB28',
  medium: '#FF8042',
  high: '#FF0000'
};

const Dashboard = ({ monitorData, monitorStatus, alerts }) => {
  const [packetData, setPacketData] = useState([]);
  const [anomalyData, setAnomalyData] = useState([]);
  const [protocolData, setProtocolData] = useState([]);
  const [severityData, setSeverityData] = useState([]);
  const [stats, setStats] = useState({
    totalPackets: 0,
    anomaliesDetected: 0,
    uptime: 0,
    detectionRate: 0
  });
  
  // Process monitor data when it changes
  useEffect(() => {
    if (monitorData && monitorData.stats) {
      const { stats, recent_results } = monitorData;
      
      // Update basic stats
      setStats({
        totalPackets: stats.total_packets || 0,
        anomaliesDetected: stats.anomalies_detected || 0,
        uptime: stats.uptime || 0,
        detectionRate: stats.total_packets ? 
          (stats.anomalies_detected / stats.total_packets * 100).toFixed(2) : 0
      });
      
      // Process time-series data for packets and anomalies
      if (recent_results && recent_results.length > 0) {
        // Get the last 20 data points for the charts
        const recentData = recent_results.slice(-20);
        
        // Format data for packet chart
        setPacketData(recentData.map(item => ({
          time: item.timestamp,
          packets: item.packets_processed
        })));
        
        // Format data for anomaly chart
        setAnomalyData(recentData.map(item => ({
          time: item.timestamp,
          anomalies: item.anomalies_detected,
          confidence: item.avg_anomaly_confidence * 100
        })));
      }
      
      // Process protocol distribution data
      if (stats.alerts && stats.alerts.length > 0) {
        const protocols = {};
        const severities = { low: 0, medium: 0, high: 0 };
        
        stats.alerts.forEach(alert => {
          // Count by protocol
          const protocol = alert.protocol || 'Unknown';
          protocols[protocol] = (protocols[protocol] || 0) + 1;
          
          // Count by severity
          const severity = alert.severity || 'low';
          severities[severity] += 1;
        });
        
        // Format for PieChart
        setProtocolData(
          Object.entries(protocols).map(([name, value]) => ({ name, value }))
        );
        
        setSeverityData(
          Object.entries(severities).map(([name, value]) => ({ name, value }))
        );
      }
    }
  }, [monitorData]);
  
  // Format time for display
  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="dashboard">
      <h2>Network Security Dashboard</h2>
      
      {monitorStatus === 'stopped' ? (
        <div className="not-running-message">
          <h3>Monitoring is not currently active</h3>
          <p>Start monitoring from the header controls to view real-time data.</p>
        </div>
      ) : (
        <>
          <div className="stats-cards">
            <div className="stat-card">
              <h3>Total Packets</h3>
              <div className="stat-value">{stats.totalPackets.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <h3>Anomalies Detected</h3>
              <div className="stat-value">{stats.anomaliesDetected.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <h3>Detection Rate</h3>
              <div className="stat-value">{stats.detectionRate}%</div>
            </div>
            <div className="stat-card">
              <h3>Uptime</h3>
              <div className="stat-value">{formatUptime(stats.uptime)}</div>
            </div>
          </div>
          
          <div className="charts-grid">
            <div className="chart-container">
              <h3>Packet Processing Rate</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={packetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="packets" stroke="#0088FE" fill="#0088FE" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-container">
              <h3>Anomaly Detection</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={anomalyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="anomalies" stroke="#FF8042" name="Anomalies" />
                  <Line yAxisId="right" type="monotone" dataKey="confidence" stroke="#8884d8" name="Confidence %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-container">
              <h3>Protocol Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={protocolData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {protocolData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-container">
              <h3>Alert Severity</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Count">
                    {severityData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={SEVERITY_COLORS[entry.name] || '#8884d8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="recent-alerts">
            <h3>Recent Alerts</h3>
            {alerts && alerts.length > 0 ? (
              <table className="alerts-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Source</th>
                    <th>Destination</th>
                    <th>Protocol</th>
                    <th>Severity</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert, index) => (
                    <tr key={index} className={`severity-${alert.severity}`}>
                      <td>{alert.timestamp}</td>
                      <td>{`${alert.src_ip}:${alert.src_port}`}</td>
                      <td>{`${alert.dst_ip}:${alert.dst_port}`}</td>
                      <td>{alert.protocol || 'Unknown'}</td>
                      <td>{alert.severity}</td>
                      <td>{(alert.confidence * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No alerts detected yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;