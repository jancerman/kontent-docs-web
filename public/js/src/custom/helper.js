/**
 * Helper functions used in other JS files in the ../custom folder
 */
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

    // COnverts string to node
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
        xmlhttp.open("GET", url, true);
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

    return {
        getParents: getParents,
        outerHeight: outerHeight,
        debounce: debounce,
        createElementFromHTML: createElementFromHTML,
        copyToClipboard: copyToClipboard,
        ajaxGet: ajaxGet,
        getParameterByName: getParameterByName,
        loadStylesheet: loadStylesheet,
        addStylesheet: addStylesheet
    }
})();

// Adds forEach function to NodeList class prototype
(() => {
    if (typeof NodeList.prototype.forEach === "function") {
        return false;
    } else {
        NodeList.prototype.forEach = Array.prototype.forEach;
    }
})();