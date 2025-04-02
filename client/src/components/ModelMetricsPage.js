// components/ModelMetricsPage.js
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import './ModelMetricsPage.css';

const ModelMetricsPage = ({ apiUrl }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch model metrics on component mount
  useEffect(() => {
    fetch(`${apiUrl}/api/model-metrics`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching model metrics:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [apiUrl]);
  
  // Format performance metrics for radar chart
  const formatPerformanceData = (metrics) => {
    if (!metrics) return [];
    
    return [
      { metric: 'Accuracy', value: metrics.accuracy * 100 },
      { metric: 'Precision', value: metrics.precision * 100 },
      { metric: 'Recall', value: metrics.recall * 100 },
      { metric: 'F1 Score', value: metrics.f1_score * 100 }
    ];
  };
  
  // Format feature importances for bar chart
  const formatFeatureImportances = (metrics) => {
    if (!metrics || !metrics.feature_importances) return [];
    
    // Sample feature names (should be provided by the backend in real implementation)
    const featureNames = [
      'Packet Length',
      'TTL',
      'Port Difference',
      'Protocol',
      'Source IP Class'
    ];
    
    // Map importances to feature names (limited to available names)
    return metrics.feature_importances
      .slice(0, featureNames.length)
      .map((importance, index) => ({
        feature: featureNames[index],
        importance: importance * 100  // Convert to percentage
      }))
      .sort((a, b) => b.importance - a.importance);
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}: ${payload[0].value.toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };
  
  if (loading) {
    return (
      <div className="model-metrics-page loading">
        <h2>Model Metrics</h2>
        <div className="loading-spinner">Loading metrics...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="model-metrics-page error">
        <h2>Model Metrics</h2>
        <div className="error-message">
          <p>Error loading model metrics: {error}</p>
          <p>Please make sure a model has been trained and is available.</p>
        </div>
      </div>
    );
  }
  
  if (!metrics) {
    return (
      <div className="model-metrics-page no-model">
        <h2>Model Metrics</h2>
        <div className="no-model-message">
          <p>No model metrics available.</p>
          <p>Please train a model first from the Training page.</p>
        </div>
      </div>
    );
  }
  
  const performanceData = formatPerformanceData(metrics);
  const featureImportances = formatFeatureImportances(metrics);
  
  return (
    <div className="model-metrics-page">
      <h2>Model Metrics</h2>
      
      <div className="metrics-card-container">
        <div className="metrics-card">
          <h3>Accuracy</h3>
          <div className="metric-value">{(metrics.accuracy * 100).toFixed(2)}%</div>
        </div>
        <div className="metrics-card">
          <h3>Precision</h3>
          <div className="metric-value">{(metrics.precision * 100).toFixed(2)}%</div>
        </div>
        <div className="metrics-card">
          <h3>Recall</h3>
          <div className="metric-value">{(metrics.recall * 100).toFixed(2)}%</div>
        </div>
        <div className="metrics-card">
          <h3>F1 Score</h3>
          <div className="metric-value">{(metrics.f1_score * 100).toFixed(2)}%</div>
        </div>
      </div>
      
      <div className="charts-container">
        <div className="chart-card">
          <h3>Model Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis domain={[0, 100]} axisLine={false} tick={{ fill: '#666' }} />
              <Radar name="Performance" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-card">
          <h3>Feature Importance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={featureImportances}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="feature" type="category" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="importance" fill="#82ca9d" name="Importance %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="model-info">
        <h3>Model Information</h3>
        <table className="info-table">
          <tbody>
            <tr>
              <th>Model Type:</th>
              <td>{metrics.model_type || 'Decision Tree'}</td>
            </tr>
            <tr>
              <th>Training Date:</th>
              <td>{metrics.training_date || 'Unknown'}</td>
            </tr>
            <tr>
              <th>Training Time:</th>
              <td>{metrics.training_time ? `${metrics.training_time.toFixed(2)} seconds` : 'Unknown'}</td>
            </tr>
            <tr>
              <th>Dataset Size:</th>
              <td>{metrics.dataset_size ? metrics.dataset_size.toLocaleString() : 'Unknown'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="confusion-matrix">
        <h3>Confusion Matrix</h3>
        {metrics.confusion_matrix ? (
          <table className="matrix-table">
            <thead>
              <tr>
                <th></th>
                <th>Predicted Normal</th>
                <th>Predicted Anomaly</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Actual Normal</th>
                <td className="true-negative">{metrics.confusion_matrix[0][0]}</td>
                <td className="false-positive">{metrics.confusion_matrix[0][1]}</td>
              </tr>
              <tr>
                <th>Actual Anomaly</th>
                <td className="false-negative">{metrics.confusion_matrix[1][0]}</td>
                <td className="true-positive">{metrics.confusion_matrix[1][1]}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p>Confusion matrix not available</p>
        )}
      </div>
    </div>
  );
};

export default ModelMetricsPage;