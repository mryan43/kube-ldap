// @flow
import https from 'https';
import fs from 'fs';
import {config} from './config';
import logger from './logger';
import app, {ldapClient} from './app';

let server;

const shutdown = function() {
  logger.info('shutting down...');
  if (server) {
    server.close();
    ldapClient.destroy();
  }
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGQUIT', shutdown);

if (config.tls.enabled) {
  server = https.createServer({
    cert: fs.readFileSync(config.tls.cert),
    key: fs.readFileSync(config.tls.key),
    ca: config.tls.ca ? fs.readFileSync(config.tls.ca) : null,
  }, app).listen(config.port, () => {
    logger.info(`kube-ldap listening on https port ${config.port}`);
  });
} else {
  app.listen(config.port, () => {
    logger.info(`kube-ldap listening on http port ${config.port}`);
  });
}


