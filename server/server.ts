import app from './src/app.js';

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🔗 API endpoint: http://localhost:${port}/api`);
});