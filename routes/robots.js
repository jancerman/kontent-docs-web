const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    const isLiveSite = req.get('X-ORIG-HOST');
    res.header('Content-Type', 'text/plain');
    return res.render('tutorials/pages/robots', { isLiveSite: !!isLiveSite });
});

module.exports = router;
