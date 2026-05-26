const { Client } = require('pg');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const pgUrl = process.env.DATABASE_URL || 'postgresql://routeiq_user:routeiq_password@localhost:5432/routeiq_db';
const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/routeiq';

async function seed() {
  console.log('--- ROUTEIQ DATABASE SEEDING ENGINE STARTING ---');

  // 1. Seed PostgreSQL Database
  const pgClient = new Client({ connectionString: pgUrl });
  try {
    await pgClient.connect();
    console.log('Connected to PostgreSQL successfully.');

    // Enable PostGIS extension
    await pgClient.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('PostGIS extension verified.');

    // Clean tables
    await pgClient.query('TRUNCATE TABLE users, roads, road_segments, risk_predictions, maintenance_history CASCADE;');
    console.log('Cleaned existing PostgreSQL tables.');

    // Seed default User roles
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('admin_routeiq_2026', salt);
    const engineerHash = await bcrypt.hash('engineer_routeiq_2026', salt);
    
    const userInsertQuery = `
      INSERT INTO users (id, email, "passwordHash", role, "createdAt") VALUES
      ('a1111111-1111-1111-1111-111111111111', 'admin@routeiq.com', $1, 'Admin', NOW()),
      ('e2222222-2222-2222-2222-222222222222', 'engineer@routeiq.com', $2, 'Engineer', NOW());
    `;
    await pgClient.query(userInsertQuery, [adminHash, engineerHash]);
    console.log('Seeded Users (Admin and Engineer accounts).');

    // Seed Roads catalog
    const roadInsertQuery = `
      INSERT INTO roads (id, name, "highwayType", "osmId", "createdAt") VALUES
      ('r1000000-0000-0000-0000-000000000000', 'Broadway Boulevard', 'primary', 'osm_241512', NOW()),
      ('r2000000-0000-0000-0000-000000000000', 'FDR Drive Express', 'motorway', 'osm_951235', NOW()),
      ('r3000000-0000-0000-0000-000000000000', 'Fifth Avenue', 'primary', 'osm_124892', NOW());
    `;
    await pgClient.query(roadInsertQuery);
    console.log('Seeded Roads catalogue.');

    // Seed Road Segments with PostGIS LineStrings (WKT)
    const segmentInsertQuery = `
      INSERT INTO road_segments (id, "roadId", geom, "currentHealthScore", "riskLevel", "lengthMeters", "trafficDensity", "lastInspectedAt") VALUES
      (
        's1111111-1111-1111-1111-111111111111',
        'r1000000-0000-0000-0000-000000000000',
        ST_GeomFromText('LINESTRING(-73.98513 40.75889, -73.98472 40.75981)', 4326),
        48.5,
        'High',
        110.0,
        2800.0,
        NOW() - INTERVAL '10 days'
      ),
      (
        's2222222-2222-2222-2222-222222222222',
        'r2000000-0000-0000-0000-000000000000',
        ST_GeomFromText('LINESTRING(-73.96803 40.74831, -73.96541 40.75122)', 4326),
        32.0,
        'Critical',
        420.0,
        4500.0,
        NOW() - INTERVAL '3 days'
      ),
      (
        's3333333-3333-3333-3333-333333333333',
        'r3000000-0000-0000-0000-000000000000',
        ST_GeomFromText('LINESTRING(-73.97305 40.76483, -73.97231 40.76562)', 4326),
        88.0,
        'Low',
        125.0,
        1500.0,
        NOW() - INTERVAL '30 days'
      );
    `;
    await pgClient.query(segmentInsertQuery);
    console.log('Seeded Road Segments with PostGIS spatial LineStrings.');

    // Seed Risk Predictions
    const predictionInsertQuery = `
      INSERT INTO risk_predictions (id, "segmentId", "forecastDate", "predictedHealthScore", confidence, factors, "createdAt") VALUES
      (
        'p1111111-1111-1111-1111-111111111111',
        's1111111-1111-1111-1111-111111111111',
        CURRENT_DATE + INTERVAL '30 days',
        42.1,
        88.5,
        '{"traffic_density": -8.5, "weather_conditions": -5.1, "citizen_complaints": -12.4}',
        NOW()
      ),
      (
        'p2222222-2222-2222-2222-222222222222',
        's1111111-1111-1111-1111-111111111111',
        CURRENT_DATE + INTERVAL '60 days',
        35.8,
        84.2,
        '{"traffic_density": -12.2, "weather_conditions": -9.2, "citizen_complaints": -18.6}',
        NOW()
      ),
      (
        'p3333333-3333-3333-3333-333333333333',
        's2222222-2222-2222-2222-222222222222',
        CURRENT_DATE + INTERVAL '30 days',
        20.5,
        91.0,
        '{"traffic_density": -18.5, "weather_conditions": -12.4, "satellite_detections": -22.3}',
        NOW()
      );
    `;
    await pgClient.query(predictionInsertQuery);
    console.log('Seeded Risk Predictions.');

    // Seed Maintenance History
    const historyInsertQuery = `
      INSERT INTO maintenance_history (id, "segmentId", "repairType", cost, agency, "repairedAt", notes, "createdAt") VALUES
      (
        'h1111111-1111-1111-1111-111111111111',
        's1111111-1111-1111-1111-111111111111',
        'Seal Coating & Patching',
        1650.0,
        'NYC DOT Crew A',
        CURRENT_DATE - INTERVAL '180 days',
        'Routine preventive sealing.',
        NOW()
      );
    `;
    await pgClient.query(historyInsertQuery);
    console.log('Seeded Maintenance History logs.');

  } catch (err) {
    console.error('Error seeding PostgreSQL:', err);
  } finally {
    await pgClient.end();
    console.log('PostgreSQL connection closed.');
  }

  // 2. Seed MongoDB Database
  const mongoClient = new MongoClient(mongoUrl);
  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB successfully.');

    const db = mongoClient.db();
    
    // Clear complaints and other logs
    await db.collection('citizen_complaints').deleteMany({});
    console.log('Cleaned citizen complaints collection.');

    // Seed semi-structured citizen complaints with GeoJSON points
    const complaints = [
      {
        title: 'Dangerous deep pothole on Broadway',
        description: 'Pothole is about 15cm deep, cars are swerving into the other lane to avoid it. Caused a tire blowout this morning.',
        category: 'Pothole',
        sentiment: 'Negative',
        severity: 'Critical',
        location: {
          type: 'Point',
          coordinates: [-73.9850, 40.7590], // near Broadway segment
        },
        imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2', // default pothole photo
        status: 'Open',
        createdAt: new Date(Date.now() - 3600000 * 24), // 1 day ago
      },
      {
        title: 'Severe standing water on FDR drive exit',
        description: 'Drainage system seems fully blocked. Exit ramp is half submerged under water, causing major slowdowns.',
        category: 'Flooding',
        sentiment: 'Negative',
        severity: 'High',
        location: {
          type: 'Point',
          coordinates: [-73.9670, 40.7500], // near FDR Drive segment
        },
        imageUrl: 'https://images.unsplash.com/photo-1484186139897-d5fc6b908812',
        status: 'In_Progress',
        createdAt: new Date(Date.now() - 3600000 * 48), // 2 days ago
      },
      {
        title: 'Faded pedestrian crossing markings',
        description: 'The white lines are completely faded near Fifth Ave and 57th street. Pedestrians are finding it hard to cross safely.',
        category: 'Signage',
        sentiment: 'Neutral',
        severity: 'Low',
        location: {
          type: 'Point',
          coordinates: [-73.9728, 40.7650], // near Fifth Ave
        },
        imageUrl: '',
        status: 'Open',
        createdAt: new Date(Date.now() - 3600000 * 12), // 12 hours ago
      },
    ];

    await db.collection('citizen_complaints').insertMany(complaints);
    console.log('Seeded citizen complaints collections.');

  } catch (err) {
    console.error('Error seeding MongoDB:', err);
  } finally {
    await mongoClient.close();
    console.log('MongoDB connection closed.');
  }

  console.log('--- ROUTEIQ DATABASE SEEDING ENGINE COMPLETED ---');
}

seed();
