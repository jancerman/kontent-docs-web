const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');

const requestDelivery = require('../helpers/requestDelivery');
const getUrlMap = require('../helpers/urlMap');
const minify = require('../helpers/minify');
const isPreview = require('../helpers/isPreview');
const commonContent = require('../helpers/commonContent');
const helper = require('../helpers/helperFunctions');
const lms = require('../helpers/lms');
const recaptcha = require('../helpers/recaptcha');

const getCertificationContent = async (req, res, next) => {
    const KCDetails = commonContent.getKCDetails(res);

    const tree = await requestDelivery({
        type: 'home',
        depth: 1,
        resolveRichText: true,
        urlMap: await getUrlMap(KCDetails),
        ...KCDetails
    });

    const content = await requestDelivery({
        type: 'certification',
        depth: 1,
        resolveRichText: true,
        urlMap: await getUrlMap(KCDetails),
        ...KCDetails
    });

    if (!(tree && tree[0]) || !(content && content[0])) {
        return null;
    }

    const footer = await commonContent.getFooter(res);
    const UIMessages = await commonContent.getUIMessages(res);

    return {
        req: req,
        minify: minify,
        getFormValue: helper.getFormValue,
        slug: 'certification',
        isPreview: isPreview(res.locals.previewapikey),
        title: content[0].title.value,
        titleSuffix: ` | ${tree[0] ? tree[0].title.value : 'Kentico Cloud Docs'}`,
        content: content[0],
        navigation: tree[0].navigation,
        footer: footer[0] ? footer[0] : {},
        UIMessages: UIMessages[0],
        helper: helper
    };
};

router.get('/', asyncHandler(async (req, res, next) => {
    let data = await getCertificationContent(req, res, next);
    if (!data) return next();
    return res.render('pages/certification', data);
}));

router.post('/', [
    check('first_name').not().isEmpty().withMessage((value, { req, location, path }) => {
        return 'Please, fill in your first name.';
    }).trim(),
    check('last_name').not().isEmpty().withMessage((value, { req, location, path }) => {
        return 'Please, fill in your last name.';
    }).trim(),
    check('email').not().isEmpty().withMessage((value, { req, location, path }) => {
        return 'Please, fill in your email address.';
    }).trim()
], asyncHandler(async (req, res, next) => {
    let data = await getCertificationContent(req, res, next);
    if (!data) return next();

    const errors = validationResult(req);

    if (errors.isEmpty()) {
        let isRealUser = await recaptcha.check(req.body);

        if (isRealUser) {
            delete req.body['g-recaptcha-response'];
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
        data.req.errorForm = errors.array();
    }

    return res.render('pages/certification', data);
}));

module.exports = router;
