//====================================================//
//==========core packeges ============================//
const express = require('express')
const cors = require('cors')
const rateLimiter = require('express-rate-limit')
//====================================================//
//=========== Routes =================================//

const userRoute = require('./routes/authRouter');
const orderRoute = require('./routes/orderRouter')
const RolesRoute = require('./routes/rolesRouter')

//===================================================//
//============== meddlewares ========================//

const { globalHandleError,requestTime } = require('./meddlewares')


//===================================================//
//============== other =============================//

const corsOptions = require('./config/corsConfig')
const CustomError = require('./classes/Error')

//=================================================//
//=============== app logic ======================//

const app = express()
app.set('trust proxy', 1)
let limter = rateLimiter({
    windowMs:15 * 60 * 1000, // 15 minutes
    limit:100,
    message:'Too many requests from this IP, please try again later.',
    standardHeaders:'draft-7'
})
app.use(express.json())
app.use(cors(corsOptions))
app.use(limter)
app.use(requestTime)
let healthCheckTimer;
const TIMEOUT_MS = 14 * 60 * 1000; // 14 minutes

const performHealthCheck = async () => {
  try {
    const response = await axios.get('https://order-api-y5ih.onrender.com/api/test');
    console.log(`Health check response: ${response.status}`);
  } catch (error) {
    console.error(`Health check error: ${error.message}`);
  }
};

// 🔁 Function to start/reset the timer
const resetHealthCheckTimer = () => {
  if (healthCheckTimer) clearTimeout(healthCheckTimer);
  healthCheckTimer = setTimeout(() => {
    performHealthCheck();
    resetHealthCheckTimer(); // restart the timer after running
  }, TIMEOUT_MS);
  console.log(`Timer reset at ${new Date().toLocaleTimeString()}`);
};

// 🚀 Start the timer when server starts
resetHealthCheckTimer();

const healthCheckMiddleware = (req, res, next) => {
  resetHealthCheckTimer();
  next(); // continue to the actual route
};
//    ROUTES    //


// Attach the middleware globally
app.use(healthCheckMiddleware);

app.use('/api/user',userRoute)
app.use('/api/orders',orderRoute)
app.use('/api/roles',RolesRoute)
app.get('/api/test',(req,res)=>{
  res.status(200).json('server is active')
})
// 🧠 Function to call your health check

//==============//
// handling routes not found error
app.all('*',(req,res,next)=>{
    const err = new CustomError(`Can't find ${req.originalUrl} on the server!`, 404);
    next(err)
})
// handling all types of mongoDb error and api error
app.use(globalHandleError)

module.exports = app;

