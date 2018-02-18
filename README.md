# STORS

> File upload and management service with support for thumbnailing, S3 storage, and JWT-based user authentication

STORS is a straightforward ExpressJS app for receiving and storing user uploads. There are many modules like this
available (e.g. `multer-s3`) but STORS was designed to address a few use cases that some applications have that are
not provided by other solutions:

  1. Upload requests can be validated by checking for a JWT auth token. The JWT can be issued by another server (e.g.
  the back-end API the client application is talking to). This is much simpler and easier to use than S3 Signed Requests
  or other auth techniques.

  2. Metadata such as token contents, UUIDs, and date elements may be used to format clean, final URLs for uploaded
  assets.

  3. S3 is currently supported as a storage backend, but the storage layer is modular. New destinations may be easily
  added by implementing a simple module interface (`init()` and `store()`).

  4. After upload requests have been completed, a Webhook may be called with the information about the upload and the
  authentication block if enabled. This can allow back-ends to update database references to files without having to
  "trust" the user. The back-end could also kick of validation or post-processing routines.

## Installation and Configuration

Installation is simple. Just clone this repository into a suitable working directory, then copy `config.json.sample`
to `config.json` and customize to suit your needs. Run the service via `npm start`, although a NodeJS daemon manager
such as `ForeverJS` or `PM2` is recommended.

