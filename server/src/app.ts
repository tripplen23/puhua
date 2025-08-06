import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

import userRoutes from './routes/userRoutes';
import learningMaterialRoutes from './routes/learningMaterialRoutes';
import { initializeContainer } from './configs/azureBlobConfig';

// Load environment variables from .env
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Global middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health-check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount feature routes
app.use('/api/users', userRoutes);
app.use('/api/learning-materials', learningMaterialRoutes);

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server only if executed directly (not when imported)
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    
    // Initialize Azure Blob Storage
    try {
      await initializeContainer();
    } catch (error) {
      console.error('⚠️ Failed to initialize Azure Blob Storage:', error);
    }
  });
}

export default app;
