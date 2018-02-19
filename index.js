const config = require('./config');
const Storage = require('./storage');
const Auth = require('./auth');
const Notifications = require('./notifications');

const app = require('express')();

app.use(require('cors')());
app.use(require('morgan')('short'));
app.use(require('express-formidable')(config.formidable));

// Little ExpressJS trick... If you specify a route before app-wide middleware is loaded (JWT), the route is not
// covered by it. This is a status endpoint to assist load balancers in monitoring the service's presence.
app.get('/status', (req, res) => res.status(200).json({ status: 'OK '}));

Auth.init(config, app);
Storage.init(config);
Notifications.init(config);

app.post(config.uploadUri || '/upload', (req, res) => {
    Storage.processFiles(req, res)
        .then(uploads => Notifications.notifyUploads(req, res, uploads))
        .then(uploads => res.status(200).json({ status: 'OK', uploads }))
        .catch(e => {
            console.log(e);
            res.status(500).json({ status: 'ERROR', error: e.message });
        });
});

const port = process.env.PORT || config.port || 3000;
app.listen(port, () => console.log('STORS: Listening on port %d!', port));
