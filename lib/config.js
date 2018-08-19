/*
 * Create and export configuration variables
 *
 */

// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'staging',
  'hashingSecret' : 'thisIsASecret',
  'secretKey': "iL0veC4ch4ca",
  'stripe': {
    'pkey': "YOUR_OWN_KEY",
    'skey': "YOUR_OWN_KEY",
    'currency': "eur",
    'source': "tok_fr"
  },
   'mailgun': {
    'from': "YOUR_RECIPIENT_MAILGUN_EMAIL",
    'key': "YOUR_OWN_KEY"
  },
   'templateGlobals' : {
    'appName' : 'PizzaDelivery',
    'companyName' : 'NotARealCompany, Inc.',
    'yearCreated' : '2018',
    'baseUrl' : 'http://localhost:3000/'
  }
};

// Production environment
environments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'secretKey': "iL0veC4ch4ca",
  'stripe': {
    'pkey': "YOUR_OWN_KEY",
    'skey': "YOUR_OWN_KEY",
    'currency': "eur",
    'source': "tok_fr"
  },
   'mailgun': {
    'from': "YOUR_RECIPIENT_MAILGUN_EMAIL",
    'key': "YOUR_OWN_KEY"
  },
   'templateGlobals' : {
    'appName' : 'PizzaDelivery',
    'companyName' : 'NotARealCompany, Inc.',
    'yearCreated' : '2018',
    'baseUrl' : 'http://localhost:3000/'
  }
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;