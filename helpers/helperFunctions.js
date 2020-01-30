const axios = require('axios');
const cache = require('memory-cache');
// var fs = require('fs');

const helper = {
    escapeHtml: (unsafe) => {
        return unsafe
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },
    removeNewLines: (unsafe) => {
        return unsafe.replace(/\r?\n|\r/g, '');
    },
    getFormValue: (formValues, fieldName) => {
        var value = '';
        if (typeof formValues !== 'undefined') {
            value = formValues[fieldName] || '';
        }
        return value;
    },
    getValidationMessages: (errors, data) => {
        errors.forEach((item) => {
            if (item.msg) {
                if (data.elements && data.elements[item.msg] && data.elements[item.msg].value) {
                    item.msg = data.elements[item.msg].value;
                }

                if (data.content && data.content[item.msg] && data.content[item.msg].value) {
                    item.msg = data.content[item.msg].value;
                }
            }
        });

        return errors;
    },
    getPrismClassName: (item) => {
        let lang;
        const pairings = {
            rest: 'shell',
            shell: 'shell',
            curl: 'shell',
            _net: 'dotnet',
            c_: 'dotnet',
            javascript: 'js',
            json: 'js',
            typescript: 'ts',
            java: 'java',
            android: 'java',
            javarx: 'java',
            php: 'php',
            swift: 'swift',
            python: 'python',
            ruby: 'ruby'
        }

        if (item && item.codename) {
            lang = pairings[item.codename];
        }

        if (!lang) {
            lang = 'clike';
        }

        return `lang-${lang}`;
    },
    stripTags: (text) => {
        return text.replace(/<\/?[^>]+(>|$)/g, '');
    },
    resolveMacros: (text) => {
        // If macro in format {@ sometext @}, replace it by icon
        let replaced = text.replace(/{@[^@]+@}/g, (match) => {
            const text = match.replace('{@', '').replace('@}', '').split('|');
            const icon = text.length ? text[0] : '';
            const tooltip = text.length > 1 ? text[1] : '';

            return `<i aria-hidden="true" class="icon ${icon}">${tooltip ? `<span class="icon__tooltip">${tooltip}</span>` : ''}</i>`;
        });

        // If macro in format {~ sometext ~}, replace it by inline code
        replaced = replaced.replace(/{~[^~]+~}/g, (match) => {
            return `<code>${match.replace('{~', '').replace('~}', '')}</code>`;
        });

        return replaced;
    },
    capitalizeFirstLetter: (text) => {
        return text.charAt(0).toUpperCase() + text.slice(1)
    },
    replaceWhitespaceWithDash: (text) => {
        return text.replace(/\s/g, '-');
    },
    removeUnderscoreElems: (elems) => {
        for (let i = 0; i < elems.length; i++) {
            if (elems[i].startsWith('_')) {
                const index = elems.indexOf(elems[i]);
                if (index > -1) {
                    elems.splice(index, 1);
                }
            }
        }

        return elems;
    },
    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    hasLinkedItemOfType: (field, type) => {
        for (const item of field.linkedItems_custom) {
            if (item.type === type) {
                return true;
            }
        }
        return false;
    },
    getReferenceFiles: async (codename, saveToCache, KCDetails, methodName) => {
        let data;
        const baseURL = process.env.referenceRenderUrl;
        const time = (new Date()).toISOString();

        try {
            data = await axios.get(`${baseURL}/api/ProviderStarter?api=${codename}&isPreview=${KCDetails.isPreview ? 'true' : 'false'}&source=${KCDetails.host}&method=${methodName}&t=${time}`);
            /* data = {};
            fs.readFile('./helpers/delivery_api.html', (err, text) => { // management_api_v2
                if (err) {
                    throw err;
                }
                data.data = text;
            }); */
        } catch (err) {
            try {
                if (baseURL) {
                    data = await axios.get(`https://${KCDetails.isPreview ? 'kcddev' : 'kcdmaster'}.blob.core.windows.net/api-reference-pages/${codename}${KCDetails.isPreview ? '-preview' : ''}.html`);
                }
            } catch (err) {
                data = {};
                data.data = '';
            }
        }

        if (saveToCache) {
            cache.put(`reDocReference_${codename}_${KCDetails.projectid}`, data);
        }

        return data;
    }
};

module.exports = helper;
