(function () {
    var updateRoomUrl = function (services, changes, page) {
        var loc = window.location;
        var url = loc.protocol + '//' + loc.hostname + (loc.port ? ':' + loc.port : '') + loc.pathname;
        var qs = [];
        if (services) {
            qs.push(`hide=${services}`);
        }
        if (changes === 'true') {
            qs.push(`breaking=${changes}`);
        }
        if (parseInt(page) > 1) {
            qs.push(`page=${page}`);
        }

        return `${url}${qs.length ? `?${qs.join('&')}` : ''}`;
    };

    var updateUrl = function (services, changes, page) {
        var url = updateRoomUrl(services, changes, page);
        if (history && history.replaceState) {
            history.replaceState({}, null, url);
        }
    };

    var getInactiveServices = function () {
        var items = document.querySelectorAll('[data-filter-group="services"] .filter__item:not(.filter__item--active)');
        var itemsAll = document.querySelectorAll('[data-filter-group="services"] .filter__item');

        if (items.length === itemsAll.length) {
            return '';
        }

        var codenames = [];

        for (var i = 0; i < items.length; i++) {
            codenames.push(items[i].getAttribute('data-toggle').replace('.', ''));
        }

        return codenames.join(',');
    };

    var getBreaking = function () {
        var item = document.querySelector('[data-filter-group="changes"] .filter__item--active');

        if (item && item.getAttribute('data-filter') === '.breaking_change') {
            return 'true';
        } else {
            return 'false';
        }
    };

    var setFilterOnLoad = function (url) {
        var hide = helper.getParameterByName('hide', url);
        var breaking = helper.getParameterByName('breaking', url);
        var page = helper.getParameterByName('page', url);

        if (hide) {
            hide = hide.split(',');
            var itemsAll = document.querySelectorAll('[data-filter-group="services"] .filter__item');
            for (var i = 0; i < itemsAll.length; i++) {
                var attr = itemsAll[i].getAttribute('data-toggle').replace('.', '');
                var isHidden = false;
                for (var j = 0; j < hide.length; j++) {
                    if (attr === hide[j]) {
                        isHidden = true;
                    }
                }
                if (!isHidden) {
                    itemsAll[i].click();
                }
            }
        }

        var item;
        if (breaking === 'true') {
            item = document.querySelector('[data-filter-group="changes"] [data-filter=".breaking_change"]');
        } else {
            item = document.querySelector('[data-filter-group="changes"] [data-filter=".all_changes"]');
        }
        if (item) {
            item.click();
        }

        item = document.querySelector(`.mixitup-page-list [data-page="${parseInt(page) > 1 ? page : '1'}"]`);
        if (item) {
            item.click();
        }
    };

    var mixer = window.mixitup('.container', {
        animation: {
            enable: false
        },
        classNames: {
            modifierActive: ' filter__item--active'
        },
        multifilter: {
            enable: true
        },
        pagination: {
            limit: 10,
            hidePageListIfSinglePage: true,
        },
        templates: {
            pagerPrev: '<button type="button" class="filter__prev" data-page="prev"></button>',
            pagerNext: '<button type="button" class="filter__next" data-page="next"></button>'
        },
        callbacks: {
            onMixEnd: function () {
                var state = mixer.getState();
                updateUrl(getInactiveServices(), getBreaking(), state.activePagination.page);
            }
        }
    });

    setFilterOnLoad();
})();
