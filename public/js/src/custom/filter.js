(() => {
    const mixer = window.mixitup('.container', {
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
        }
    });

    mixer.setFilterGroupSelectors('changes', ['.all_changes']);
})();
