const cache = require('memory-cache');
const commonContent = require('../helpers/commonContent');
const minify = require('../helpers/minify');
const helper = require('../helpers/helperFunctions');

const error = async (req, res) => {
    const KCDetails = commonContent.getKCDetails(res);
    const footer = cache.get(`footer_${KCDetails.projectid}`);
    const UIMessages = cache.get(`UIMessages_${KCDetails.projectid}`);

    if (!footer) {
        return res.status(500).send('Unexpected error, please check site logs.');
    }

    const content = cache.get(`not_found_${KCDetails.projectid}`);
    const home = cache.get(`home_${KCDetails.projectid}`);

    return res.render('tutorials/pages/error', {
        req: req,
        minify: minify,
        slug: '404',
        navigation: home[0] ? home[0].navigation : [],
        title: content[0] ? content[0].title.value : '',
        titleSuffix: ` | ${home[0] ? home[0].title.value : 'Kentico Cloud Docs'}`,
        content: content[0] ? content[0].content.value : '',
        footer: footer[0] ? footer[0] : {},
        UIMessages: UIMessages[0],
        helper: helper
    });
};

module.exports = error;
