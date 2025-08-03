const corsOptions = {
      origin: 'https://order-client-nine.vercel.app', // Don't use '*', must match the frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], // 'Authorization' must be explicitly listed
  credentials: true,
    
  };

  module.exports = corsOptions
