import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

class NetworkPacketPreprocessor:
    """Preprocesses network packets and extracts relevant features for anomaly detection."""
    
    def __init__(self, pcap_file=None):
        self.pcap_file = pcap_file
        self.raw_packets = []
        self.features_df = None
        self.scaler = StandardScaler()
        
    def load_packets(self, pcap_file=None):
        """Load packets from pcap file."""
        if pcap_file:
            self.pcap_file = pcap_file
        
        # In a real implementation, this would load packets using scapy
        # For now, we'll create a dummy implementation
        print(f"Loading packets from {self.pcap_file}")
        self.raw_packets = []  # This would normally contain actual packets
        print(f"Loaded 0 packets (dummy implementation)")
        return self.raw_packets
    
    def extract_features(self):
        """Extract features from raw packets."""
        # In a real implementation, this would extract features from packets
        # For now, we'll create a dummy implementation with sample data
        features = []
        for i in range(10):  # Create 10 dummy packets
            packet_features = {
                'length': 100 + i * 10,
                'time': 1600000000 + i,
                'src_ip': f"192.168.1.{i+1}",
                'dst_ip': f"10.0.0.{i+1}",
                'ttl': 64,
                'proto': 6,  # TCP
                'src_port': 12345 + i,
                'dst_port': 80,
                'tcp_flags': 16,  # ACK
                'transport_protocol': 'TCP'
            }
            features.append(packet_features)
        
        self.features_df = pd.DataFrame(features)
        return self.features_df
    
    def preprocess_features(self):
        """Preprocess features for machine learning."""
        if self.features_df is None:
            self.extract_features()
            
        # Handle missing values
        self.features_df.fillna(-1, inplace=True)
        
        # Create derived features
        self.features_df['port_difference'] = abs(
            self.features_df['src_port'].astype(float) - 
            self.features_df['dst_port'].astype(float)
        )
        
        # Extract IP-based features
        self.features_df['src_ip_class'] = self.features_df['src_ip'].apply(
            lambda x: 'private' if x and (
                x.startswith('10.') or 
                x.startswith('172.16.') or 
                x.startswith('192.168.')
            ) else 'public'
        )
        
        # Create pipeline for numerical and categorical features
        numeric_features = ['length', 'ttl', 'port_difference']
        categorical_features = ['transport_protocol', 'src_ip_class']
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), numeric_features),
                ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
            ])
        
        # Prepare feature matrix
        X = self.features_df[numeric_features + categorical_features]
        
        # Fit and transform
        X_processed = preprocessor.fit_transform(X)
        
        return X_processed, preprocessor
    
    def prepare_data_for_ml(self, test_size=0.2, random_state=42):
        """Prepare data for machine learning, including train-test split."""
        X_processed, preprocessor = self.preprocess_features()
        
        # For demonstration, we'll create a synthetic target variable
        y = np.random.randint(0, 2, size=X_processed.shape[0])
        
        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X_processed, y, test_size=test_size, random_state=random_state
        )
        
        return X_train, X_test, y_train, y_test, preprocessor