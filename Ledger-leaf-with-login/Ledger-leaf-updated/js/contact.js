

(function () {
    'use strict';

    const form = document.getElementById('contactForm');
    if (!form) return; // Not on the contact page — nothing to do.

    const fields = {
        fullName: document.getElementById('fullName'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone'),
        topic: document.getElementById('topic'),
        message: document.getElementById('message'),
        consent: document.getElementById('consent')
    };

    const statusBox = document.getElementById('formStatus');
    const charCount = document.getElementById('charCount');

    const validators = {
        fullName: function (value) {
            if (!value.trim()) return 'Please enter your name.';
            if (value.trim().length < 2) return 'Name must be at least 2 characters.';
            return '';
        },
        email: function (value) {
            const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value.trim()) return 'Please enter your email address.';
            if (!pattern.test(value.trim())) return 'Please enter a valid email address.';
            return '';
        },
        phone: function (value) {
            // Optional field — only validate if something was typed.
            if (!value.trim()) return '';
            const pattern = /^[0-9+\-\s()]{7,15}$/;
            if (!pattern.test(value.trim())) return 'Please enter a valid phone number.';
            return '';
        },
        topic: function (value) {
            if (!value) return 'Please select a topic.';
            return '';
        },
        message: function (value) {
            if (!value.trim()) return 'Please write a message.';
            if (value.trim().length < 10) return 'Message should be at least 10 characters.';
            if (value.length > 500) return 'Message must be 500 characters or fewer.';
            return '';
        },
        consent: function (checked) {
            if (!checked) return 'Please confirm you agree to be contacted.';
            return '';
        }
    };

    function setFieldError(name, errorMessage) {
        const input = fields[name];
        const errorEl = document.getElementById(name + 'Error');

        if (errorMessage) {
            input.classList.add('is-invalid');
            errorEl.textContent = errorMessage;
        } else {
            input.classList.remove('is-invalid');
            errorEl.textContent = '';
        }
    }

    /**
     * Validate a single field by name and update its error display.
     * @returns {boolean} true if valid
     */
    function validateField(name) {
        const input = fields[name];
        const value = name === 'consent' ? input.checked : input.value;
        const errorMessage = validators[name](value);
        setFieldError(name, errorMessage);
        return errorMessage === '';
    }

    /**
     * Validate every field in the form.
     * @returns {boolean} true if the whole form is valid
     */
    function validateForm() {
        let isValid = true;
        Object.keys(validators).forEach(function (name) {
            const fieldIsValid = validateField(name);
            if (!fieldIsValid) isValid = false;
        });
        return isValid;
    }

    /**
     * Display a status banner above the form.
     */
    function showStatus(message, type) {
        statusBox.textContent = message;
        statusBox.className = 'form__status is-visible form__status--' + type;
    }

    function hideStatus() {
        statusBox.className = 'form__status';
        statusBox.textContent = '';
    }

    // Live character counter for the message field
    fields.message.addEventListener('input', function () {
        charCount.textContent = String(fields.message.value.length);
    });

    // Validate each field as the user leaves it (blur), for early feedback
    Object.keys(validators).forEach(function (name) {
        const input = fields[name];
        const eventName = (input.type === 'checkbox' || input.tagName === 'SELECT') ? 'change' : 'blur';
        input.addEventListener(eventName, function () {
            validateField(name);
        });
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        hideStatus();

        try {
            const isValid = validateForm();

            if (!isValid) {
                showStatus('Please fix the highlighted fields and try again.', 'error');
                // Move focus to the first invalid field for accessibility
                const firstInvalid = form.querySelector('.is-invalid');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            const submittedName = fields.fullName.value.trim();
            showStatus('Thanks, ' + submittedName + '! Your message has been received. We will reply within two business days.', 'success');

            form.reset();
            charCount.textContent = '0';
            Object.keys(validators).forEach(function (name) {
                setFieldError(name, '');
            });

        } catch (error) {
            console.error('Contact form error:', error);
            showStatus('Something went wrong while sending your message. Please try again.', 'error');
        }
    });
})();
