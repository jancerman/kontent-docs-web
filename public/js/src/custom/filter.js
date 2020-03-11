(() => {
    const FILTER_ACTIVE_CLASSNAME = 'filter__item--active';

    const itemInteractionServices = (target, filterElems) => {
        const filterItems = helper.findAncestor(target, '.filter__list').querySelectorAll('.filter__item');

        if (target.classList.contains(FILTER_ACTIVE_CLASSNAME)) {
            target.classList.remove(FILTER_ACTIVE_CLASSNAME);
        } else {
            target.classList.add(FILTER_ACTIVE_CLASSNAME);
        }

        const activeFilterItems = Array.prototype.slice.call(filterItems).filter((elem) => {
            return elem.classList.contains(FILTER_ACTIVE_CLASSNAME);
        });
        const activeFilterCodenames = [];

        for (let i = 0; i < activeFilterItems.length; i++) {
            activeFilterCodenames.push(activeFilterItems[i].getAttribute('data-filter-option'));
        }

        for (let i = 0; i < filterElems.length; i++) {
            filterElems[i].classList.remove('filter-hidden');

            if (activeFilterCodenames.length) {
                const items = filterElems[i].getAttribute('data-filter-item').split(' ');
                let isShown = false;
                for (let j = 0; j < activeFilterCodenames.length; j++) {
                    for (let k = 0; k < items.length; k++) {
                        if (activeFilterCodenames[j] === items[k]) {
                            isShown = true;
                        }
                    }
                }

                if (!isShown) {
                    filterElems[i].classList.add('filter-hidden');
                }
            }
        }
    };

    const itemInteractionChanges = (target, filterElems) => {
        const filterItems = helper.findAncestor(target, '.filter__list').querySelectorAll('.filter__item');

        for (let i = 0; i < filterItems.length; i++) {
            filterItems[i].classList.remove(FILTER_ACTIVE_CLASSNAME);
        }
        target.classList.add(FILTER_ACTIVE_CLASSNAME);

        const activeFilterItems = Array.prototype.slice.call(filterItems).filter((elem) => {
            return elem.classList.contains(FILTER_ACTIVE_CLASSNAME);
        });
        const activeFilterCodename = activeFilterItems.length ? activeFilterItems[0].getAttribute('data-breaking-change-option') : '';

        for (let i = 0; i < filterElems.length; i++) {
            filterElems[i].classList.remove('breaking-hidden');
            if (activeFilterCodename === 'true') {
                const isBreaking = filterElems[i].getAttribute('data-breaking-change');
                if (isBreaking !== 'true') {
                    filterElems[i].classList.add('breaking-hidden');
                }
            }
        }
    };

    const filterInteractions = () => {
        const filterElems = document.querySelectorAll('[data-filter-item]');
        const breakingChangeElems = document.querySelectorAll('[data-breaking-change]');

        document.querySelector('body').addEventListener('click', (e) => {
            if (e.target) {
                if (e.target.matches('[data-filter-option]')) {
                    itemInteractionServices(e.target, filterElems);
                } else if (e.target.matches('[data-breaking-change-option]')) {
                    itemInteractionChanges(e.target, breakingChangeElems);
                }
            }
        });
    };

    filterInteractions();
})();
