// components/AlertsPage.js
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import './AlertsPage.css';

// Custom colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const SEVERITY_COLORS = {
  low: '#FFBB28',
  medium: '#FF8042',
  high: '#FF0000'
};

const AlertsPage = ({ alerts }) => {
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [protocolFilter, setProtocolFilter] = useState('all');
  const [analytics, setAnalytics] = useState({
    alertsByHour: [],
    alertsBySeverity: [],
    alertsByProtocol: []
  });
  const [uniqueProtocols, setUniqueProtocols] = useState([]);
  
  // Process alerts data when it changes
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      // Extract unique protocols for filtering
      const protocols = [...new Set(alerts.map(alert => alert.protocol || 'Unknown'))];
      setUniqueProtocols(protocols);
      
      // Apply filters and sorting
      applyFiltersAndSort();
      
      // Generate analytics data
      generateAnalytics();
    }
  }, [alerts, searchTerm, sortBy, sortDirection, severityFilter, protocolFilter]);
  
  // Apply filters and sorting to alerts
  const applyFiltersAndSort = () => {
    let filtered = [...alerts];
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(alert =>
        (alert.src_ip && alert.src_ip.toLowerCase().includes(term)) ||
        (alert.dst_ip && alert.dst_ip.toLowerCase().includes(term)) ||
        (alert.protocol && alert.protocol.toLowerCase().includes(term))
      );
    }
    
    // Apply severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }
    
    // Apply protocol filter
    if (protocolFilter !== 'all') {
      filtered = filtered.filter(alert => 
        (alert.protocol || 'Unknown') === protocolFilter
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = new Date(a.timestamp) - new Date(b.timestamp);
          break;
        case 'severity':
          const severityOrder = { high: 3, medium: 2, low: 1 };
          comparison = (severityOrder[a.severity] || 0) - (severityOrder[b.severity] || 0);
          break;
        case 'confidence':
          comparison = a.confidence - b.confidence;
          break;
        case 'srcip':
          comparison = (a.src_ip || '').localeCompare(b.src_ip || '');
          break;
        case 'dstip':
          comparison = (a.dst_ip || '').localeCompare(b.dst_ip || '');
          break;
        case 'protocol':
          comparison = (a.protocol || '').localeCompare(b.protocol || '');
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredAlerts(filtered);
  };
  
  // Generate analytics data from alerts
  const generateAnalytics = () => {
    // Group alerts by hour
    const hourlyData = {};
    const severityData = { low: 0, medium: 0, high: 0 };
    const protocolData = {};
    
    alerts.forEach(alert => {
      // Process hourly data
      const date = new Date(alert.timestamp);
      const hour = date.getHours();
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
      
      // Process severity data
      severityData[alert.severity] = (severityData[alert.severity] || 0) + 1;
      
      // Process protocol data
      const protocol = alert.protocol || 'Unknown';
      protocolData[protocol] = (protocolData[protocol] || 0) + 1;
    });
    
    // Format hourly data for chart
    const alertsByHour = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourlyData[i] || 0
    }));
    
    // Format severity data for chart
    const alertsBySeverity = Object.entries(severityData).map(([name, value]) => ({
      name,
      value
    }));
    
    // Format protocol data for chart
    const alertsByProtocol = Object.entries(protocolData).map(([name, value]) => ({
      name,
      value
    }));
    
    setAnalytics({
      alertsByHour,
      alertsBySeverity,
      alertsByProtocol
    });
  };
  
  // Handle sort column click
  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle direction if same column clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending
      setSortBy(column);
      setSortDirection('desc');
    }
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="alerts-page">
      <h2>Security Alerts</h2>
      
      {alerts.length === 0 ? (
        <div className="no-alerts">
          <h3>No alerts detected yet</h3>
          <p>Start the monitoring system to begin collecting alert data.</p>
        </div>
      ) : (
        <>
          <div className="alerts-summary">
            <div className="alert-count">
              <h3>Total Alerts</h3>
              <div className="count">{alerts.length}</div>
            </div>
            
            <div className="alerts-charts">
              <div className="chart-container">
                <h3>Alerts by Hour</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analytics.alertsByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" stroke="#0088FE" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="chart-container">
                <h3>Alerts by Severity</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics.alertsBySeverity}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {analytics.alertsBySeverity.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={SEVERITY_COLORS[entry.name] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="alerts-filters">
            <div className="search-filter">
              <input
                type="text"
                placeholder="Search by IP or protocol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="select-filters">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              <select
                value={protocolFilter}
                onChange={(e) => setProtocolFilter(e.target.value)}
              >
                <option value="all">All Protocols</option>
                {uniqueProtocols.map(protocol => (
                  <option key={protocol} value={protocol}>{protocol}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="alerts-table-container">
            <table className="alerts-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('timestamp')}>
                    Time {sortBy === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('srcip')}>
                    Source {sortBy === 'srcip' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('dstip')}>
                    Destination {sortBy === 'dstip' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('protocol')}>
                    Protocol {sortBy === 'protocol' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('severity')}>
                    Severity {sortBy === 'severity' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('confidence')}>
                    Confidence {sortBy === 'confidence' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert, index) => (
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
          </div>
        </>
      )}
    </div>
  );
};

export default AlertsPage;