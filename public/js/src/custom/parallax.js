(function () {
    var parallax = document.querySelectorAll('[data-parallax]');

    window.addEventListener('scroll', function () {
        for (var i = 0; i < parallax.length; i++) {
            var parallaxTarget = document.querySelector('[data-parallax-target="' + parallax[i].getAttribute('data-parallax') + '"]');
            var viewportOffset = parallax[i].getBoundingClientRect();
            var visibilityIndex = viewportOffset.top / window.innerHeight * 100;
            if (visibilityIndex >= 0 && visibilityIndex <= 100) {
                var parallaxOffset = parseInt(getComputedStyle(parallaxTarget).bottom);
                parallaxTarget.style.transform = 'translate3d(0, ' + Math.floor(parallaxOffset - (visibilityIndex / 100 * parallaxOffset)) + 'px, 0)';
            }
        }
    });
})();
