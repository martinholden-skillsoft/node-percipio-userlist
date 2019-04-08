const axios = require('axios');
const fs = require('fs');
const Path = require('path');
const _ = require('lodash');
const promiseRetry = require('promise-retry');
const globalTunnel = require('global-tunnel-ng');
// eslint-disable-next-line no-unused-vars
const pkginfo = require('pkginfo')(module);

const { transports } = require('winston');
const logger = require('./lib/logger');
const myutil = require('./lib/util');
const configuration = require('./config');

const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Retrieve the userlist
 *
 * @param {*} options
 * @returns
 */
const retrieveUserlist = async options => {
  return promiseRetry(async (retry, numberOfRetries) => {
    const loggingOptions = {
      label: 'retrieveUserlist'
    };

    let requestParams = options.userlist.request || {};

    // Remove any nulls
    requestParams = _.omitBy(requestParams, _.isNil);
    logger.debug(`Request Details: ${JSON.stringify(requestParams)}`, loggingOptions);

    const requestUri = `${options.site.baseuri}/user-management/v1/organizations/${
      options.site.orgid
    }/users`;

    logger.debug(`Request URI: ${requestUri}`, loggingOptions);

    const axiosConfig = {
      url: requestUri,
      headers: {
        Authorization: `Bearer ${options.site.bearer}`
      },
      method: 'GET',
      params: requestParams
    };

    logger.debug(`Axios Config: ${JSON.stringify(axiosConfig)}`, loggingOptions);

    try {
      const response = await axios.request(axiosConfig);
      logger.debug(`Response Headers: ${JSON.stringify(response.headers)}`, loggingOptions);
      logger.debug(`Response Body: ${JSON.stringify(response.data)}`, loggingOptions);

      return response;
    } catch (err) {
      logger.warn(
        `Trying to get Userlist. Got Error after Attempt# ${numberOfRetries} : ${err}`,
        loggingOptions
      );
      if (err.response) {
        logger.debug(`Response Headers: ${JSON.stringify(err.response.headers)}`, loggingOptions);
        logger.debug(`Response Body: ${JSON.stringify(err.response.data)}`, loggingOptions);
      } else {
        logger.debug('No Response Object available', loggingOptions);
      }
      if (numberOfRetries < options.polling_options.retries + 1) {
        retry(err);
      } else {
        logger.error('Failed to retrieve Userlist', loggingOptions);
      }
      throw err;
    }
  }, options.polling_options);
};

const retrieveAllUserlist = async options => {
  const loggingOptions = {
    label: 'retrieveUserlist'
  };

  const loopOptions = options;

  logger.info('Starting to retrieve all users', loggingOptions);

  const localOptions = {
    userlist: {
      request: {
        offset: 0,
        max: options.paging.pageSize
      }
    }
  };

  // merge opt with default config
  _.defaultsDeep(localOptions, loopOptions);

  let users = [];
  let keepGoing = true;

  while (keepGoing) {
    let response = null;
    try {
      logger.info(
        `Retrieving users ${localOptions.userlist.request.offset} to ${localOptions.userlist.request
          .offset + localOptions.userlist.request.max}`,
        loggingOptions
      );

      // eslint-disable-next-line no-await-in-loop
      response = await retrieveUserlist(localOptions);
    } catch (err) {
      logger.error('Failed to retrieve All Users', loggingOptions);
      keepGoing = false;
      users = [];
    }

    users = [...users, ...response.data];

    if (response.data.length < localOptions.userlist.request.max) {
      keepGoing = false;
    }

    // Set offset - number of records in response
    localOptions.userlist.request.offset += response.data.length;
  }
  return users;
};

/**
 * Process the report submit, polling and save the results
 *
 * @param {*} options
 * @returns
 */
const main = async configOptions => {
  const loggingOptions = {
    label: 'main'
  };

  const options = configOptions || null;

  if (_.isNull(options)) {
    logger.error('Invalid configuration', loggingOptions);
    return false;
  }

  // Set logging to silly level for dev
  if (NODE_ENV.toUpperCase() === 'DEVELOPMENT') {
    logger.level = 'silly';
  } else {
    logger.level = options.debug.loggingLevel;
  }

  // Create logging folder if one does not exist
  if (!_.isNull(options.debug.logpath)) {
    if (!fs.existsSync(options.debug.logpath)) {
      myutil.makeFolder(options.debug.logpath);
    }
  }

  // Add logging to a file
  logger.add(
    new transports.File({
      filename: Path.join(options.debug.logpath, options.debug.logFile),
      options: {
        flags: 'w'
      }
    })
  );

  logger.info(`Start ${module.exports.name}`, loggingOptions);

  logger.debug(`Options: ${JSON.stringify(options)}`, loggingOptions);

  if (options.debug.checkFiddler) {
    logger.info('Checking if Fiddler is running', loggingOptions);

    const result = await myutil.isFiddlerRunning(
      options.debug.fiddlerAddress,
      options.debug.fiddlerPort
    );

    if (result) {
      logger.info('Setting Proxy Configuration so requests are sent via Fiddler', loggingOptions);

      process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

      globalTunnel.initialize({
        host: options.debug.fiddlerAddress,
        port: options.debug.fiddlerPort
      });
    }
  } else {
    // Use the process.env.http_proxy and https_proxy
    globalTunnel.initialize();
  }

  if (_.isNull(options.site.orgid)) {
    logger.error(
      'Invalid configuration - no orgid in config file or set env CUSTOMER_ORGID',
      loggingOptions
    );
    return false;
  }

  if (_.isNull(options.site.bearer)) {
    logger.error('Invalid configuration - no bearer or set env CUSTOMER_BEARER', loggingOptions);
    return false;
  }

  // Create output folder if one does not exist
  if (!_.isNull(options.output.path)) {
    if (!fs.existsSync(options.output.path)) {
      myutil.makeFolder(options.output.path);
      logger.info(`Created output directory ${options.output.path}`, loggingOptions);
    }
  }

  retrieveAllUserlist(options)
    .then(data => {
      let outputFilename = options.output.fileName;

      // const { data, headers } = response;

      logger.info(`Userlist Retrieved. Records: ${data.length}`, loggingOptions);
      // logger.info(`Userlist Total Count: ${headers['x-total-count']}`, loggingOptions);

      logger.debug(`Response: ${JSON.stringify(data)}`, loggingOptions);

      if (!_.isNull(options.output.path)) {
        outputFilename = Path.join(options.output.path, outputFilename);
      }

      if (fs.existsSync(outputFilename)) {
        fs.unlinkSync(outputFilename);
        logger.debug(`Deleted old data. Filename: ${outputFilename}`, loggingOptions);
      }

      fs.writeFileSync(outputFilename, JSON.stringify(data));
      logger.info(`JSON written to ${outputFilename}`, loggingOptions);
    })
    .catch(err => {
      logger.error(`Error:  ${err}`, loggingOptions);
    });
  return true;
};

main(configuration);
