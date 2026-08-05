require('dotenv').config();
const express = require('express');
const cors = require('cors');

const employeesRouter = require('./routes/employees');
const attendanceRouter = require('./routes/attendance');
const leaveRouter = require('./routes/leave');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/employees', employeesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/leave', leaveRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`Ambo Attendance API running on port ${PORT}`);
});
