

(function () {
    'use strict';

    function setupFaqAccordion() {
        const items = document.querySelectorAll('.faq-item');

        items.forEach(function (item) {
            const question = item.querySelector('.faq-item__q');

            question.addEventListener('click', function () {
                const isOpen = item.classList.contains('is-open');

                // Close all other items (single-open accordion)
                items.forEach(function (other) {
                    other.classList.remove('is-open');
                    other.querySelector('.faq-item__q').setAttribute('aria-expanded', 'false');
                });

                if (!isOpen) {
                    item.classList.add('is-open');
                    question.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', setupFaqAccordion);
})();
