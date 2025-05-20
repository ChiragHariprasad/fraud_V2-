import express from "express";
import http from "http";
import { Server } from "socket.io";
import { MongoClient } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://dashboard.080405.tech"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://dashboard.080405.tech"
  ],
  credentials: true,
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => res.send('OK'));

const PORT = Number(process.env.PORT) || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = "RedisTransactions";
const FRAUD_COLLECTION = "fraud_transactions";
const LEGIT_COLLECTION = "legit_transactions";

console.log(`Using PORT: ${PORT}, MongoDB URI: ${MONGO_URI}`);

MongoClient.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then((client) => {
    const db = client.db(DB_NAME);
    const fraudCollection = db.collection(FRAUD_COLLECTION);
    const legitCollection = db.collection(LEGIT_COLLECTION);

    console.log("✅ Connected to MongoDB");

    const fraudChangeStream = fraudCollection.watch([], { fullDocument: "updateLookup" });
    fraudChangeStream.on("change", (change) => {
      if (change.operationType === "insert") {
        const txn = change.fullDocument;
        io.emit("new_transaction", txn);
        console.log("📡 New fraud transaction broadcasted:", txn._id);
      }
    });

    const legitChangeStream = legitCollection.watch([], { fullDocument: "updateLookup" });
    legitChangeStream.on("change", (change) => {
      if (change.operationType === "insert") {
        const txn = change.fullDocument;
        io.emit("new_transaction", txn);
        console.log("📡 New legit transaction broadcasted:", txn._id);
      }
    });

    // Get latest 50 transactions
    app.get("/api/transactions", async (req, res) => {
      try {
        const fraudTransactions = await fraudCollection
          .find({})
          .sort({ processed_timestamp: -1 })
          .limit(50)
          .toArray();

        const legitTransactions = await legitCollection
          .find({})
          .sort({ processed_timestamp: -1 })
          .limit(50)
          .toArray();

        const transactions = [...fraudTransactions, ...legitTransactions];
        res.json(transactions);
      } catch (err) {
        console.error("❌ Failed to fetch transactions:", err);
        res.status(500).send("Internal Server Error");
      }
    });

    // Return transaction statistics
    app.get("/api/stats", async (req, res) => {
      try {
        const fraudCount = await fraudCollection.countDocuments();
        const legitCount = await legitCollection.countDocuments();
        const total = fraudCount + legitCount;

        res.json({
          totalTransactions: total,
          fraudulentTransactions: fraudCount,
          legitimateTransactions: legitCount,
        });
      } catch (err) {
        console.error("❌ Failed to fetch stats:", err);
        res.status(500).send("Internal Server Error");
      }
    });

  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// WebSocket connection
io.on("connection", (socket) => {
  console.log("🔌 WebSocket client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ WebSocket client disconnected:", socket.id);
  });
});

// Start server with explicit binding to 0.0.0.0
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
