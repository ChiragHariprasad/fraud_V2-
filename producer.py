import redis
import pandas as pd
import time

# Connect to Redis
r = redis.Redis(host='localhost', port=6379)

# Define the stream key - make sure this matches the one in the consumer
stream_key = "transactions"

# Load dataset
try:
    df = pd.read_csv('final_fraud_dataset.csv')
    print(f"✅ Loaded dataset with {len(df)} records")
    df = df.sample(frac=1).reset_index(drop=True)  # Shuffle
    print("✅ Shuffled dataset")
except Exception as e:
    print(f"⚠️ Error loading dataset: {e}")
    exit(1)

# Encode categorical variables
try:
    df = df.replace({
        'Payment_Method': {'Credit Card': 0, 'Debit Card': 1, 'UPI': 2, 'Net Banking': 3, 'Wallet': 4},
        'Device_Type': {'Mobile': 0, 'PC': 1, 'Tablet': 2}
    })
    print("✅ Encoded categorical variables")
except Exception as e:
    print(f"⚠️ Error encoding categorical variables: {e}")
    exit(1)

# Select features
feature_cols = ['Amount', 'Active_Loans', 'Session_Time', 'Transactions_Per_Unit_Time', 
                'Velocity', 'High_Value_Transaction', 'Large_Transaction_Freq', 
                'Payment_Method', 'Device_Type']

# Validate features exist in dataframe
missing_cols = [col for col in feature_cols if col not in df.columns]
if missing_cols:
    print(f"⚠️ Missing columns in dataset: {missing_cols}")
    print(f"Available columns: {df.columns.tolist()}")
    exit(1)

X = df[feature_cols]
print(f"✅ Selected {len(feature_cols)} features for transactions")

# Preprocess for sending
def format_transaction(row):
    # Convert all values to strings to avoid type issues
    transaction = {col: str(row[col]) for col in feature_cols}
    return transaction

# Push transactions to Redis Stream
print(f"🚀 Starting to send transactions to Redis stream '{stream_key}'...")
print(f"🔄 Will send {len(df)} transactions with 1 second delay between each")

try:
    for idx, row in df[feature_cols].iterrows():
        transaction = format_transaction(row)
        # Add transaction to the Redis stream
        msg_id = r.xadd(stream_key, transaction)
        print(f"✅ Sent transaction #{idx+1}/{len(df)} - Stream ID: {msg_id.decode('utf-8')}")
        print(f"   Data: {transaction}")
        
        # Simulate delay between transactions
        time.sleep(1)
    
    print(f"✅ Successfully sent all {len(df)} transactions to Redis stream")
except KeyboardInterrupt:
    print("\n🛑 Transaction sending interrupted by user")
except Exception as e:
    print(f"⚠️ Error sending transactions: {e}")
    import traceback
    print(traceback.format_exc())