(function () {
    'use strict';

    var AUTH_KEY = 'll_users';
    var SESSION_KEY = 'll_session';

    /* ── Storage helpers ── */
    function getUsers() {
        try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || {}; }
        catch (e) { return {}; }
    }

    function saveUsers(users) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(users));
    }

    function getSession() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
        catch (e) { return null; }
    }

    function saveSession(user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }

    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }

    /* ── Public API ── */
    window.Auth = {
        register: function (name, email, password) {
            var users = getUsers();
            var key = email.toLowerCase().trim();
            if (users[key]) return { ok: false, message: 'An account with this email already exists.' };
            users[key] = {
                name: name.trim(),
                email: key,
                passwordHash: btoa(password) // simple obfuscation (not crypto-secure)
            };
            saveUsers(users);
            saveSession({ name: users[key].name, email: key });
            return { ok: true };
        },

        login: function (email, password) {
            var users = getUsers();
            var key = email.toLowerCase().trim();
            var user = users[key];
            if (!user || user.passwordHash !== btoa(password)) {
                return { ok: false, message: 'Incorrect email or password.' };
            }
            saveSession({ name: user.name, email: key });
            return { ok: true };
        },

        logout: function () {
            clearSession();
            window.location.href = rootPath() + 'pages/login.html';
        },

        currentUser: function () {
            return getSession();
        },

        requireAuth: function () {
            if (!getSession()) {
                window.location.href = rootPath() + 'pages/login.html';
                return false;
            }
            return true;
        }
    };

    /* ── Utility: figure out root relative to current page ── */
    function rootPath() {
        var path = window.location.pathname;
        return path.includes('/pages/') ? '../' : '';
    }

    /* ── Inject user widget into nav when logged in ── */
    document.addEventListener('DOMContentLoaded', function () {
        var session = getSession();
        var nav = document.querySelector('.nav__links');
        if (!nav) return;

        // Replace "Open App" CTA link text and add user widget
        var ctaEl = nav.querySelector('.nav__cta');
        if (session) {
            // Add user pill before the CTA
            var li = document.createElement('li');
            li.innerHTML =
                '<div class="nav__user">' +
                '<span class="nav__user-name">' + escHtml(session.name) + '</span>' +
                '<button class="nav__logout btn btn--ghost" id="logoutBtn" style="padding:6px 14px;font-size:0.85rem;">Log out</button>' +
                '</div>';
            if (ctaEl) {
                nav.insertBefore(li, ctaEl.parentElement);
            } else {
                nav.appendChild(li);
            }
            var logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) logoutBtn.addEventListener('click', function () { window.Auth.logout(); });
        } else {
            // Replace CTA with login link
            var loginLi = document.createElement('li');
            loginLi.innerHTML = '<a href="' + rootPath() + 'pages/login.html" class="nav__cta">Log in</a>';
            if (ctaEl) {
                nav.replaceChild(loginLi, ctaEl.parentElement);
            } else {
                nav.appendChild(loginLi);
            }
        }
    });

    function escHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

})();
