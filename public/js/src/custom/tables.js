/**
 * Make tables spread reasonably it the page content
 */
(() => {

    // Set a wrapper to all tables
    const wrapTables = () => {
        let tables = document.querySelectorAll('table');

        if (tables.length > 0) {
            tables.forEach(item => {
                let wrapper = document.createElement('div');
                wrapper.classList.add('table__wrapper');
                item.parentNode.insertBefore(wrapper, item);
                wrapper.appendChild(item);

                let container = document.createElement('div');
                container.classList.add('table');
                wrapper.parentNode.insertBefore(container, wrapper);
                container.appendChild(wrapper);
            });
        }
    };

    // Force size of table to the very right of the viewport if number of cells if more than 5
    const setWrapperSize = helper.debounce(() => {
        let tables = document.querySelectorAll('.table');

        if (tables.length > 0) {
            let viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            let websiteWidth = document.querySelector('main').offsetWidth;
            let contentWidth = document.querySelector('.article__content').offsetWidth;
            let tableWidth = contentWidth + (viewportWidth - websiteWidth) / 2;

            tables.forEach(item => {
                let cellCount = item.querySelector('tr').childElementCount;

                if (cellCount >= 6) {
                    item.style.width = `${tableWidth}px`; 
                }
            });
        }   
    }, 250);

    // If cell count is lower than 6, set a max-size to them to prevent overflowing the table from the website container 
    const setCellMaxWidth = () => {
        let tables = document.querySelectorAll('table');
        let contentWidth = document.querySelector('.article__content').offsetWidth;

        if (tables.length > 0 && contentWidth > 768) {
            tables.forEach((item, index) => {
                let cellCount = item.querySelector('tr').childElementCount;

                if (cellCount < 6) {
                    let maxWidth = Math.floor(contentWidth / cellCount);
                    item.setAttribute('id', `table-${index}`);
                    item.insertAdjacentHTML('beforebegin', `<style>#table-${index} td{max-width:${maxWidth}px}</style>`);
                } 
            });
        }
    };

    if (document.querySelector('.article__content')) {
        wrapTables();
        setWrapperSize();
        setCellMaxWidth();
    
        window.addEventListener('resize', setWrapperSize);
    }
})();