const express = require('express');
const router = express.Router();
const commonContent = require('../helpers/commonContent');
const recaptcha = require('../helpers/recaptcha');
const jira = require('../helpers/jira');
const lms = require('../helpers/lms');
const handleCache = require('../helpers/handleCache');

const setFalseValidation = (validation, property, UIMessages) => {
    validation.isValid = false;
    validation[property] = UIMessages[0].form_field_validation___empty_field.value;
    return validation;
};

const validateReCaptcha = async (validation, data, UIMessages) => {
    const isRealUser = await recaptcha.checkv2(data);
    if (!isRealUser) {
        validation.isValid = false;
        validation['g-recaptcha-response'] = UIMessages[0].form_field_validation___recaptcha_message.value;
    }
    return validation;
};

const emailIsValid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const substituteDetailsInMessage = (message, data) => {
    message = message
        .replace('{first-name}', data.first_name)
        .replace('{last-name}', data.last_name)
        .replace('{email}', data.email)
        .replace(/\n/g, '<br>');

    return message;
};

const validateDataFeedback = async (data, req, res) => {
    const UIMessages = await handleCache.ensureSingle(res, 'UIMessages', async () => {
        return commonContent.getUIMessages(res);
    });

    let validation = {
        isValid: true
    };

    if (!data.feedback) {
        validation = setFalseValidation(validation, 'feedback', UIMessages);
    }

    validation = await validateReCaptcha(validation, data, UIMessages);

    if (validation.isValid) {
        validation.success = UIMessages[0].feedback_form___yes_message.value;
        await jira.createIssue(data);
    }

    return validation;
};

const validateFieldsCertification = (data, validation, UIMessages) => {
    if (!data.first_name) {
        validation = setFalseValidation(validation, 'first_name', UIMessages);
    }

    if (!data.last_name) {
        validation = setFalseValidation(validation, 'last_name', UIMessages);
    }

    if (!data.email || !emailIsValid(data.email)) {
        validation = setFalseValidation(validation, 'email', UIMessages);
    }

    if (typeof data.custom_field_1 !== 'undefined' && data.custom_field_1 === '') {
        validation = setFalseValidation(validation, 'custom_field_1', UIMessages);
    }

    return validation;
};

const validateDataCertification = async (data, req, res) => {
    const UIMessages = await handleCache.ensureSingle(res, 'UIMessages', async () => {
        return commonContent.getUIMessages(res);
    });

    let validation = {
        isValid: true
    };

    validation = validateFieldsCertification(data, validation, UIMessages);
    validation = await validateReCaptcha(validation, data, UIMessages);

    if (validation.isValid) {
        const signedInPast = await lms.registerAddtoCourse(data);

        if (signedInPast) {
            validation.warning = UIMessages[0].certification_form___repeated_attempt_message.value;
        } else {
            validation.success = substituteDetailsInMessage(UIMessages[0].certification_form___success_message.value, data);
        }
    }

    return validation;
};

const manageRequest = async (req, res, validate) => {
    const data = JSON.parse(req.body);

    const validation = await validate(data, req, res);
    return res.json(validation);
};

router.post('/feedback', async (req, res) => {
    return await manageRequest(req, res, validateDataFeedback);
});

router.post('/certification', async (req, res) => {
    return await manageRequest(req, res, validateDataCertification);
});

module.exports = router;
