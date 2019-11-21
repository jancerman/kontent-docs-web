(() => {
    const getUniqueOptions = (options) => {
        const unique = [];

        for (let i = 0; i < options.length; i++) {
            const optionValue = options[i].getAttribute('data-filter-value');
            let exists = false;

            for (let j = 0; j < unique.length; j++) {
                const uniqueValue = unique[j].getAttribute('data-filter-value');

                if (optionValue === uniqueValue) {
                    exists = true;
                    break;
                }
            }

            if (!exists) {
                unique.push(options[i]);
            }
        }

        return unique;
    };

    const renderFilters = () => {
        const filters = document.querySelectorAll('[data-filter-selector]');

        for (let i = 0; i < filters.length; i++) {
            let options = document.querySelectorAll(`[data-filter-target=${filters[i].getAttribute('data-filter-selector')}]`);
            options = getUniqueOptions(options);

            let optionsMarkup = `<div class="filter-label">${filters[i].getAttribute('data-filter-selector-label')}</div><div class="filter"><div class="filter__label">All</div><ul class="filter__list"><li class="filter__item" data-filter-option="__all">All</li>`;

            for (let j = 0; j < options.length; j++) {
                optionsMarkup += `<li class="filter__item" data-filter-option="${options[j].getAttribute('data-filter-value')}">${options[j].getAttribute('data-filter-label')}</li>`;
            }

            optionsMarkup += '</ul></div>';

            filters[i].innerHTML = optionsMarkup;
        }
    };

    const labelInteraction = (target, filters) => {
        if (target.matches('.filter__label')) {
            const filter = helper.findAncestor(target, '.filter');

            if (filter.classList.contains('filter--opened')) {
                filter.classList.remove('filter--opened');
            } else {
                filter.classList.add('filter--opened');
            }
        } else {
            for (let i = 0; i < filters.length; i++) {
                filters[i].classList.remove('filter--opened');
            }
        }
    };

    const itemInteraction = (target, filterElems) => {
        if (target.matches('.filter__item')) {
            const filterLabel = helper.findAncestor(target, '.filter').querySelector('.filter__label');
            const filterItems = helper.findAncestor(target, '.filter__list').querySelectorAll('.filter__item');
            filterLabel.innerHTML = target.innerHTML;

            for (let i = 0; i < filterItems.length; i++) {
                filterItems[i].classList.remove('filter__item--active');
            }

            target.classList.add('filter__item--active');

            for (let i = 0; i < filterElems.length; i++) {
                filterElems[i].classList.remove('filter-hidden');

                const items = filterElems[i].getAttribute('data-filter-item').split(' ');

                if (items.indexOf(target.getAttribute('data-filter-option')) === -1) {
                    filterElems[i].classList.add('filter-hidden');
                }
            }
        }
    };

    const filterInteractions = () => {
        const filters = document.querySelectorAll('[data-filter-selector] .filter');
        const filterElems = document.querySelectorAll('[data-filter-item]');

        document.querySelector('body').addEventListener('click', (e) => {
            if (e.target) {
                labelInteraction(e.target, filters);
                itemInteraction(e.target, filterElems);
            }
        });
    };

    renderFilters();
    filterInteractions();
})();
