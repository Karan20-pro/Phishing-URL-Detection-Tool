import joblib
import os
from model_training import extract_features

class PhishingDetector:
    def __init__(self, model_path='models/phishing_model.pkl'):
        self.model_path = model_path
        self.model = None
        self.load_model()

    def load_model(self):
        """Loads the trained model from disk."""
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        else:
            print(f"Model not found at {self.model_path}. Please run model_training.py first.")

    def predict(self, url):
        """
        Takes a URL, extracts features, and predicts if it's phishing.
        Returns a dictionary with the prediction and extracted features.
        """
        if self.model is None:
            return {"error": "Model not loaded."}

        # 1. Extract features
        features = extract_features(url)
        
        # 2. Format features for the model (must match training feature order)
        feature_values = [
            features['length'],
            features['at_count'],
            features['hyphen_count'],
            features['double_slash_count'],
            features['dot_count'],
            features['has_https'],
            features['domain_age_days'],
            features['owner_hidden'],
            features['missing_dns']
        ]
        
        # 3. Predict
        # model.predict expects a 2D array, so we wrap feature_values in a list
        prediction = self.model.predict([feature_values])[0]
        
        # Get probability if supported by the model
        probability = 0.0
        if hasattr(self.model, "predict_proba"):
            probabilities = self.model.predict_proba([feature_values])[0]
            probability = probabilities[1] # Probability of class 1 (phishing)
            
        risk_score = round(probability * 100, 2)
        
        # Calculate 1 to 5 star rating based on risk score
        stars = 5
        if risk_score > 80:
            stars = 1
        elif risk_score > 60:
            stars = 2
        elif risk_score > 40:
            stars = 3
        elif risk_score > 20:
            stars = 4
            
        return {
            "url": url,
            "is_phishing": bool(prediction == 1),
            "risk_score": risk_score,
            "stars": stars,
            "features": features
        }

    def predict_batch(self, urls):
        """Predicts a batch of URLs."""
        return [self.predict(url) for url in urls]

# Example usage
if __name__ == "__main__":
    detector = PhishingDetector()
    test_urls = [
        "https://www.google.com",
        "http://secure-login-update.com/verify"
    ]
    
    results = detector.predict_batch(test_urls)
    for result in results:
        print(f"URL: {result['url']}")
        print(f"Result: {result}\n")
