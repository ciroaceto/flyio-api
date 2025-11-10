import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const dbPath = process.env.DATABASE_PATH || './loads.db';

export interface Load {
  load_id: number;
  origin: string;
  destination: string;
  pickup_datetime: string;
  delivery_datetime: string;
  equipment_type: string;
  loadboard_rate: number;
  notes: string;
  weight: number;
  commodity_type: string;
  num_of_pieces: number;
  miles: number;
  dimensions: string;
  maximum_rate: number;
}

export interface Call {
  id: string;
  duration: number;
  mc_number: number;
  final_offer: number;
  final_counter_offer: number;
  offer_iterations: number;
  successful: boolean;
  sentiment: string;
}

let db: sqlite3.Database | null = null;

export function getDatabase(): sqlite3.Database {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
      }
    });
  }
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = getDatabase();
  const run = promisify(database.run.bind(database));
  const get = promisify(database.get.bind(database));

  // Create table
  await run(`
    CREATE TABLE IF NOT EXISTS LOADS (
      load_id INTEGER PRIMARY KEY AUTOINCREMENT,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      pickup_datetime TEXT NOT NULL,
      delivery_datetime TEXT NOT NULL,
      equipment_type TEXT NOT NULL,
      loadboard_rate REAL NOT NULL,
      notes TEXT,
      weight REAL NOT NULL,
      commodity_type TEXT NOT NULL,
      num_of_pieces INTEGER NOT NULL,
      miles INTEGER NOT NULL,
      dimensions TEXT NOT NULL,
      maximum_rate REAL NOT NULL,
      CHECK (maximum_rate > loadboard_rate)
    )
  `);

  // Create CALLS table
  await run(`
    CREATE TABLE IF NOT EXISTS CALLS (
      id TEXT PRIMARY KEY,
      duration INTEGER NOT NULL,
      mc_number INTEGER NOT NULL,
      final_offer INTEGER NOT NULL,
      final_counter_offer INTEGER NOT NULL,
      offer_iterations INTEGER NOT NULL,
      successful INTEGER NOT NULL,
      sentiment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add created_at column if it doesn't exist (for existing databases)
  try {
    await run(`ALTER TABLE CALLS ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
  } catch (err) {
    // Column already exists, ignore error
  }

  // Check if table is empty and seed data
  const count = await get('SELECT COUNT(*) as count FROM LOADS');
  if (count && (count as any).count === 0) {
    await seedData(run);
  }
}

async function seedData(run: (sql: string, params?: any[]) => Promise<any>): Promise<void> {
  const loads = [
    {
      origin: 'Los Angeles',
      destination: 'New York',
      pickup_datetime: '2024-01-15 08:00:00',
      delivery_datetime: '2024-01-18 17:00:00',
      equipment_type: 'Dry Van',
      loadboard_rate: 3500.00,
      notes: 'Fragile items, handle with care',
      weight: 42000,
      commodity_type: 'Electronics',
      num_of_pieces: 150,
      miles: 2789,
      dimensions: '53ft x 8.5ft x 9ft',
      maximum_rate: 5000.00
    },
    {
      origin: 'Chicago',
      destination: 'Houston',
      pickup_datetime: '2024-01-16 10:00:00',
      delivery_datetime: '2024-01-17 14:00:00',
      equipment_type: 'Flatbed',
      loadboard_rate: 2800.00,
      notes: 'Heavy machinery, requires special handling',
      weight: 45000,
      commodity_type: 'Industrial Equipment',
      num_of_pieces: 8,
      miles: 1087,
      dimensions: '48ft x 8.5ft x 8ft',
      maximum_rate: 4000.00
    },
    {
      origin: 'Miami',
      destination: 'Atlanta',
      pickup_datetime: '2024-01-17 06:00:00',
      delivery_datetime: '2024-01-18 12:00:00',
      equipment_type: 'Refrigerated',
      loadboard_rate: 2200.00,
      notes: 'Temperature controlled, maintain 38°F',
      weight: 38000,
      commodity_type: 'Food Products',
      num_of_pieces: 200,
      miles: 661,
      dimensions: '53ft x 8.5ft x 9ft',
      maximum_rate: 3200.00
    }
  ];

  for (const load of loads) {
    await run(`
      INSERT INTO LOADS (
        origin, destination, pickup_datetime, delivery_datetime,
        equipment_type, loadboard_rate, notes, weight, commodity_type,
        num_of_pieces, miles, dimensions, maximum_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      load.origin,
      load.destination,
      load.pickup_datetime,
      load.delivery_datetime,
      load.equipment_type,
      load.loadboard_rate,
      load.notes,
      load.weight,
      load.commodity_type,
      load.num_of_pieces,
      load.miles,
      load.dimensions,
      load.maximum_rate
    ]);
  }

  console.log('Database seeded with 3 load records');
}

export async function getLoads(origin?: string, destination?: string): Promise<Load[]> {
  const database = getDatabase();

  let query = 'SELECT * FROM LOADS WHERE 1=1';
  const params: string[] = [];

  if (origin) {
    query += ' AND origin = ?';
    params.push(origin);
  }

  if (destination) {
    query += ' AND destination = ?';
    params.push(destination);
  }

  query += ' ORDER BY load_id';

  const rows = await new Promise<any[]>((resolve, reject) => {
    database.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });

  return rows as Load[];
}

export async function getLoadById(load_id: number): Promise<Load | null> {
  const database = getDatabase();

  const row = await new Promise<any>((resolve, reject) => {
    database.get('SELECT * FROM LOADS WHERE load_id = ?', [load_id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });

  return row ? (row as Load) : null;
}

export async function insertCall(call: Call): Promise<void> {
  const database = getDatabase();

  await new Promise<void>((resolve, reject) => {
    database.run(`
      INSERT INTO CALLS (
        id, duration, mc_number, final_offer, final_counter_offer,
        offer_iterations, successful, sentiment, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
    `, [
      call.id,
      call.duration,
      call.mc_number,
      call.final_offer,
      call.final_counter_offer,
      call.offer_iterations,
      call.successful ? 1 : 0, // SQLite uses INTEGER for boolean (0 or 1)
      call.sentiment,
      null // created_at will use CURRENT_TIMESTAMP
    ], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export interface DashboardData {
  successRate: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  dailyAverages: Array<{
    date: string;
    avgDuration: number;
    avgOfferIterations: number;
    avgOfferDifference: number;
  }>;
  totalCalls: number;
}

export async function getDashboardData(): Promise<DashboardData> {
  const database = getDatabase();
  const all = promisify(database.all.bind(database));
  const get = promisify(database.get.bind(database));

  // Get success rate
  const successStats = await get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN successful = 1 THEN 1 ELSE 0 END) as successful_count
    FROM CALLS
  `) as { total: number; successful_count: number } | null;

  const totalCalls = successStats?.total || 0;
  const successRate = totalCalls > 0 
    ? ((successStats?.successful_count || 0) / totalCalls) * 100 
    : 0;

  // Get sentiment distribution
  const sentimentStats = await all(`
    SELECT 
      sentiment,
      COUNT(*) as count
    FROM CALLS
    GROUP BY sentiment
  `) as Array<{ sentiment: string; count: number }> | null;

  const sentimentDistribution = {
    positive: 0,
    negative: 0,
    neutral: 0
  };

  if (sentimentStats) {
    sentimentStats.forEach(stat => {
      const sentiment = stat.sentiment.toLowerCase();
      if (sentiment === 'positive') {
        sentimentDistribution.positive = stat.count;
      } else if (sentiment === 'negative') {
        sentimentDistribution.negative = stat.count;
      } else {
        sentimentDistribution.neutral = stat.count;
      }
    });
  }

  // Get daily averages for the last 7 days
  const dailyAverages = await all(`
    SELECT 
      DATE(created_at) as date,
      AVG(duration) as avgDuration,
      AVG(offer_iterations) as avgOfferIterations,
      AVG(ABS(final_offer - final_counter_offer)) as avgOfferDifference
    FROM CALLS
    WHERE DATE(created_at) >= DATE('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `) as Array<{
    date: string;
    avgDuration: number;
    avgOfferIterations: number;
    avgOfferDifference: number;
  }> | null;

  // Fill in missing days with zeros
  const filledDailyAverages: Array<{
    date: string;
    avgDuration: number;
    avgOfferIterations: number;
    avgOfferDifference: number;
  }> = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const existing = dailyAverages?.find(d => d.date === dateStr);
    filledDailyAverages.push({
      date: dateStr,
      avgDuration: existing?.avgDuration || 0,
      avgOfferIterations: existing?.avgOfferIterations || 0,
      avgOfferDifference: existing?.avgOfferDifference || 0
    });
  }

  return {
    successRate,
    sentimentDistribution,
    dailyAverages: filledDailyAverages,
    totalCalls
  };
}

