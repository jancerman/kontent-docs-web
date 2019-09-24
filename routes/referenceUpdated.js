const axios = require('axios');
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    const event = req.body;

    if (isValidationEvent(event)) {
        return await res.send({
            'validationResponse': event.data.validationCode
        })
    }

    if (isReferenceUpdatedEvent(event)) {
        const baseURL = process.env['referenceRenderUrl'];
        const apiCodename = event.data.apiReference;

        const data = // eslint-disable-line no-unused-vars
            await axios.get(`${baseURL}/api/ProviderStarter?api=${apiCodename}&isPreview=false&isTest=false`);

        // TODO Cache the updated API Reference page
    }
});

const isValidationEvent = (event) =>
    isValidEventGridEvent(event) &&
    event.data.validationCode &&
    event.eventType.includes('Subscription');

const isReferenceUpdatedEvent = (event) =>
    isValidEventGridEvent(event) &&
    event.data.apiReference &&
    event.eventType.includes('UPDATE');

const isValidEventGridEvent = (event) =>
    event &&
    event.data &&
    event.eventType;

module.exports = router;
