require('dotenv').config();
let appInsights = require('applicationinsights');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const logger = require('morgan');
const { ApolloServer } = require('apollo-server-express');

const { TYPE_DEFINITION } = require('./graphQL/types');
const { queryTypes, resolvers } = require('./graphQL/queries')
const { graphQLPath } = require('./config');

const home = require('./routes/home');
const tutorials = require('./routes/tutorials');

const app = express();

// Azure Application Insights monitors
if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
  appInsights.setup();
}


// Apollo Server setup
const apolloServer = new ApolloServer({
  introspection: true,
  playground: false,
  typeDefs: [
    TYPE_DEFINITION,
    queryTypes
  ],
  resolvers
});
apolloServer.applyMiddleware({
  app,
  path: graphQLPath
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 86400000
}));

app.use('/', home);
app.use('/tutorials', tutorials);

//Routes
app.get('/design/home', (req, res, next) => {
  return res.render('design/home', {
      title: 'Home',
      req: req
  });
});

app.get('/design/article', (req, res, next) => {
  return res.render('design/article', {
      title: 'Article',
      req: req
  });
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, _next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.error(err.stack);
  // render the error page
  res.status(err.status || 500);
  res.render('pages/error', { 
    req: req,
    navigation: [] 
  });
});

module.exports = app;