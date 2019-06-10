/**
 * Helper functions used in other JS files in the ../custom folder
 */
let recaptchaKey;
window.helper = (() => {

    // Find a parent of the "el" element specified by the "parentSelector" param
    const getParents = (el, parentSelector) => {
        if (parentSelector === undefined) {
            parentSelector = document;
        }

        var parents = [];
        var p = el.parentNode;

        while (p !== parentSelector) {
            var o = p;
            parents.push(o);
            p = o.parentNode;
        }
        parents.push(parentSelector);

        return parents;
    };

    const findAncestor = (el, sel) => {
        while ((el = el.parentElement) && !((el.matches || el.matchesSelector).call(el, sel)));
        return el;
    };

    const htmlDecode = (input) => {
        var e = document.createElement('textarea');
        e.innerHTML = input;
        // handle case of empty input
        return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
    };

    // Get full height of an element
    const outerHeight = (el) => {
        var height = el.offsetHeight;
        var style = getComputedStyle(el);

        height += parseInt(style.marginBottom) + parseInt(style.marginTop);
        return height;
    };

    // Helper function for event listeners bind to scroll events that makes them fire on setTimeout
    const debounce = (func, wait, immediate) => {
        var timeout;

        return function () {
            var context = this,
                args = arguments;

            var later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };

            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    // Converts string to node
    const createElementFromHTML = (htmlString) => {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();

        // Change this to div.childNodes to support multiple top-level nodes
        return div.firstChild;
    };

    // Stores text in a clipboard
    const copyToClipboard = (text) => {
        var textArea = document.createElement("textarea");

        //
        // *** This styling is an extra step which is likely not required. ***
        //
        // Why is it here? To ensure:
        // 1. the element is able to have focus and selection.
        // 2. if element was to flash render it has minimal visual impact.
        // 3. less flakyness with selection and copying which **might** occur if
        //    the textarea element is not visible.
        //
        // The likelihood is the element won't even render, not even a flash,
        // so some of these are just precautions. However in IE the element
        // is visible whilst the popup box asking the user for permission for
        // the web page to copy to the clipboard.
        //

        // Place in top-left corner of screen regardless of scroll position.
        textArea.style.position = 'fixed';
        textArea.style.top = 0;
        textArea.style.left = 0;

        // Ensure it has a small width and height. Setting to 1px / 1em
        // doesn't work as this gives a negative w/h on some browsers.
        textArea.style.width = '2em';
        textArea.style.height = '2em';

        // We don't need padding, reducing the size if it does flash render.
        textArea.style.padding = 0;

        // Clean up any borders.
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';

        // Avoid flash of white box if rendered for any reason.
        textArea.style.background = 'transparent';


        textArea.value = text;

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
        } catch (err) {
            console.log('Oops, unable to copy');
        }

        document.body.removeChild(textArea);
    };

    // Ajax GET call
    const ajaxGet = (url, callback, type) => {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('GET', url, true);
        xmlhttp.onreadystatechange = () => {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                try {
                    var data;

                    if (type === 'json') {
                        // Parse JSON if specified in the "type" param
                        data = JSON.parse(xmlhttp.responseText);
                    } else {
                        data = xmlhttp.responseText
                    }
                } catch (err) {
                    return;
                }
                callback(data);
            }
        };

        xmlhttp.send();
    };

    // Ajax POST call
    const ajaxPost = (url, requestData, callback, type) => {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('POST', url, true);
        xmlhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xmlhttp.onload = () => {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                try {
                    var data;

                    if (type === 'json') {
                        // Parse JSON if specified in the "type" param
                        data = JSON.parse(xmlhttp.responseText);
                    } else {
                        data = xmlhttp.responseText
                    }
                } catch (err) {
                    return;
                }
                return callback(data);
            }
        };
        xmlhttp.send(JSON.stringify(requestData));
    };

    // Get url parameter by its name
    const getParameterByName = (name, url) => {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    };

    // Get page url and remove query string parameters specified in the params array
    const removeParametersByNames = (params) => {
        let url = window.location.href.split('#');
        let hash = url[1] || '';
        let path = url[0].split('?');
        let qString = path.length > 1 ? path[1].split('&') : [];

        for (let i = 0; i < qString.length; i++) {
            let name = qString[i].split('=')[0];

            for (let j = 0; j < params.length; j++) {
                if (name === params[j]) {
                    qString.splice(i, 1);
                    i--;
                }
            }
        }
        qString = qString.join('&');
        return path[0] + (qString ? '?' + qString : '') + (hash ? '#' + hash : '');
    }

    // Add link tag to page head and make it load and behave as stylesheet
    const addStylesheet = (url) => {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
    };

    // Request stylesheet, append additional font-display property and in-line it in page head
    const loadStylesheet = (url) => {
        ajaxGet(url, css => {
            css = css.replace(/}/g, 'font-display: swap; }');

            const head = document.getElementsByTagName('head')[0];
            const style = document.createElement('style');
            style.appendChild(document.createTextNode(css));
            head.appendChild(style);
        });
    };

    const decodeHTMLEntities = (text) => {
        var entities = [
            ['amp', '&'],
            ['apos', '\''],
            ['#x27', '\''],
            ['#x2F', '/'],
            ['#39', '\''],
            ['#47', '/'],
            ['lt', '<'],
            ['gt', '>'],
            ['nbsp', ' '],
            ['quot', '"']
        ];

        for (var i = 0, max = entities.length; i < max; ++i) {
            text = text.replace(new RegExp('&' + entities[i][0] + ';', 'g'), entities[i][1]);
        }

        return text;
    };

    const setCookie = (name, value, days) => {
        var expires = '';
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/';
    };

    const getCookie = (name) => {
        var nameEQ = name + '=';
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    };

    const eraseCookie = (name) => {
        document.cookie = name + '=; Max-Age=-99999999;';
    };

    const loadRecaptcha = () => {
        let recaptchaElem = document.querySelector('#recaptcha-script');
        recaptchaKey = recaptchaElem.getAttribute('data-site');

        if (recaptchaElem && recaptchaKey) {
            var script = document.createElement('script');
            script.src = 'https://www.google.com/recaptcha/api.js?onload=renderReCaptcha';
            recaptchaElem.appendChild(script);
        }
    };

    return {
        getParents: getParents,
        findAncestor: findAncestor,
        htmlDecode: htmlDecode,
        outerHeight: outerHeight,
        debounce: debounce,
        createElementFromHTML: createElementFromHTML,
        copyToClipboard: copyToClipboard,
        ajaxGet: ajaxGet,
        ajaxPost: ajaxPost,
        getParameterByName: getParameterByName,
        removeParametersByNames: removeParametersByNames,
        loadStylesheet: loadStylesheet,
        addStylesheet: addStylesheet,
        decodeHTMLEntities: decodeHTMLEntities,
        setCookie: setCookie,
        getCookie: getCookie,
        eraseCookie: eraseCookie,
        loadRecaptcha: loadRecaptcha
    }
})();

const renderReCaptcha = function () {
    grecaptcha.render('g-recaptcha-placeholder', {
        'sitekey': recaptchaKey,
        'theme': 'light'
    });
};

// Adds forEach function to NodeList class prototype
// Adds matches function for IE11
(() => {
    if (typeof NodeList.prototype.forEach === 'function') {
        return false;
    } else {
        NodeList.prototype.forEach = Array.prototype.forEach;
    }

    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    }
})();