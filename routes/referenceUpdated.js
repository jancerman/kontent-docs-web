const axios = require('axios');
const axiosRetry = require('axios-retry');
const express = require('express');
const router = express.Router();
const handleCache = require('../helpers/handleCache');
const commonContent = require('../helpers/commonContent');

router.post('/', async (req, res) => {
    const event = req.body[0];
    const baseURL = process.env.referenceRenderUrl;
    const KCDetails = commonContent.getKCDetails(res);
    let apiCodename;

    if (isValidationEvent(event)) {
        return await res.send({
            validationResponse: event.data.validationCode
        })
    }

    if (isValidEventGridEvent(event)) {
        apiCodename = event.data.apiReference;
    }

    if (isReferenceUpdatedEvent(event)) {
        axiosRetry(axios, { retries: 3 });
        const data = await axios.get(`${baseURL}/api/ProviderStarter?api=${apiCodename}&isPreview=false&isTest=false`);
        handleCache.putCache(`reDocReference_${apiCodename}`, data, KCDetails);
    }

    if (isReferenceDeletedEvent(event)) {
        handleCache.deleteCache(`reDocReference_${apiCodename}`, KCDetails);
        handleCache.deleteMultipleKeys('reference_');
    }

    res.end();
});

const isValidationEvent = (event) =>
    isValidEventGridEvent(event) &&
    event.data.validationCode &&
    event.eventType.includes('Subscription');

const isReferenceUpdatedEvent = (event) =>
    isValidEventGridEvent(event) &&
    event.data.apiReference &&
    event.eventType.includes('UPDATE');

const isReferenceDeletedEvent = (event) =>
    isValidEventGridEvent(event) &&
    event.data.apiReference &&
    event.eventType.includes('DELETE');

const isValidEventGridEvent = (event) =>
    event &&
    event.data &&
    event.eventType;

module.exports = router;
