require('dotenv').config();
const appInsights = require('applicationinsights');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const logger = require('morgan');
const asyncHandler = require('express-async-handler');
const cacheControl = require('express-cache-controller');
const serveStatic = require('serve-static');
const slashes = require('connect-slashes');
const consola = require('consola');
const axios = require('axios');
const cache = require('memory-cache');
const util = require('util');
const { setIntervalAsync } = require('set-interval-async/dynamic')

const handleCache = require('./helpers/handleCache');
const getUrlMap = require('./helpers/urlMap');
const commonContent = require('./helpers/commonContent');

const home = require('./routes/home');
const tutorials = require('./routes/tutorials');
const sitemap = require('./routes/sitemap');
const rss = require('./routes/rss');
const robots = require('./routes/robots');
const kenticoIcons = require('./routes/kenticoIcons');
const urlAliases = require('./routes/urlAliases');
const redirectUrls = require('./routes/redirectUrls');
const referenceUpdated = require('./routes/referenceUpdated');
const linkUrls = require('./routes/linkUrls');
const previewUrls = require('./routes/previewUrls');
const cacheInvalidate = require('./routes/cacheInvalidate');
const reference = require('./routes/reference');
const error = require('./routes/error');
const form = require('./routes/form');
const redirectRules = require('./routes/redirectRules');

const app = express();

const urlWhitelist = [
  '/other/*',
  '/scenario/*',
  '/article/*',
  '/mta/*',
  '/form/*',
  '/urlmap',
  '/kentico-icons.min.css',
  '/favicon.ico',
  '/api-reference',
  '/rss/*',
  '/redirect-urls',
  '/cache-invalidate',
  '/robots.txt',
  '/link-to',
  '/sitemap.xml'
];

// Azure Application Insights monitors
if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
  appInsights.setup();
  appInsights.start();
  exports.appInsights = appInsights;
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
app.use(serveStatic(path.join(__dirname, 'public'), {
  maxAge: 2592000,
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://tracker.kontent.ai');
  }
}));
app.use(slashes(false));
app.use(cacheControl({
  // noCache: true
  maxAge: 300
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

const pageExists = async (req, res) => {
  const urlMap = await handleCache.ensureSingle(res, 'urlMap', async () => {
    return await getUrlMap(res);
  });

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
      let itemPath = item.split('#')[0];
      itemPath = itemPath.split('?')[0];

      if (itemPath === path) {
        exists = true;
      } else if (itemPath.endsWith('/*')) {
        itemPath = itemPath.slice(0, -1);

        if (path.startsWith(itemPath)) {
          exists = true;
        }
      }
    });
  }

  return exists;
};

// Routes
app.use(async (req, res, next) => {
  res.locals.host = req.headers.host;
  res.locals.protocol = req.protocol;
  handleKCKeys(req, res);
  res.setHeader('Arr-Disable-Session-Affinity', 'True');
  return next();
});

app.use('/link-to', linkUrls);

app.use('/reference-updated', bodyParser.json({
  type: '*/*'
}), referenceUpdated);

app.use('/cache-invalidate', bodyParser.text({
  type: '*/*'
}), cacheInvalidate);

app.use('/', redirectRules);

app.use('/', previewUrls);

app.use('/form', bodyParser.text({
  type: '*/*'
}), form);

app.use('/kentico-icons.min.css', kenticoIcons);

const isOneOfCacheRevelidate = (req) => {
  const urls = [
    '/reference/',
    '/rss/',
    '/tutorials/',
    '/certification/',
    '/product-changelog'
  ];

  if (req.originalUrl === '/') {
    return true;
  }

  let revalidate = false;

  for (var i = 0; i < urls.length; i++) {
    if (req.originalUrl.startsWith(urls[i])) {
      revalidate = true;
    }
  }

  return revalidate;
};

app.use('/', asyncHandler(async (req, res, next) => {
  if (isOneOfCacheRevelidate(req)) {
    await handleCache.evaluateCommon(res, ['platformsConfig', 'urlMap', 'footer', 'UIMessages', 'home', 'navigationItems', 'articles']);
    await handleCache.cacheAllAPIReferences(res);
  }

  const exists = await pageExists(req, res, next);

  if (!exists) {
    await handleCache.evaluateCommon(res, ['articles']);
    return await urlAliases(req, res, next);
  }

  return next();
}));

app.use('/', home);

app.use('/redirect-urls', async (req, res, next) => {
  await handleCache.evaluateCommon(res, ['articles']);
  return next();
}, redirectUrls);

app.use('/sitemap.xml', sitemap);

app.use('/rss', async (req, res, next) => {
  await handleCache.evaluateCommon(res, ['rss_changelog']);
  return next();
}, rss);

app.use('/robots.txt', robots);

app.get('/urlmap', asyncHandler(async (req, res) => {
  res.cacheControl = {
    maxAge: 0
  };

  const urlMap = await handleCache.ensureSingle(res, 'urlMap', async () => {
    return await getUrlMap(res);
  });

  return res.json(urlMap);
}));

// Dynamic routing setup
app.use('/', async (req, res, next) => {
  const topLevel = req.originalUrl.split('/')[1];
  const navigationItems = await handleCache.ensureSingle(res, 'navigationItems', async () => {
    return commonContent.getNavigationItems(res);
  });

  if (navigationItems) {
    res.locals.router = navigationItems.filter(item => topLevel === item.url.value);
  }

  if (res.locals.router && res.locals.router.length && res.locals.router[0].type.value.length) {
    res.locals.router = res.locals.router[0].type.value[0].codename;
  } else /* if (topLevel === 'other' || topLevel === 'article') */ {
    res.locals.router = 'tutorials';
  }

  return next();
}, tutorials, reference);

const logPool = (log) => {
  const key = 'cache-interval-pool';
  const logs = cache.get(key) || [];
  logs.unshift(log);
  if (logs.length > 200) {
      logs.length = 200;
  }
  cache.put(key, logs);
};

setIntervalAsync(async () => {
  const log = {
    timestamp: (new Date()).toISOString(),
    pool: util.inspect(cache.get('webhook-payload-pool'), {
        maxArrayLength: 500
    })
  };

  try {
    const response = await axios.post(`${process.env.baseURL}/cache-invalidate/pool`, {});
    log.url = response && response.config ? response.config.url : '';
  } catch (error) {
    log.error = error && error.response ? error.response.data : '';
  }

  logPool(log);
}, 300000);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  return next(err);
});

// error handler
app.use(async (err, req, res, _next) => { // eslint-disable-line no-unused-vars
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  consola.error(err.stack);

  if (appInsights && appInsights.defaultClient) {
    appInsights.defaultClient.trackTrace({
      message: `${err.stack}${req.headers.referer ? `\n\nReferer request header value: ${req.headers.referer}` : ''}`
    });
  }

  // render the error page
  req.err = err;
  await handleCache.evaluateCommon(res, ['not_found']);
  return error(req, res);
});

module.exports = app;
