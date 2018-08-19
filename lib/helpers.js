/*
 
 * Helpers for various tasks
 *
 */

// Dependencies
var config = require('./config');
var crypto = require('crypto');
var https = require('https');
var querystring = require('querystring');
var path = require('path');
var fs = require('fs');

// Container for all the helpers
var helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
  try{
    var obj = JSON.parse(str);
    return obj;
  } catch(e){
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = function(str){
  if(typeof(str) == 'string' && str.length > 0){
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength){
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if(strLength){
    // Define all the possible characters that could go into a string
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    var str = '';
    for(i = 1; i <= strLength; i++) {
        // Get a random charactert from the possibleCharacters string
        var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        // Append this character to the string
        str+=randomCharacter;
    }
    // Return the final string
    return str;
  } else {
    return false;
  }
};

// Do payment via Stripe API
helpers.proceedPayment = function(email,amount,callback){
  // load from config file
  const currency = config.stripe.currency; 

  // For testing payment, using a testing data token provided by Stripe
  const source = config.stripe.source;
  const payload = querystring.stringify({
    amount,
    currency,
    source,
    description: 'charging for the car items'
  });

  const requestDetails = {
    protocol: "https:",
    method: "POST",
    hostname: "api.stripe.com",
    path: "/v1/charges",
    headers: {
      Authorization: `Bearer ${config.stripe.skey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(payload)
    }
  };
   
    // Instantiate the request object
    var req = https.request(requestDetails,function(res){
        // Grab the status of the sent request
        var status =  res.statusCode;
        // Callback successfully if the request went through
        if(status == 200 || status == 201){
          var msg = 'Payment was succesful, your order will reach soon. Enjoy your meal!';
          helpers.sendEmail(email,msg,amount,callback);
        } else {
          var msg = 'Payment was not succesful, your order isn\'t confirmed. Please try again with valid credentials!';
          helpers.sendEmail(email,msg,amount,callback);
        }
        helpers.createOrderId(email,status,amount,msg);
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error',function(e){
      callback(e);
    });

    // Add the payload
    req.write(payload);

    // End the request
    req.end();
};

//send Email via mailGun API
helpers.sendEmail = function(email,msg,amount,callback){
  const payload = querystring.stringify({
        from: config.mailgun.from,
        to : email,
        msg : msg 
      });

  const reqOptions = {
        protocol: "https:",
        method: "POST",
        hostname: "api.mailgun.net",
        path:
          "/v3/sandbox4eb2aa369f714ca3a918e02ae6d34ed2.mailgun.org/messages",
        auth: `api:${config.mailgun.key}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(payload)
        }
  };
  const req = https.request(reqOptions, res => {
        if (res.statusCode === 200) {
          callback(200,'Email sent');
        } else {
          callback(500,{'Error': 'couldnot send email'});
        }
      });
  // Bind to the error event so it doesn't get thrown
  req.on('error',function(e){
      callback(e);
  });

  // Add the payload
  req.write(payload);

  // End the request
  req.end();
};

// Create the oderId and store other informations about the order
helpers.createOrderId = function(email,status,amount,msg){
  var orderId = helpers.createRandomString(20);

  var orderObject = {
    'email' : email,
    'status' : status,
    'email sent' : msg,
    'orderId' : orderId,
    'items ordered' : handlers.userObject.cartItems.length(),
    'amount' : amount,
    'date' : Date.now()
  };

  //Store the order information
        _data.create('orders',orderId,orderObject,function(err){
          if(!err){
            callback(200);
          } else{
            callback(500,{'Error' : 'Could not create the new order'});
          }
        });
};

// Get the string content of a template, and use provided data for string interpolation
helpers.getTemplate = function(templateName,data,callback){
  templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
  data = typeof(data) == 'object' && data !== null ? data : {};
  if(templateName){
    var templatesDir = path.join(__dirname,'/../templates/');
    fs.readFile(templatesDir+templateName+'.html', 'utf8', function(err,str){
      if(!err && str && str.length > 0){
        // Do interpolation on the string
        var finalString = helpers.interpolate(str,data);
        callback(false,finalString);
      } else {
        callback('No template could be found');
      }
    });
  } else {
    callback('A valid template name was not specified');
  }
};

// Add the universal header and footer to a string, and pass provided data object to header and footer for interpolation
helpers.addUniversalTemplates = function(str,data,callback){
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data !== null ? data : {};
  // Get the header
  helpers.getTemplate('_header',data,function(err,headerString){
    if(!err && headerString){
      // Get the footer
      helpers.getTemplate('_footer',data,function(err,footerString){
        if(!err && headerString){
          // Add them all together
          var fullString = headerString+str+footerString;
          callback(false,fullString);
        } else {
          callback('Could not find the footer template');
        }
      });
    } else {
      callback('Could not find the header template');
    }
  });
};

// Take a given string and data object, and find/replace all the keys within it
helpers.interpolate = function(str,data){
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data !== null ? data : {};

  // Add the templateGlobals to the data object, prepending their key name with "global."
  for(var keyName in config.templateGlobals){
     if(config.templateGlobals.hasOwnProperty(keyName)){
       data['global.'+keyName] = config.templateGlobals[keyName]
     }
  }
  // For each key in the data object, insert its value into the string at the corresponding placeholder
  for(var key in data){
     if(data.hasOwnProperty(key) && typeof(data[key] == 'string')){
        var replace = data[key];
        var find = '{'+key+'}';
        str = str.replace(find,replace);
     }
  }
  return str;
};

// Get the contents of a static (public) asset
helpers.getStaticAsset = function(fileName,callback){
  fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
  if(fileName){
    var publicDir = path.join(__dirname,'/../public/');
    fs.readFile(publicDir+fileName, function(err,data){
      if(!err && data){
        callback(false,data);
      } else {
        callback('No file could be found');
      }
    });
  } else {
    callback('A valid file name was not specified');
  }
};

// Export helpers
module.exports = helpers;