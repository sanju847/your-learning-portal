import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// In-Memory Database (Aapka Data)
let userData = {
  leaveBalance: 12,
  leavesTaken: 0,
  daysPresent: 0,
  logs: []
};

// API: Get Current Status
app.get('/api/status', (req, res) => {
  res.json(userData);
});

// API: Mark Attendance / Leave
app.post('/api/attendance', (req, res) => {
  const { type, reason } = req.body;
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (type === 'Leave') {
    if (userData.leaveBalance <= 0) {
      return res.status(400).json({ error: 'No leaves left!' });
    }
    userData.leaveBalance--;
    userData.leavesTaken++;
  } else {
    userData.daysPresent++;
  }

  userData.logs.unshift({ id: Date.now(), date, type, reason: reason || 'Regular Check-in' });
  res.json(userData);
});

app.listen(5000, () => console.log('🚀 Backend running on http://localhost:5000'));