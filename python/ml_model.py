import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import json
import os

class NetworkAnomalyDetector:
    """Detects network anomalies using machine learning algorithms."""
    
    def __init__(self, model_type='decision_tree'):
        self.model_type = model_type
        self.model = None
        self.preprocessor = None
        self.feature_importances = None
        
    def build_model(self):
        """Build and return the appropriate model based on model_type."""
        if self.model_type == 'decision_tree':
            self.model = DecisionTreeClassifier(
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42
            )
        elif self.model_type == 'random_forest':
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42
            )
        elif self.model_type == 'neural_network':
            # In a real implementation, this would use TensorFlow
            # For simplicity, we'll use random forest as a substitute
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
            
        return self.model
        
    def train(self, X_train, y_train, preprocessor=None):
        """Train the model on the training data."""
        if self.model is None:
            self.build_model()
            
        if preprocessor:
            self.preprocessor = preprocessor
            
        self.model.fit(X_train, y_train)
        
        # Store feature importances for interpretability
        if hasattr(self.model, 'feature_importances_'):
            self.feature_importances = self.model.feature_importances_
            
        return self
        
    def predict(self, X):
        """Make predictions on new data."""
        if self.model is None:
            raise ValueError("Model has not been trained yet")
            
        return self.model.predict(X)
            
    def predict_proba(self, X):
        """Return prediction probabilities."""
        if self.model is None:
            raise ValueError("Model has not been trained yet")
            
        if hasattr(self.model, 'predict_proba'):
            return self.model.predict_proba(X)
        else:
            # Fall back to regular predictions
            preds = self.predict(X)
            return np.column_stack((1-preds, preds))
            
    def evaluate(self, X_test, y_test):
        """Evaluate the model on test data."""
        if self.model is None:
            raise ValueError("Model has not been trained yet")
            
        y_pred = self.predict(X_test)
        
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred, zero_division=0),
            'recall': recall_score(y_test, y_pred, zero_division=0),
            'f1_score': f1_score(y_test, y_pred, zero_division=0)
        }
        
        return metrics
        
    def save_model(self, model_path, preprocessor_path=None):
        """Save the model and preprocessor to disk."""
        if self.model is None:
            raise ValueError("Model has not been trained yet")
            
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        joblib.dump(self.model, model_path)
            
        if preprocessor_path and self.preprocessor:
            joblib.dump(self.preprocessor, preprocessor_path)
            
        # Save feature importances if available
        if self.feature_importances is not None:
            importances_path = os.path.splitext(model_path)[0] + "_importances.json"
            with open(importances_path, 'w') as f:
                json.dump({
                    'feature_importances': self.feature_importances.tolist(),
                }, f)
                
        return True
        
    def load_model(self, model_path, preprocessor_path=None):
        """Load a trained model from disk."""
        self.model = joblib.load(model_path)
            
        if preprocessor_path:
            self.preprocessor = joblib.load(preprocessor_path)
            
        # Try to load feature importances if available
        importances_path = os.path.splitext(model_path)[0] + "_importances.json"
        if os.path.exists(importances_path):
            with open(importances_path, 'r') as f:
                importances_data = json.load(f)
                self.feature_importances = np.array(importances_data['feature_importances'])
                
        return self