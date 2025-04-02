// components/TrainingPage.js
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './TrainingPage.css';

const TrainingPage = ({ apiUrl }) => {
  const [trainingStatus, setTrainingStatus] = useState('idle'); // idle, training, completed, failed
  const [trainingProgress, setTrainingProgress] = useState([]);
  const [trainingResults, setTrainingResults] = useState(null);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [datasetPath, setDatasetPath] = useState('');
  const [modelType, setModelType] = useState('decision_tree');
  const [testSize, setTestSize] = useState(0.2);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Socket.io connection for real-time updates
  useEffect(() => {
    // This would be handled in a real app with actual socket connection
    // For this example, we'll just simulate some progress
    
    const socket = {
      on: (event, callback) => {
        // Store the callbacks for simulation
        if (event === 'training-progress') {
          window._trainingProgressCallback = callback;
        } else if (event === 'training-complete') {
          window._trainingCompleteCallback = callback;
        } else if (event === 'training-error') {
          window._trainingErrorCallback = callback;
        }
      },
      off: () => {
        // Clean up callbacks
        window._trainingProgressCallback = null;
        window._trainingCompleteCallback = null;
        window._trainingErrorCallback = null;
      }
    };
    
    // Set up event listeners
    socket.on('training-progress', (data) => {
      setTrainingLogs(logs => [...logs, data.message]);
      
      // Update progress data for chart
      setTrainingProgress(prev => {
        const newProgress = [...prev];
        if (newProgress.length > 20) {
          newProgress.shift(); // Keep only the last 20 data points
        }
        newProgress.push({
          time: new Date().toISOString().substr(11, 8),
          progress: Math.min(100, newProgress.length * 5) // Simulate progress
        });
        return newProgress;
      });
    });
    
    socket.on('training-complete', (data) => {
      if (data.success) {
        setTrainingStatus('completed');
        setTrainingResults(data);
        setTrainingLogs(logs => [...logs, 'Training completed successfully']);
      } else {
        setTrainingStatus('failed');
        setErrorMessage(data.error || 'Training failed');
        setTrainingLogs(logs => [...logs, `Training failed: ${data.error}`]);
      }
    });
    
    socket.on('training-error', (data) => {
      setTrainingStatus('failed');
      setErrorMessage(data.error || 'Training error occurred');
      setTrainingLogs(logs => [...logs, `Error: ${data.error}`]);
    });
    
    // Cleanup
    return () => {
      socket.off();
    };
  }, []);
  
  // Handle form submission to start training
  const handleStartTraining = (e) => {
    e.preventDefault();
    
    if (!datasetPath) {
      setErrorMessage('Please enter a valid dataset path');
      return;
    }
    
    // Reset state
    setTrainingStatus('training');
    setTrainingProgress([]);
    setTrainingLogs([]);
    setTrainingResults(null);
    setErrorMessage('');
    
    // Log the start
    setTrainingLogs(['Starting model training...']);
    
    // Send training request to the API
    fetch(`${apiUrl}/api/train-model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datasetPath,
        modelType,
        testSize
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // The actual progress updates will come via WebSocket
        setTrainingLogs(logs => [...logs, 'Training job submitted successfully']);
        
        // Simulate some initial progress for demo purposes
        simulateTrainingProgress();
      })
      .catch(err => {
        console.error('Error starting model training:', err);
        setTrainingStatus('failed');
        setErrorMessage(`Error starting model training: ${err.message}`);
        setTrainingLogs(logs => [...logs, `Error: ${err.message}`]);
      });
  };
  
  // Simulate training progress for demo purposes
  const simulateTrainingProgress = () => {
    // Simulate loading data
    setTimeout(() => {
      if (window._trainingProgressCallback) {
        window._trainingProgressCallback({ message: 'Loading dataset...' });
      }
    }, 1000);
    
    // Simulate preprocessing
    setTimeout(() => {
      if (window._trainingProgressCallback) {
        window._trainingProgressCallback({ message: 'Preprocessing data...' });
      }
    }, 2000);
    
    // Simulate feature extraction
    setTimeout(() => {
      if (window._trainingProgressCallback) {
        window._trainingProgressCallback({ message: 'Extracting features from packets...' });
      }
    }, 3000);
    
    // Simulate training
    setTimeout(() => {
      if (window._trainingProgressCallback) {
        window._trainingProgressCallback({ message: 'Training model...' });
      }
    }, 4000);
    
    // Simulate evaluation
    setTimeout(() => {
      if (window._trainingProgressCallback) {
        window._trainingProgressCallback({ message: 'Evaluating model performance...' });
      }
    }, 5000);
    
    // Simulate completion
    setTimeout(() => {
      if (window._trainingCompleteCallback) {
        window._trainingCompleteCallback({
          success: true,
          message: 'Model training completed successfully',
          metrics: {
            accuracy: 0.92,
            precision: 0.89,
            recall: 0.87,
            f1_score: 0.88
          }
        });
      }
    }, 6000);
  };
  
  return (
    <div className="training-page">
      <h2>Model Training</h2>
      
      <div className="training-columns">
        <div className="training-form-column">
          <div className="training-form-container">
            <h3>Train New Model</h3>
            
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            
            <form onSubmit={handleStartTraining}>
              <div className="form-group">
                <label htmlFor="datasetPath">Dataset Path</label>
                <input
                  type="text"
                  id="datasetPath"
                  value={datasetPath}
                  onChange={(e) => setDatasetPath(e.target.value)}
                  placeholder="/path/to/network_traffic.pcap"
                  disabled={trainingStatus === 'training'}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="modelType">Model Type</label>
                <select
                  id="modelType"
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  disabled={trainingStatus === 'training'}
                >
                  <option value="decision_tree">Decision Tree</option>
                  <option value="random_forest">Random Forest</option>
                  <option value="neural_network">Neural Network</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="testSize">Test Split Size</label>
                <input
                  type="range"
                  id="testSize"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={testSize}
                  onChange={(e) => setTestSize(parseFloat(e.target.value))}
                  disabled={trainingStatus === 'training'}
                />
                <span className="range-value">{testSize * 100}%</span>
              </div>
              
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={trainingStatus === 'training' || !datasetPath}
                >
                  {trainingStatus === 'training' ? 'Training...' : 'Start Training'}
                </button>
              </div>
            </form>
          </div>
          
          {trainingResults && (
            <div className="training-results">
              <h3>Training Results</h3>
              <div className="results-grid">
                <div className="result-item">
                  <span className="result-label">Accuracy:</span>
                  <span className="result-value">{(trainingResults.metrics.accuracy * 100).toFixed(2)}%</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Precision:</span>
                  <span className="result-value">{(trainingResults.metrics.precision * 100).toFixed(2)}%</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Recall:</span>
                  <span className="result-value">{(trainingResults.metrics.recall * 100).toFixed(2)}%</span>
                </div>
                <div className="result-item">
                  <span className="result-label">F1 Score:</span>
                  <span className="result-value">{(trainingResults.metrics.f1_score * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="training-progress-column">
          <div className="progress-container">
            <h3>Training Progress</h3>
            
            <div className="status-indicator">
              <div className={`status-badge ${trainingStatus}`}>
                {trainingStatus === 'idle' && 'Ready'}
                {trainingStatus === 'training' && 'Training in Progress'}
                {trainingStatus === 'completed' && 'Training Completed'}
                {trainingStatus === 'failed' && 'Training Failed'}
              </div>
            </div>
            
            {trainingProgress.length > 0 && (
              <div className="progress-chart">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trainingProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="progress" stroke="#0088FE" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div className="progress-logs">
              <h4>Training Logs</h4>
              <div className="logs-container">
                {trainingLogs.length > 0 ? (
                  trainingLogs.map((log, index) => (
                    <div key={index} className="log-entry">
                      <span className="log-time">[{new Date().toISOString().substr(11, 8)}]</span>
                      <span className="log-message">{log}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-logs">No training logs yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;