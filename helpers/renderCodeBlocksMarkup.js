const request = require('request');
const fs = require('fs');
const yaml = require('js-yaml');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

var findComments = function (context) {
    var foundComments = [];
    var elementPath = [context];
    while (elementPath.length > 0) {
        var el = elementPath.pop();
        for (var i = 0; i < el.childNodes.length; i++) {
            var node = el.childNodes[i];
            if (node.nodeType === 8) {
                foundComments.push(node);
            } else {
                elementPath.push(node);
                console.log(node.nodeValue);
            }
        }
    }

    return foundComments;
};

const findComponents = (obj, key) => {
    if (key === 'description') {
        obj.componentsToResolve = [];
        const dom = new JSDOM(obj[key]);
        var commentNodes = findComments(dom.window.document);
        for (var i = 0; i < commentNodes.length; i++) {
            if (commentNodes[i].nodeValue.split(' ')[0].indexOf('-end') === -1) {
                obj.componentsToResolve.push(commentNodes[i].nodeValue);
            }
        }
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
            // Render code blocks
            var json = yaml.safeLoad(body);
            json = traverseObject(json, findComponents);
            //console.log(json);

            var stream = fs.createWriteStream('./helpers/redoc-cli/openapi.yml');
            stream.once('open', function (fd) {
                stream.write(body);
                stream.end();
            });
        }
    });

    return url;
};

module.exports = renderCodeBlocksMarkup;