const Auth = {
    init(config, app) {
        this.options = config.auth;
        if (!this.options) {
            // This module is optional
            return;
        }

        if (this.options.secret === 'CHANGEME') {
            throw new Error('You must change the JWT secret to enable authentication!');
        }

        console.log('STORS: Enabling JWT authentication.');
        const jwt = require('express-jwt');
        app.use(jwt(Object.assign({}, this.options, { resultProperty: 'locals.token' })));
    }
};

module.exports = Auth;
