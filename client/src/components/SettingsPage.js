// components/SettingsPage.js
import React, { useState } from 'react';
import './SettingsPage.css';

const SettingsPage = ({ apiUrl, networkInterfaces, startMonitor, monitorStatus }) => {
  const [selectedInterface, setSelectedInterface] = useState(networkInterfaces[0] || 'eth0');
  const [datasetPath, setDatasetPath] = useState('');
  const [modelType, setModelType] = useState('decision_tree');
  const [threshold, setThreshold] = useState(0.5);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Save settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    
    // Display success message
    setSavedMessage('Settings saved successfully');
    setErrorMessage('');
    
    // Clear the message after a few seconds
    setTimeout(() => {
      setSavedMessage('');
    }, 3000);
  };
  
  // Start monitoring with selected interface
  const handleStartMonitoring = () => {
    startMonitor(selectedInterface);
    setSavedMessage(`Started monitoring on interface ${selectedInterface}`);
    
    // Clear the message after a few seconds
    setTimeout(() => {
      setSavedMessage('');
    }, 3000);
  };
  
  // Handle training a new model
  const handleTrainModel = (e) => {
    e.preventDefault();
    
    if (!datasetPath) {
      setErrorMessage('Please enter a valid dataset path');
      return;
    }
    
    // Clear previous messages
    setSavedMessage('');
    setErrorMessage('');
    
    // Send training request to the API
    fetch(`${apiUrl}/api/train-model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datasetPath,
        modelType
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setSavedMessage('Model training started. This may take some time.');
      })
      .catch(err => {
        console.error('Error starting model training:', err);
        setErrorMessage(`Error starting model training: ${err.message}`);
      });
  };
  
  return (
    <div className="settings-page">
      <h2>System Settings</h2>
      
      {savedMessage && <div className="saved-message">{savedMessage}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      
      <div className="settings-sections">
        <div className="settings-section">
          <h3>Monitoring Settings</h3>
          <form onSubmit={handleSaveSettings}>
            <div className="form-group">
              <label htmlFor="interface">Network Interface</label>
              <select
                id="interface"
                value={selectedInterface}
                onChange={(e) => setSelectedInterface(e.target.value)}
              >
                {networkInterfaces.length > 0 ? (
                  networkInterfaces.map(iface => (
                    <option key={iface} value={iface}>{iface}</option>
                  ))
                ) : (
                  <option value="eth0">eth0</option>
                )}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="threshold">Detection Threshold</label>
              <input
                type="range"
                id="threshold"
                min="0"
                max="1"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
              />
              <span className="threshold-value">{threshold}</span>
            </div>
            
            <div className="form-actions">
              <button type="submit">Save Settings</button>
              <button
                type="button"
                className="start-button"
                onClick={handleStartMonitoring}
                disabled={monitorStatus === 'running'}
              >
                Start Monitoring
              </button>
            </div>
          </form>
        </div>
        
        <div className="settings-section">
          <h3>Model Training</h3>
          <form onSubmit={handleTrainModel}>
            <div className="form-group">
              <label htmlFor="datasetPath">Dataset Path</label>
              <input
                type="text"
                id="datasetPath"
                value={datasetPath}
                onChange={(e) => setDatasetPath(e.target.value)}
                placeholder="/path/to/network_traffic.pcap"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="modelType">Model Type</label>
              <select
                id="modelType"
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
              >
                <option value="decision_tree">Decision Tree</option>
                <option value="random_forest">Random Forest</option>
                <option value="neural_network">Neural Network</option>
              </select>
            </div>
            
            <div className="form-actions">
              <button type="submit">Train New Model</button>
            </div>
          </form>
        </div>
        
        <div className="settings-section">
          <h3>Notification Settings</h3>
          <form onSubmit={handleSaveSettings}>
            <div className="form-group">
              <label htmlFor="email">Email for Alerts</label>
              <input
                type="email"
                id="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="security@example.com"
              />
            </div>
            
            <div className="form-group checkboxes">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                Send email for high severity alerts
              </label>
              
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                Send email for medium severity alerts
              </label>
              
              <label className="checkbox-label">
                <input type="checkbox" />
                Send email for low severity alerts
              </label>
              
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                Send daily summary report
              </label>
            </div>
            
            <div className="form-actions">
              <button type="submit">Save Notification Settings</button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="system-info">
        <h3>System Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">System Status:</span>
            <span className={`status-badge ${monitorStatus}`}>
              {monitorStatus.charAt(0).toUpperCase() + monitorStatus.slice(1)}
            </span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Current Interface:</span>
            <span className="info-value">{selectedInterface}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Model Type:</span>
            <span className="info-value">Decision Tree</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Model Last Updated:</span>
            <span className="info-value">Today at 10:45 AM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;