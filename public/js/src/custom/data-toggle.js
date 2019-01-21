(() => {
    document.querySelectorAll('[data-toggle-trigger]').forEach(item => {
        item.addEventListener('click', event => {
            event.preventDefault();

            let toToggle = item.getAttribute('data-toggle-trigger');
            let elemToToggle = document.querySelector(`[data-toggle-target="${toToggle}"]`);

            if (elemToToggle.classList.contains('toggle-active')) {
                item.classList.remove('trigger-active');
                elemToToggle.classList.remove('toggle-active');  
            } else {
                item.classList.add('trigger-active');
                elemToToggle.classList.add('toggle-active');

                let input = elemToToggle.querySelector('input');
                if (input) {
                    input.focus();
                }
            }
        });
    });
})();