(() => {
    let btn = document.querySelector('[data-click="support"]');
    if (btn) {
        document.querySelector('[data-click="support"]').addEventListener('click', (e) => {
            if (Intercom) {
                Intercom('show');
            }
        });
    }
})();