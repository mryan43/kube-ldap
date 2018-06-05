// @flow
import 'babel-polyfill';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import ldap from 'ldapjs';
import {config} from './config';
import logger from './logger';
import {Authenticator, Client, Mapping} from './ldap';
import {Healthz, TokenAuthentication, UserAuthentication} from './api';

// setup basic dependencies
export let ldapClient = new Client(
  ldap.createClient({
    url: config.ldap.uri,
    timeout: config.ldap.timeout * 1000,
    connectTimeout: config.ldap.timeout * 1000,
    reconnect: true,
  }),
  config.ldap.baseDn,
  config.ldap.bindDn,
  config.ldap.bindPw
);
let authenticator = new Authenticator(ldapClient, config.ldap.filter, logger);

// setup api dependencies
let healthz = new Healthz();
let userAuthentication = new UserAuthentication(
  authenticator,
  config.jwt.tokenLifetime,
  config.jwt.key,
  new Mapping(
    config.mapping.username,
    config.mapping.uid,
    config.mapping.groups,
    config.mapping.extraFields,
  ),
  logger);
let tokenAuthentication = new TokenAuthentication(config.jwt.key, logger);

// setup express
const app = express();
app.use(cors());
app.use(morgan('combined', {
  stream: {
    write: (message, encoding) => {
      logger.info(message);
    },
  },
}));
app.get('/healthz', healthz.run);
app.get('/auth', userAuthentication.run);
app.post('/token', bodyParser.json(), tokenAuthentication.run);

logger.info('CONFIG: ldap uri [' + config.ldap.uri + ']');
logger.info('CONFIG: ldap timeout [' + config.ldap.timeout + ']');
logger.info('CONFIG: ldap bind DN [' + config.ldap.bindDn + ']');
logger.info('CONFIG: ldap bind PW [*******]');
logger.info('CONFIG: ldap search base DN [' + config.ldap.baseDn + ']');
logger.info('CONFIG: ldap search filter [' + config.ldap.filter + ']');
logger.info('CONFIG: mapping username [' + config.mapping.username + ']');
logger.info('CONFIG: mapping uid [' + config.mapping.uid + ']');
logger.info('CONFIG: mapping groups [' + config.mapping.groups + ']');

export default app;

