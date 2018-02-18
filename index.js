const config = require('./config');
const Storage = require('./storage');
const Auth = require('./auth');
const Notifications = require('./notifications');

const app = require('express')();

app.use(require('cors')());
app.use(require('morgan')('short'));
app.use(require('express-formidable')(config.formidable));

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
