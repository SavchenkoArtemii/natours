const express = require("express");
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const toursRouter = require('./routes/toursRoute');
const usersRouter = require('./routes/userRouter');
const reviewsRouter = require('./routes/reviewRouter');
const viewRouter = require('./routes/viewRouter');
const rateLimit = require("express-rate-limit");
const helmet = require('helmet');
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const hpp = require("hpp");
const path = require('path');


const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// 1) GLOBAL MIDDLEWARES
//serving static files
app.use(express.static(path.join(__dirname, "public")));

// Set secutity HTTP headers
app.use(helmet());

// Log only for development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this API. Pleaste try again in an hour"
});
app.use('/api', limiter);

// Body parser. read the header body into req.body
app.use(express.json({
    limit: '10kb'
}));

// serving static files
app.use(express.static(`${__dirname}/public`));

//data sanitizing
app.use(mongoSanitize());

//protect XSS
app.use(xssClean());

// prevent parameter pollution
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
      ]
}));

// test middlewares
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// 3) ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);


module.exports = app;