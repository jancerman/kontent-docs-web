const request = require('request');
const fs = require('fs');
const yaml = require('js-yaml');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const resolveCallouts = (content) => {
    const dom = new JSDOM(content);
    let callouts = dom.window.document.documentElement.querySelectorAll('.Callout');
    for (var i = 0; i < callouts.length; i++) {
        callouts[i].classList.add('callout--' + callouts[i].getAttribute('type'));
        callouts[i].setAttribute('class', callouts[i].getAttribute('class').toLowerCase());
        callouts[i].removeAttribute('type');
    }

    return dom.window.document.documentElement.querySelector('body').innerHTML;
};

const resolveCodeSample = (content) => {
    const dom = new JSDOM(content);
    let codeSample = dom.window.document.documentElement.querySelectorAll('.CodeSample');
    console.log(content);
    for (var i = 0; i < codeSample.length; i++) {
        let language = codeSample[i].getAttribute('programmingLanguage');
        let platform = codeSample[i].getAttribute('platform');
        let content = codeSample[i].innerHTML;
        codeSample[i].outerHTML = '<pre class="line-numbers" data-platform-code="' + platform + '"><div class="infobar"><ul class="infobar__languages"><li class="infobar__lang">' + language + '</li></ul><div class="infobar__copy"></div></div><div class="clean-code">' + content + '</div></pre>'; 
        console.log(codeSample[i].outerHTML);
    }

    return dom.window.document.documentElement.querySelector('body').innerHTML;
};

const convertCommentsToTags = (obj, key) => {
    if (key === 'description') {
        const dom = new JSDOM(obj[key]);
        let content = dom.window.document.documentElement.querySelector('body').innerHTML;
        let regexOpeningTag = /<!--(Callout|CodeSample|CodeSamples)([ a-zA-Z=0-9]*)-->/g;
        let regexClosingTag = /<!--(Callout-end|CodeSample-end|CodeSamples-end)-->/g;
        content = content.replace(regexOpeningTag, '<div class="$1"$2>');
        content = content.replace(regexClosingTag, '</div>');
        content = resolveCallout(content);
        content = resolveCodeSample(content);
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

const renderCodeBlocksMarkup = (url) => {
    request.get(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            var json = yaml.safeLoad(body);
            json = traverseObject(json, convertCommentsToTags);
            json = JSON.stringify(json);

            var stream = fs.createWriteStream('./helpers/redoc-cli/openapi.json');
            stream.once('open', function (fd) {
                stream.write(json);
                stream.end();
            });
        }
    });

    return url;
};

module.exports = renderCodeBlocksMarkup;