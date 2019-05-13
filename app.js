require('dotenv').config();
const appInsights = require('applicationinsights');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const logger = require('morgan');
const asyncHandler = require('express-async-handler');
const cache = require('memory-cache');

const getUrlMap = require('./helpers/urlMap');
const commonContent = require('./helpers/commonContent');
const isPreview = require('./helpers/isPreview');

const home = require('./routes/home');
const tutorials = require('./routes/tutorials');
const certification = require('./routes/certification');
const sitemap = require('./routes/sitemap');
const rss = require('./routes/rss');
const robots = require('./routes/robots');
const kenticoIcons = require('./routes/kenticoIcons');
const urlAliases = require('./routes/urlAliases');
const redirectUrls = require('./routes/redirectUrls');
const previewUrls = require('./routes/previewUrls');
const cacheInvalidate = require('./routes/cacheInvalidate');
const apiReference = require('./routes/apiReference');
const error = require('./routes/error');

const app = express();

let KCDetails = {};

const urlWhitelist = [
  '/urlmap',
  '/kentico-icons.min.css',
  '/favicon.ico',
  '/api-reference',
  '/rss/articles'
];

// Azure Application Insights monitors
if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
  appInsights.setup();
  appInsights.start();
}

app.locals.deployVersion = (new Date()).getTime();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 86400000
}));
app.enable('trust proxy');

const handleKCKeys = (req, res) => {
  if (typeof req.query.projectid !== 'undefined') {
    res.locals.projectid = req.query.projectid;
  } else {
    res.locals.projectid = process.env['KC.ProjectId'];
  }

  if (typeof req.query.previewapikey !== 'undefined') {
    res.locals.previewapikey = req.query.previewapikey;
  } else {
    res.locals.previewapikey = process.env['KC.PreviewApiKey'];
  }

  if (typeof req.query.securedapikey !== 'undefined') {
    res.locals.securedapikey = req.query.securedapikey;
  } else {
    res.locals.securedapikey = process.env['KC.SecuredApiKey'];
  }
};

const handleCaching = async (res) => {
  KCDetails = commonContent.getKCDetails(res);
  const isPreviewRequest = isPreview(res.locals.previewapikey);

  if (isPreviewRequest && cache.get('platformsConfig')) {
    cache.del('platformsConfig');
  }

  if (isPreviewRequest && cache.get('urlMap')) {
    cache.del('urlMap');
  }

  if (!cache.get('platformsConfig')) {
    let platformsConfig = await commonContent.getPlatformsConfig(res);
    cache.put('platformsConfig', platformsConfig);
  }

  if (!cache.get('urlMap')) {
    let urlMap = await getUrlMap(KCDetails);
    cache.put('urlMap', urlMap);
  }
};

const pageExists = (req, res, next) => {
  const urlMap = cache.get('urlMap');
  const path = req.originalUrl.split('?')[0];
  let exists = false;

  urlMap.forEach((item) => {
    const itemPath = item.url.split('?')[0];

    if (itemPath === path) {
      exists = true;
    }
  });

  if (!exists) {
    urlWhitelist.forEach((item) => {
      const itemPath = item.split('?')[0];

      if (itemPath === path) {
        exists = true;
      }
    });
  }

  return exists;
};

// Routes
app.use('*', asyncHandler(async (req, res, next) => {
  handleKCKeys(req, res);
  await handleCaching(res);
  const exists = pageExists(req, res, next);

  if (!exists) {
    return await urlAliases(req, res, next);
  }

  return next();
}));

app.use('/', home);
app.use('/certification', certification);
app.use('/', previewUrls);
app.use('/api-reference', apiReference);
app.use('/redirect-urls', redirectUrls);

app.use('/kentico-icons.min.css', kenticoIcons);
app.use('/sitemap.xml', sitemap);
app.use('/rss', rss);
app.use('/robots.txt', robots);

app.get('/urlmap', asyncHandler(async (req, res) => {
  return res.json(cache.get('urlMap'));
}));

app.use('/cache-invalidate', bodyParser.text({ type: '*/*' }), cacheInvalidate);

app.use('/', tutorials);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(async (err, req, res, _next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.error(err.stack);
  // render the error page
  res.status(err.status || 500);
  req.err = err;
  return await error(req, res);
});

module.exports = app;
