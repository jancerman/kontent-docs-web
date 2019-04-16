const express = require('express');
const router = express.Router();
const isPreview = require('../helpers/isPreview');

router.get('/', (req, res) => {
    res.header('Content-Type', 'text/plain');
    res.render('pages/robots', { isPreview: isPreview(res.locals.previewapikey) });
});

module.exports = router;
