const axios = require('axios');

const Notifications = {
    /**
     * Initialize the Notifications subsystem.
     *
     * @param {Object} config - Configuration block.
     */
    init(config) {
        this.options = config.notifications || {};

        if (!this.options.url) {
            console.log('NOTIFICATIONS: Will POST notifications to "%s".', this.options.url);
        } else {
            console.log('NOTIFICATIONS: Skipping notifications.');
        }
    },

    /**
     * Process the uploads for a request.
     *
     * @param {Object} req - Request.
     * @param {Object} res - Response.
     * @param {Array} uploads - Uploads processed.
     */
    notifyUploads(req, res, uploads) {
        if (!this.options.url) {
            return Promise.resolve(uploads);
        }

        const postData = Object.assign({}, {
            source: 'stors',
            event: 'upload',
            fields: res.fields,
            session: res.locals,
            uploads
        }, this.options.fields || {});

        return axios
            .post(this.options.url, postData)
            .then(() => uploads);
    },
};

module.exports = Notifications;
