const express = require('express');
const router = express.Router();
const commonContent = require('../helpers/commonContent');
const recaptcha = require('../helpers/recaptcha');
const jira = require('../helpers/jira');
const cache = require('memory-cache');

const validateDataFeedback = async (data, req, res) => {
    const KCDetails = commonContent.getKCDetails(res);
    let validation = {
        isValid: true
    };
    const UIMessages = cache.get(`UIMessages_${KCDetails.projectid}`);

    if (!data.feedback) {
        validation.isValid = false;
        validation.feedback = UIMessages[0].elements['feedback_form___empty_field_validation'].value;
    }

    let isRealUser = await recaptcha.checkv2(data);
    if (!isRealUser) {
        validation.isValid = false;
        validation['g-recaptcha-response'] = UIMessages[0].elements['feedback_form___recaptcha_message'].value;
    }

    if (validation.isValid) {
        validation.success = UIMessages[0].elements['feedback_form___yes_message'].value;
        await jira.createIssue(data);
    }

    return validation;
};

router.post('/feedback', async (req, res, next) => {
    let data = JSON.parse(req.body);

    let validation = await validateDataFeedback(data, req, res);
    return res.json(validation);
});

module.exports = router;
