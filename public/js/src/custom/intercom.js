(() => {
    let btn = document.querySelector('[data-click="support"]');
    if (btn) {
        btn.addEventListener('click', () => {
            if (Intercom) {
                Intercom('show');
            }
        });
    }
})();
