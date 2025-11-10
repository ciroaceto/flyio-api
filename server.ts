import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase, getLoads, getLoadById, insertCall, getDashboardData } from './database';

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error('ERROR: API_KEY environment variable is not set');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// API key authentication middleware
function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip authentication for dashboard endpoint
  if (req.originalUrl === '/api/dashboard' || req.path === '/dashboard') {
    next();
    return;
  }
  
  const providedKey = req.headers['x-api-key'];
  
  if (!providedKey || providedKey !== API_KEY) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
    return;
  }
  
  next();
}

// Apply API key middleware to all API routes
app.use('/api', apiKeyMiddleware);

// API Routes
app.get('/api/loads', async (req: Request, res: Response) => {
  try {
    const origin = req.query.origin as string | undefined;
    const destination = req.query.destination as string | undefined;
    
    const loads = await getLoads(origin, destination);
    res.json(loads);
  } catch (error) {
    console.error('Error fetching loads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/negotiate', async (req: Request, res: Response) => {
  try {
    const load_id = req.query.load_id ? Number(req.query.load_id) : undefined;
    const offered_rate = req.query.offered_rate ? Number(req.query.offered_rate) : undefined;
    const counter_offer = req.query.counter_offer ? Number(req.query.counter_offer) : undefined;

    // Validate required fields
    if (load_id === undefined || offered_rate === undefined || counter_offer === undefined) {
      res.status(400).json({ error: 'Missing required fields: load_id, offered_rate, and counter_offer are required' });
      return;
    }

    // Validate types (check for NaN after Number conversion)
    if (isNaN(load_id) || isNaN(offered_rate) || isNaN(counter_offer)) {
      res.status(400).json({ error: 'Invalid field types: load_id, offered_rate, and counter_offer must be numbers' });
      return;
    }

    // Fetch load to get maximum_rate
    const load = await getLoadById(load_id);
    if (!load) {
      res.status(404).json({ error: 'Load not found' });
      return;
    }

    const loadboard_rate = offered_rate;
    const maximum_rate = load.maximum_rate;
    let new_rate: number;

    // Apply negotiation logic
    let provisional_rate: number;
    if (counter_offer > maximum_rate) {
      const difference = maximum_rate - loadboard_rate;
      provisional_rate = loadboard_rate + (difference / 2);
    } else {
      const difference = counter_offer - loadboard_rate;
      provisional_rate = loadboard_rate + (difference / 2);
    }
    // Round to nearest hundred
    new_rate = Math.round(provisional_rate / 100) * 100;
    // Ensure new_rate does not exceed either maximum_rate or counter_offer
    new_rate = Math.min(new_rate, maximum_rate, counter_offer);

    res.json({new_rate});
  } catch (error) {
    console.error('Error negotiating rate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/callsdata', async (req: Request, res: Response) => {
  try {
    const { id, duration, mc_number, final_offer, final_counter_offer, offer_iterations, successful, sentiment } = req.body;

    let normalizedSuccessful = successful;
    if (typeof successful === 'string') {
      normalizedSuccessful = successful === 'Success';
    }
    
    // Validate required fields
    if (id === undefined || duration === undefined || mc_number === undefined || 
        final_offer === undefined || final_counter_offer === undefined || 
        offer_iterations === undefined || successful === undefined || sentiment === undefined) {
      res.status(400).json({ error: 'Missing required fields: id, duration, mc_number, final_offer, final_counter_offer, offer_iterations, successful, and sentiment are required' });
      return;
    }

    // Validate types
    if (typeof id !== 'string' || typeof duration !== 'number' || typeof mc_number !== 'number' ||
        typeof final_offer !== 'number' || typeof final_counter_offer !== 'number' ||
        typeof offer_iterations !== 'number' || typeof normalizedSuccessful !== 'boolean' || typeof sentiment !== 'string') {
      res.status(400).json({ error: 'Invalid field types: id and sentiment must be strings, duration, mc_number, final_offer, final_counter_offer, and offer_iterations must be numbers, and successful must be a boolean' });
      return;
    }

    // Insert call data into database
    await insertCall({
      id,
      duration,
      mc_number,
      final_offer,
      final_counter_offer,
      offer_iterations,
      successful: normalizedSuccessful,
      sentiment
    });

    res.status(201).json({ message: 'Call data saved successfully', id });
  } catch (error) {
    console.error('Error saving call data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
    const dashboardData = await getDashboardData();
    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(buildPath));
  
  // Catch-all handler: send back React's index.html file for SPA routing
  // API routes are already handled above, so this only matches non-API routes
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Initialize database and start server
async function startServer(): Promise<void> {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

