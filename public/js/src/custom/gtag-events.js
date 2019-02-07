(() => {
    var monitor = setInterval(intervals, 100);

    function intervals() {
        var elem = document.activeElement;
        if (elem && elem.tagName == 'IFRAME') {
            
            gtag('event', 'click', {
                'event_category': 'Embed',
                'event_label': elem.getAttribute('src'),
                'event_action': 'click',
                'value': `/${window.location.pathname}`
            });

            clearInterval(monitor);
            monitor = setInterval(exitIframe.bind(null, elem), 100);
        }
    }

    function exitIframe(iframe) {
        var elem = document.activeElement;
        if ((elem && elem.tagName != 'IFRAME') || (elem && elem != iframe)) {
            clearInterval(monitor);
            monitor = setInterval(intervals, 100);
        }
    }
})();