const jwt = require('express-jwt');
require('express-unless');

const Auth = {
    init(config, app) {
        this.options = config.auth;
        if (!this.options) {
            // This module is optional
            console.log('AUTH: Skipping authentication, service is PUBLIC.');
            return;
        }

        if (this.options.secret === 'CHANGEME') {
            throw new Error('AUTH: You must change the JWT secret to enable authentication!');
        }

        console.log('AUTH: Enabling JWT authentication.');

        const requiresAuth = jwt(Object.assign({}, this.options, { resultProperty: 'locals.token' }));
        app.use(requiresAuth.unless({ path: ['/status'] }));
    }
};

module.exports = Auth;
