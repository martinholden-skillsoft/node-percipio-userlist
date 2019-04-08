const config = require('./config.global');

config.customer = 'default';

// Debug logging
// One of the supported default logging levels for winston - see https://github.com/winstonjs/winston#logging-levels
// config.debug.loggingLevel = 'debug';
// Check for fiddler
config.debug.checkFiddler = false;
// Fiddler IP address
config.debug.fiddlerAddress = '127.0.0.1';
// Fiddler Port
config.debug.fiddlerPort = '8888';
// Debug logging
// One of the supported default logging levels for winston - see https://github.com/winstonjs/winston#logging-levels
// config.debug.loggingLevel = 'debug';
config.debug.logpath = 'results/output';
config.debug.logFile = `${config.customer}.log`;

// Site
config.site.orgid = process.env.CUSTOMER_ORGID || null;
config.site.bearer = process.env.CUSTOMER_BEARER || null;

// Output
// Path to save data
config.output.path = 'results/output';
// File name for the data
config.output.fileName = `${config.customer}.json`;

// Default Userlist Request Query Parameters to /user-management end point
// Always create new object to override defaults, set any parameters to NULL that are not wanted
config.userlist = {};
// This is the Userlist Request Query Parameters
config.userlist.request = {};
config.userlist.request.offset = null;
config.userlist.request.max = null;
config.userlist.request.updatedSince = null;

// Page sizes for the requesting all content
config.paging.pageSize = 25;

module.exports = config;
