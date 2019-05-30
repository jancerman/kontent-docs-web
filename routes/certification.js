const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');

const minify = require('../helpers/minify');
const isPreview = require('../helpers/isPreview');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');
const lms = require('../helpers/lms');
const recaptcha = require('../helpers/recaptcha');
const cache = require('memory-cache');

const getCertificationContent = async (req, res) => {
    const KCDetails = commonContent.getKCDetails(res);
    const home = cache.get(`home_${KCDetails.projectid}`);
    const content = cache.get(`certification_${KCDetails.projectid}`);

    if (!(home && home[0]) || !(content && content[0])) {
        return null;
    }

    const footer = cache.get(`footer_${KCDetails.projectid}`);
    const UIMessages = cache.get(`UIMessages_${KCDetails.projectid}`);

    return {
        req: req,
        minify: minify,
        getFormValue: helper.getFormValue,
        slug: 'certification',
        isPreview: isPreview(res.locals.previewapikey),
        title: content[0].title.value,
        titleSuffix: ` | ${home[0] ? home[0].title.value : 'Kentico Cloud Docs'}`,
        content: content[0],
        navigation: home[0].navigation,
        footer: footer[0] ? footer[0] : {},
        UIMessages: UIMessages[0],
        helper: helper
    };
};

const substituteDetailsInMessage = (data) => {
    data.content.sign_up_success.value = data.content.sign_up_success.value
        .replace('{first-name}', data.req.body.first_name)
        .replace('{last-name}', data.req.body.last_name)
        .replace('{email}', data.req.body.email);

    return data;
};

router.get('/', asyncHandler(async (req, res, next) => {
    let data = await getCertificationContent(req, res, next);
    if (!data) return next();
    return res.render('tutorials/pages/certification', data);
}));

router.post('/', [
    check('first_name').not().isEmpty().withMessage((value, { req, location, path }) => {
        return 'empty_field_validation';
    }).trim(),
    check('last_name').not().isEmpty().withMessage((value, { req, location, path }) => {
        return 'empty_field_validation';
    }).trim(),
    check('email').not().isEmpty().withMessage((value, { req, location, path }) => {
        return 'empty_field_validation';
    }).trim()
], asyncHandler(async (req, res, next) => {
    let data = await getCertificationContent(req, res, next);
    if (!data) return next();

    const errors = validationResult(req);

    if (errors.isEmpty()) {
        let isRealUser = await recaptcha.checkv2(req.body);

        if (isRealUser) {
            let signedInPast = await lms.registerAddtoCourse(req.body);

            if (signedInPast) {
                data.req.signedInPast = true;
            } else {
                data.req.successForm = true;
            }
        } else {
            data.req.isBot = true;
        }
    } else {
        data.req.errorForm = helper.getValidationMessages(errors.array(), data);
    }

    data.req.anchor = 'certification-form';
    data = substituteDetailsInMessage(data);
    return res.render('tutorials/pages/certification', data);
}));

module.exports = router;
