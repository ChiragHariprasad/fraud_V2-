import redis
import numpy as np
import xgboost as xgb
import joblib
import pymongo
import signal
import sys
import json
import uuid
import time

# Signal handler for graceful shutdown
def signal_handler(sig, frame):
    print("\n🛑 Shutting down consumer...")
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Define the Redis stream key - this was missing in the original code
stream_key = "transactions"  # Replace with your actual stream key name

# Load XGBoost Model
try:
    model = joblib.load("xgboost_classifier.joblib")
    print("✅ XGBoost model loaded")
except Exception as e:
    print(f"⚠️ Failed to load XGBoost model: {e}")
    exit(1)

# Connect to Redis
try:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    r.ping()  # Verify connection is alive
    print("✅ Connected to Redis")
except Exception as e:
    print(f"⚠️ Redis connection failed: {e}")
    exit(1)

# Connect to MongoDB
try:
    mongo_client = pymongo.MongoClient("mongodb://localhost:27017/")
    db = mongo_client["RedisTransactions"]
    fraud_collection = db["fraud_transactions"]
    legit_collection = db["legit_transactions"]
    
    # Create counter collection if it doesn't exist
    if "counters" not in db.list_collection_names():
        db.create_collection("counters")
        db.counters.insert_one({"_id": "fraud_token", "sequence_value": 0})
    
    print("✅ Connected to MongoDB")
except Exception as e:
    print(f"⚠️ MongoDB connection failed: {e}")
    exit(1)

# Function to get the next fraud token
def get_next_fraud_token():
    result = db.counters.find_one_and_update(
        {"_id": "fraud_token"},
        {"$inc": {"sequence_value": 1}},
        return_document=pymongo.ReturnDocument.AFTER
    )
    return result["sequence_value"]

# Function to generate hex token for legitimate transactions
def generate_legit_token():
    return uuid.uuid4().hex

# Feature columns used by model
feature_cols = ['Amount', 'Active_Loans', 'Session_Time', 'Transactions_Per_Unit_Time', 
                'Velocity', 'High_Value_Transaction', 'Large_Transaction_Freq', 
                'Payment_Method', 'Device_Type']

print(f"🚦 Listening for transactions on Redis stream: {stream_key}...")
print("📊 Storing transactions in MongoDB collections 'fraud_transactions' and 'legit_transactions'")
last_id = '0-0'

while True:
    try:
        # Block until a new transaction arrives
        response = r.xread({stream_key: last_id}, block=0, count=1)

        if response:
            stream, messages = response[0]
            for msg_id, msg in messages:
                print(f"\nReceived Transaction ID: {msg_id}")
                try:
                    # Validate and extract features
                    missing_features = [k for k in feature_cols if k not in msg]
                    if missing_features:
                        print(f"⚠️ Missing features in message: {missing_features}")
                        continue
                    
                    # Store original transaction data
                    transaction_data = {k: msg[k] for k in msg}
                    transaction_data["stream_id"] = msg_id
                    transaction_data["processed_timestamp"] = time.time()
                    
                    # Prepare features for prediction - ensure proper type conversion
                    try:
                        features = [float(msg[k]) for k in feature_cols]
                        X = np.array([features])
                    except ValueError as ve:
                        print(f"⚠️ Error converting features to float: {ve}")
                        # Add type debugging info
                        for k in feature_cols:
                            print(f"Feature {k}: {msg[k]} (type: {type(msg[k])})")
                        continue
                    
                    # Predict fraud using XGBoost
                    pred = model.predict(X)[0]
                    prob = model.predict_proba(X)[0][1]
                    
                    # Add prediction results to the transaction data
                    transaction_data["fraud_prediction"] = int(pred)
                    transaction_data["fraud_probability"] = float(prob)
                    
                    # Store in appropriate MongoDB collection with tokens
                    if pred == 1:
                        # Add incremental fraud token
                        fraud_token = get_next_fraud_token()
                        transaction_data["fraud_token"] = fraud_token
                        result = fraud_collection.insert_one(transaction_data)
                        print(f"FRAUD Transaction (Confidence: {prob:.2f}) - Fraud Token: {fraud_token}")
                        print(f"Stored in MongoDB with ID: {result.inserted_id}")
                    else:
                        # Add hex token for legitimate transactions
                        legit_token = generate_legit_token()
                        transaction_data["legit_token"] = legit_token
                        result = legit_collection.insert_one(transaction_data)
                        print(f"LEGIT Transaction (Confidence: {1-prob:.2f}) - Legit Token: {legit_token}")
                        print(f"Stored in MongoDB with ID: {result.inserted_id}")
                    
                    # Create a copy of transaction data for display (excluding non-serializable fields)
                    display_data = transaction_data.copy()
                    
                    # Handle MongoDB ObjectId for JSON serialization
                    if '_id' in display_data:
                        display_data['_id'] = str(display_data['_id'])
                        
                    # Handle any other potential non-serializable objects
                    for key, value in display_data.items():
                        if hasattr(value, '__str__') and not isinstance(value, (str, int, float, bool, list, dict, type(None))):
                            display_data[key] = str(value)
                    
                    # Display transaction data
                    print(f"Transaction Details: {json.dumps(display_data, indent=2)}")

                    # Update last_id
                    last_id = msg_id

                except Exception as e:
                    print(f"⚠️ Error processing transaction: {e}")
                    import traceback
                    print(traceback.format_exc())
                    continue

    except KeyboardInterrupt:
        print("\n🛑 Shutting down consumer...")
        break
    except Exception as e:
        print(f"⚠️ Error reading from Redis stream: {e}")
        import traceback
        print(traceback.format_exc())
        # Try to reconnect to Redis after a short delay
        time.sleep(5)
        try:
            r = redis.Redis(host='localhost', port=6379, decode_responses=True)
            print("✅ Reconnected to Redis")
        except Exception as reconnect_error:
            print(f"⚠️ Failed to reconnect to Redis: {reconnect_error}")
            break