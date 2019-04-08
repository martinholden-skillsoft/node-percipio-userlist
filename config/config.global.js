const moment = require('moment');

const config = {};

// Indicates a name for the configuration
config.customer = 'none';
config.startTimestamp = moment()
  .utc()
  .format('YYYYMMDD_HHmmss');

// DEBUG Options - Enables the check for Fiddler, if running the traffic is routed thru Fiddler
config.debug = {};
// Check for fiddler
config.debug.checkFiddler = false;
// Fiddler IP address
config.debug.fiddlerAddress = '127.0.0.1';
// Fiddler Port
config.debug.fiddlerPort = '8888';
// Debug logging
// One of the supported default logging levels for winston - see https://github.com/winstonjs/winston#logging-levels
config.debug.loggingLevel = 'info';
config.debug.logpath = 'logs';
config.debug.logFile = `app_${config.startTimestamp}.log`;

// Site
config.site = {};
// Base URI to Percipio API
config.site.baseuri = 'https://api.percipio.com';
// ORG Id
config.site.orgid = null;
// Bearer Token
config.site.bearer = null;

// Default Userlist Request Query Parameters to /user-management end point
config.userlist = {};
config.userlist.request = {};
config.userlist.request.offset = null;
config.userlist.request.max = null;
config.userlist.request.updatedSince = null;

// Output
config.output = {};
// Path to save data
config.output.path = 'results';
// File name for the data
config.output.fileName = 'output.json';

// Global Web Retry Options for promise retry
// see https://github.com/IndigoUnited/node-promise-retry#readme
config.retry_options = {};
config.retry_options.retries = 3;
config.retry_options.minTimeout = 1000;
config.retry_options.maxTimeout = 2000;

// Page sizes for the requesting all content
config.paging = {};
config.paging.pageSize = 1000;

module.exports = config;
