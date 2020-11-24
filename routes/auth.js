const express = require('express');
const router = express.Router();

router.get('/login', (req, res) => {
  return res.oidc.login({ returnTo: req.session.returnTo });
});

module.exports = router;
