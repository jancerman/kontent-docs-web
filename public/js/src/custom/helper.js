window.helper = (() => {
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

    const outerHeight = (el) => {
        var height = el.offsetHeight;
        var style = getComputedStyle(el);

        height += parseInt(style.marginBottom) + parseInt(style.marginTop);
        return height;
    };

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

    const createElementFromHTML = (htmlString) => {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();

        // Change this to div.childNodes to support multiple top-level nodes
        return div.firstChild;
    }

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
    }

    return {
        getParents: getParents,
        outerHeight: outerHeight,
        debounce: debounce,
        createElementFromHTML: createElementFromHTML,
        copyToClipboard: copyToClipboard
    }
})();

(() => {
    if (typeof NodeList.prototype.forEach === "function") {
        return false;
    } else {
        NodeList.prototype.forEach = Array.prototype.forEach;
    }
})();