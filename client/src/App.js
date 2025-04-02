// App.js
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import Dashboard from './components/Dashboard';
import TrainingPage from './components/TrainingPage';
import ModelMetricsPage from './components/ModelMetricsPage';
import SettingsPage from './components/SettingsPage';
import AlertsPage from './components/AlertsPage';
import './App.css';

// API and WebSocket configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const socket = io(API_URL);

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [monitorStatus, setMonitorStatus] = useState('stopped');
  const [monitorData, setMonitorData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [networkInterfaces, setNetworkInterfaces] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Fetch network interfaces
  useEffect(() => {
    fetch(`${API_URL}/api/network-interfaces`)
      .then(response => response.json())
      .then(data => {
        setNetworkInterfaces(data.networkInterfaces || []);
      })
      .catch(error => {
        console.error('Error fetching network interfaces:', error);
        setErrorMessage('Failed to fetch network interfaces');
      });
  }, []);
  
  // Connect to WebSocket
  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket');
    });
    
    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket');
    });
    
    socket.on('monitor-status', (data) => {
      setMonitorStatus(data.status);
      console.log('Monitor status:', data);
      
      if (data.status === 'stopped' && data.reason && data.reason !== 'Normal exit' && data.reason !== 'User requested stop') {
        setErrorMessage(`Monitor stopped: ${data.reason}`);
      }
    });
    
    socket.on('monitor-data', (data) => {
      setMonitorData(data);
      
      // Update alerts
      if (data.stats && data.stats.alerts && data.stats.alerts.length > 0) {
        setAlerts(prevAlerts => {
          // Combine alerts and remove duplicates based on timestamp
          const newAlerts = [...prevAlerts, ...data.stats.alerts];
          // Sort by timestamp in descending order
          return newAlerts
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            // Keep only the most recent 1000 alerts
            .slice(0, 1000);
        });
      }
    });
    
    socket.on('monitor-error', (data) => {
      console.error('Monitor error:', data);
      setErrorMessage(`Monitor error: ${data.error}`);
    });
    
    socket.on('training-progress', (data) => {
      console.log('Training progress:', data);
    });
    
    socket.on('training-error', (data) => {
      console.error('Training error:', data);
      setErrorMessage(`Training error: ${data.error}`);
    });
    
    socket.on('training-complete', (data) => {
      console.log('Training complete:', data);
    });
    
    // Clean up socket connection on component unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('monitor-status');
      socket.off('monitor-data');
      socket.off('monitor-error');
      socket.off('training-progress');
      socket.off('training-error');
      socket.off('training-complete');
    };
  }, []);
  
  // Start monitor
  const startMonitor = useCallback((interfaceName = 'eth0') => {
    fetch(`${API_URL}/api/start-monitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interfaceName }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Start monitor response:', data);
        if (data.error) {
          setErrorMessage(`Failed to start monitor: ${data.error}`);
        } else {
          setErrorMessage('');
        }
      })
      .catch(error => {
        console.error('Error starting monitor:', error);
        setErrorMessage(`Failed to start monitor: ${error.message}`);
      });
  }, []);
  
  // Stop monitor
  const stopMonitor = useCallback(() => {
    fetch(`${API_URL}/api/stop-monitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
        console.log('Stop monitor response:', data);
        if (data.error) {
          setErrorMessage(`Failed to stop monitor: ${data.error}`);
        } else {
          setErrorMessage('');
        }
      })
      .catch(error => {
        console.error('Error stopping monitor:', error);
        setErrorMessage(`Failed to stop monitor: ${error.message}`);
      });
  }, []);
  
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>IoT Network Security Monitor</h1>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="monitor-status">
            Monitor: <span className={`status-text ${monitorStatus}`}>{monitorStatus}</span>
            {monitorStatus === 'stopped' ? (
              <button 
                className="start-button"
                onClick={() => startMonitor(networkInterfaces[0] || 'eth0')}
                disabled={!isConnected}
              >
                Start
              </button>
            ) : (
              <button 
                className="stop-button"
                onClick={stopMonitor}
                disabled={!isConnected}
              >
                Stop
              </button>
            )}
          </div>
        </header>
        
        <nav className="app-nav">
          <ul>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/alerts">Alerts</Link></li>
            <li><Link to="/training">Training</Link></li>
            <li><Link to="/metrics">Model Metrics</Link></li>
            <li><Link to="/settings">Settings</Link></li>
          </ul>
        </nav>
        
        {errorMessage && (
          <div className="error-banner">
            <p>{errorMessage}</p>
            <button onClick={() => setErrorMessage('')}>Dismiss</button>
          </div>
        )}
        
        <main className="app-content">
          <Routes>
            <Route path="/" element={
              <Dashboard 
                monitorData={monitorData} 
                monitorStatus={monitorStatus}
                alerts={alerts.slice(0, 10)} // Only pass the 10 most recent alerts
              />
            } />
            <Route path="/alerts" element={
              <AlertsPage alerts={alerts} />
            } />
            <Route path="/training" element={
              <TrainingPage apiUrl={API_URL} />
            } />
            <Route path="/metrics" element={
              <ModelMetricsPage apiUrl={API_URL} />
            } />
            <Route path="/settings" element={
              <SettingsPage 
                apiUrl={API_URL}
                networkInterfaces={networkInterfaces}
                startMonitor={startMonitor}
                monitorStatus={monitorStatus}
              />
            } />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <p>AI-Powered IoT Network Security System &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;