(() => {
    // Iframes
    let monitor = setInterval(intervals, 100);

    function intervals() {
        let elem = document.activeElement;
        if (elem && elem.tagName === 'IFRAME' && elem.getAttribute('src') !== 'about:blank') {
            window.dataLayer.push({
                'event': 'click',
                'eventCategory': 'Embed',
                'eventAction': 'click',
                'eventLabel': elem.getAttribute('src'),
                'eventValue': window.location.pathname
            });

            clearInterval(monitor);
            monitor = setInterval(exitIframe.bind(null, elem), 100);
        }
    }

    function exitIframe(iframe) {
        let elem = document.activeElement;
        if ((elem && elem.tagName !== 'IFRAME') || (elem && elem !== iframe)) {
            clearInterval(monitor);
            monitor = setInterval(intervals, 100);
        }
    }
})();