const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sassMiddleware = require('node-sass-middleware');
const { ApolloServer } = require('apollo-server-express');

const { TYPE_DEFINITION } = require('./graphQL/types');
const { queryTypes, resolvers } = require('./graphQL/queries')
const indexRouter = require('./routes/index');
const { graphQLPath } = require('./config');

const app = express();

// Apollo Server setup
const apolloServer = new ApolloServer({
  introspection: true,
  playground: true,
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

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

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
app.use(function (_req, _res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, _next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('pages/error');
});

module.exports = {
  app
};
