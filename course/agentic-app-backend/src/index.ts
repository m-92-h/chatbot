import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.route.ts';
import customerRoutes from './routes/customer.route.ts';
import orderRoutes from './routes/order.route.ts';
import weatherRoutes from './routes/weather.route.ts';
import mcpRoutes from './routes/mcp-server.route.ts';
import agentRoutes from './routes/agent.route.ts';
import connectToMongoDB from './config/mongodb.ts';

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Sample route
app.get('/', (req, res) => {
  res.send('Hello, Agentic App Backend Started!');
});

// Routes
app.use('/api/chatWithLlm', chatRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/weather', weatherRoutes);

app.use('/api/chat', agentRoutes);

// mount mcp server on /mcp route
app.use('/mcp', mcpRoutes);

const PORT: number = Number(process.env.PORT) || 3000;

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

async function startServer() {
  try {
    // connect to MongoDB
    await connectToMongoDB();

    // start the server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();


