import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import os

# 1. Feature Extraction Function
def extract_features(url):
    """
    Extracts features from a given URL for phishing detection.
    """
    features = {}
    features['length'] = len(url)
    features['at_count'] = url.count('@')
    features['hyphen_count'] = url.count('-')
    features['double_slash_count'] = url.count('//')
    features['dot_count'] = url.count('.')
    features['has_https'] = 1 if url.lower().startswith('https://') else 0
    
    # Mock advanced features for the dummy dataset
    char_sum = sum(ord(c) for c in url)
    
    features['domain_age_days'] = (char_sum * 17) % 3650
    if features['hyphen_count'] > 1 or features['length'] > 50:
        features['domain_age_days'] = (char_sum * 7) % 30
        
    features['owner_hidden'] = 1 if (char_sum % 3) == 0 or features['domain_age_days'] < 100 else 0
    features['missing_dns'] = 1 if (char_sum % 7) == 0 and features['domain_age_days'] < 50 else 0
    
    return features

# 2. Create a dummy dataset (since we don't have a real one to load)
def create_dummy_dataset():
    """
    Creates a small dummy dataset for demonstration purposes.
    In a real scenario, you would load this from a CSV file.
    """
    data = [
        {"url": "https://www.google.com", "label": 0},
        {"url": "http://secure-login-update.com/verify", "label": 1},
        {"url": "https://github.com/user/repo", "label": 0},
        {"url": "http://192.168.1.1/admin.php", "label": 1},
        {"url": "https://www.amazon.com/dp/B08F7PTF53", "label": 0},
        {"url": "http://paypal-update-account-info.com@10.0.0.1/login", "label": 1},
        {"url": "https://en.wikipedia.org/wiki/Phishing", "label": 0},
        {"url": "http://www.bankofamerica.com.login-update.info/", "label": 1},
        {"url": "https://twitter.com/home", "label": 0},
        {"url": "http://apple-id-verify-secure.com//login", "label": 1},
    ]
    
    # Extract features for each URL
    processed_data = []
    for item in data:
        features = extract_features(item['url'])
        features['label'] = item['label']
        processed_data.append(features)
        
    return pd.DataFrame(processed_data)

# 3. Train Model Function
def train_model():
    print("Creating dataset...")
    df = create_dummy_dataset()
    
    # In a real scenario, you would do:
    # df = pd.read_csv('phishing_dataset.csv')
    # df['features'] = df['url'].apply(extract_features)
    # ... expand features into columns ...
    
    X = df.drop('label', axis=1)
    y = df['label']
    
    print("Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {accuracy * 100:.2f}%")
    
    # Save the model
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/phishing_model.pkl')
    print("Model saved to models/phishing_model.pkl")
    
    return model

if __name__ == "__main__":
    train_model()
