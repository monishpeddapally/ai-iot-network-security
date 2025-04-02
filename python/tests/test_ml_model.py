import unittest
import os
import sys

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the module to test
try:
    from ml_model import NetworkAnomalyDetector
except ImportError:
    # Print a more helpful message if the import fails
    print("Error: Could not import NetworkAnomalyDetector. Make sure the ml_model.py file exists in the parent directory.")
    raise

class TestNetworkAnomalyDetector(unittest.TestCase):
    
    def test_initialization(self):
        """Test that the detector initializes correctly"""
        detector = NetworkAnomalyDetector()
        self.assertIsNotNone(detector)
        self.assertEqual(detector.model_type, 'decision_tree')
        self.assertIsNone(detector.model)
        self.assertIsNone(detector.preprocessor)
        self.assertIsNone(detector.feature_importances)
    
    def test_build_model(self):
        """Test that the model builds correctly"""
        detector = NetworkAnomalyDetector()
        model = detector.build_model()
        self.assertIsNotNone(model)
        self.assertIsNotNone(detector.model)
    
    # More complex tests would require training data and would be added in a real implementation
    
    def test_dummy(self):
        """A dummy test that always passes"""
        self.assertTrue(True)

if __name__ == '__main__':
    unittest.main()