(() => {
    // Iframes
    var monitor = setInterval(intervals, 100);

    function intervals() {
        var elem = document.activeElement;
        if (elem && elem.tagName == 'IFRAME') {
            window.dataLayer = window.dataLayer || [];
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
        var elem = document.activeElement;
        if ((elem && elem.tagName != 'IFRAME') || (elem && elem != iframe)) {
            clearInterval(monitor);
            monitor = setInterval(intervals, 100);
        }
    }

    // Search number of results
    const searchTerm = helper.getParameterByName('searchterm');
    const searchNumber = helper.getParameterByName('searchnumber');
    if (searchTerm && searchNumber) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event': 'event',
            'eventCategory': 'search--searched-results',
            'eventAction': searchTerm,
            'eventLabel': searchNumber
        });
    }
})();