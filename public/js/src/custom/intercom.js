(() => {
    let btn = document.querySelector('[data-click="support"]');
    if (btn) {
        document.querySelector('[data-click="support"]').addEventListener('click', () => {
            if (Intercom) {
                Intercom('show');
            }
        });
    }
})();