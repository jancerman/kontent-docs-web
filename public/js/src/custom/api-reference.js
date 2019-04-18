(() => {
    const redoc = document.querySelector('#redoc');

    redoc.addEventListener('click', (e) => {
        if (e.target && e.target.matches('.react-tabs__tab')) {
            var idName = e.target.innerHTML.replace(/\./g, '_').toLowerCase();
            helper.setCookie('KCDOCS.preselectedLanguage', idName);

            document.querySelectorAll('.react-tabs__tab').forEach((item) => {
                console.log(idName);
                var currentIdName = item.innerHTML.replace(/\./g, '_').toLowerCase();
                if (idName === currentIdName) {
                    item.click();
                }
            });
        }
    });

    /*
    document.querySelectorAll('.react-tabs__tab').forEach((item) => {
        item.addEventListener('click', (e) => {
            console.log(e.target.innerHTML);
        });
    });*/

})();