const request = require('request');
const fs = require('fs');
const yaml = require('js-yaml');
const cheerio = require('cheerio');
const cmd = require('node-cmd');
const consola = require('consola');
const prerenderOptions = require('./redoc-cli/prerender-options.js');

const resolveCallout = (content) => {
    const $ = cheerio.load(content);
    let callouts = $('.Callout');

    for (var i = 0; i < callouts.length; i++) {
        let callout = $(callouts[i]);
        callout.addClass(`callout--${callout.attr('type')}`);
        callout.attr('class', callout.attr('class').toLowerCase());
        callout.removeAttr('type');
    }

    return $('body').eq(0).html().trim();
};

const resolveCodeSample = (content) => {
    const $ = cheerio.load(content);
    let codeSamples = $('.CodeSample');

    for (var i = 0; i < codeSamples.length; i++) {
        let codeSample = $(codeSamples[i]);
        let language = codeSample.attr('programminglanguage') || '';
        let platform = codeSample.attr('platform') || language;
        let content = codeSample.html();
        codeSample.replaceWith(`<pre class="line-numbers" data-platform-code-original="${platform}" data-platform-code="${platform.toLowerCase()}"><div class="infobar"><ul class="infobar__languages"><li class="infobar__lang">${language}</li></ul><div class="infobar__copy"></div></div><div class="clean-code">${content.trim().replace(/\n\n/g, '\n&nbsp;\n')}</div></pre>`);
    }

    return $('body').eq(0).html().trim();
};

const resolveCodeSamples = (content) => {
    const $ = cheerio.load(content);
    let codeSamples = $('.CodeSamples');

    for (var i = 0; i < codeSamples.length; i++) {
        let codeSampleGroup = $(codeSamples[i]);
        codeSampleGroup.removeAttr('class');
        codeSampleGroup.attr('class', 'code-samples');
        codeSampleGroup.prepend('<ul class="language-selector__list"></ul>');

        let samples = codeSampleGroup.find('[data-platform-code-original]');
        let langSelector = codeSampleGroup.find('.language-selector__list');

        for (var j = 0; j < samples.length; j++) {
            let sample = $(samples[j]);
            let platformOriginal = sample.attr('data-platform-code-original');
            let platform = sample.attr('data-platform-code');
            langSelector.append(`<li class="language-selector__item"><a class="language-selector__link" href="#" data-platform="${platform}">${platformOriginal.replace('_', '.')}</a></li>`);
        }
    }

    return $('body').eq(0).html().trim();
};

const resolveComponents = (obj, key) => {
    if (key === 'description' && typeof obj[key] === 'string') {
        const $ = cheerio.load(obj[key]);
        let content = $('body').eq(0).html().trim();
        let regexOpeningTag = /<!--(Callout|CodeSample[s]?)([ a-zA-Z=0-9_#]*)-->/g;
        let regexClosingTag = /<!--(Callout-end|CodeSample[s]?-end)-->/g;
        let regexCode = /```[a-z]*/g;
        content = content.replace(regexOpeningTag, '<div class="$1"$2>');
        content = content.replace(regexClosingTag, '</div>');
        content = content.replace(regexCode, '');
        content = resolveCallout(content);
        content = resolveCodeSample(content);
        content = resolveCodeSamples(content);

        obj[key] = content;
    }

    return obj;
};

const traverseObject = (obj, callback) => {
    Object.keys(obj).forEach(key => {
        obj = callback(obj, key);

        if (typeof obj[key] === 'object') {
            traverseObject(obj[key], callback);
        }
    });
    return obj;
};

const renderRedoc = (path) => {
    const options = prerenderOptions.join(' ');
    const template = './views/apiReference/redoc/template.hbs';

    cmd.get(
        `node ./helpers/redoc-cli/index.js bundle ${path} -t ${template} ${options}`,
        function (err, data, stderr) {
            consola.log(err);
            consola.log(data);
            consola.log(stderr);
        }
    );
};

const renderReference = (url) => {
    request.get(url, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            let json = yaml.safeLoad(body);
            const filePath = './helpers/redoc-cli/openapi.json'
            json = traverseObject(json, resolveComponents);
            json = JSON.stringify(json);

            let stream = fs.createWriteStream(filePath);
            stream.once('open', function () {
                stream.write(json);
                stream.end();
                renderRedoc(filePath);
            });
        }
    });
};

module.exports = renderReference;
