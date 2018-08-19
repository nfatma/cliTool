/*
 *
 * CLI related tasks
 *
 */

 //Dependencies
 var readline = require('readline');
 var util = require('util');
 var debug = util.debuglog('cli');
 var events = require('events');
 class _events extends events{};
 var e = new _events();
 var os = require('os');
 var v8 = require('v8');
 var _data = require('./data');
 var helpers = require('./helpers');

 // Instantiate the CLI module object
 var cli = {};

 //Input handlers
 e.on('man',function(str){
 	cli.responders.help();
 });

 e.on('help',function(str){
 	cli.responders.help();
 });

 e.on('exit',function(str){
 	cli.responders.exit();
 });

e.on('stats',function(str){
 	cli.responders.stats();
 });

e.on('list users',function(str){
 	cli.responders.listUsers();
 });

e.on('more user info',function(str){
 	cli.responders.moreUserInfo(str);
 });

e.on('show menu',function(str){
 	cli.responders.showMenu();
 });

e.on('list orders',function(str){
  cli.responders.listOrders();
 });

e.on('more order info',function(str){
  cli.responders.showMenu(str);
 });


// Responders object
cli.responders = {};

  // Help / Man
cli.responders.help = function(){

  // Codify the commands and their explanations
  var commands = {
    'exit' : 'Kill the CLI (and the rest of the application)',
    'man' : 'Show this help page',
    'help' : 'Alias of the "man" command',
    'stats' : 'Get statistics on the underlying operating system and resource utilization',
    'List users' : 'Show a list of all the registered (undeleted) users in the system',
    'More user info --{userId}' : 'Show details of a specified user',
    'List orders' : 'Show a list of all the orders placed, including their state(successful/unsuccessful)',
    'More order info --{orderId}' : 'Show details of a specified order',
    'List menu' : 'Show a list of all the Menu Items'
  };

  // Show a header for the help page that is as wide as the screen
  cli.horizontalLine();
  cli.centered('CLI MANUAL');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Show each command, followed by its explanation, in white and yellow respectively
  for(var key in commands){
     if(commands.hasOwnProperty(key)){
        var value = commands[key];
        var line = '\x1b[33m'+key+'\x1b[0m';
        var padding = 50 - line.length;
        for (i = 0; i < padding; i++) {
            line+=' ';
        }
        line+=value;
        console.log(line);
        cli.verticalSpace();
     }
  }
  cli.verticalSpace(1);

  // End with another horizontal line
  cli.horizontalLine();

};

// Create a vertical space
cli.verticalSpace = function(lines){
  lines = typeof(lines) == 'number' && lines > 0 ? lines : 1;
  for (i = 0; i < lines; i++) {
      console.log('');
  }
};

// Create a horizontal line across the screen
cli.horizontalLine = function(){

  // Get the available screen size
  var width = process.stdout.columns;

  // Put in enough dashes to go across the screen
  var line = '';
  for (i = 0; i < width; i++) {
      line+='-';
  }
  console.log(line);


};

// Create centered text on the screen
cli.centered = function(str){
  str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : '';

  // Get the available screen size
  var width = process.stdout.columns;

  // Calculate the left padding there should be
  var leftPadding = Math.floor((width - str.length) / 2);

  // Put in left padded spaces before the string itself
  var line = '';
  for (i = 0; i < leftPadding; i++) {
      line+=' ';
  }
  line+= str;
  console.log(line);
};


// Exit
cli.responders.exit = function(){
	process.exit(0);
};

// stats
cli.responders.stats = function(){
	// Compile an object of stats
  var stats = {
    'Load Average' : os.loadavg().join(' '),
    'CPU Count' : os.cpus().length,
    'Free Memory' : os.freemem(),
    'Current Malloced Memory' : v8.getHeapStatistics().malloced_memory,
    'Peak Malloced Memory' : v8.getHeapStatistics().peak_malloced_memory,
    'Allocated Heap Used (%)' : Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
    'Available Heap Allocated (%)' : Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
    'Uptime' : os.uptime()+' Seconds'
  };

  // Create a header for the stats
  cli.horizontalLine();
  cli.centered('SYSTEM STATISTICS');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Log out each stat
  for(var key in stats){
     if(stats.hasOwnProperty(key)){
        var value = stats[key];
        var line = '\x1b[33m '+key+'\x1b[0m';
        var padding = 50 - line.length;
        for (i = 0; i < padding; i++) {
            line+=' ';
        }
        line+=value;
        console.log(line);
        cli.verticalSpace();
     }
  }

  // Create a footer for the stats
  cli.verticalSpace();
  cli.horizontalLine();

};

// List all users
cli.responders.listUsers = function(){
	_data.list('users',function(err,userIds){
    if(!err && userIds && userIds.length > 0){
      cli.verticalSpace();
      userIds.forEach(function(userId){
        _data.read('users',userId,function(err,userData){
          if(!err && userData && (Date.now() - userData.date <= 24 * 60 * 60 *1000)){
            var line = 'Name: '+userData.firstName+' '+userData.lastName+' Email: '+userData.email+' Cart: ';
            var numberOfItems = typeof(userData.cartItems) == 'object' && userData.cartItems instanceof Array && userData.cartItems.length > 0 ? userData.cartItems.length : 0;
            line+=numberOfItems;
            console.log(line);
            cli.verticalSpace();
          }
        });
      });
    }
  });
};

// moreUserInfo
cli.responders.moreUserInfo = function(str){
  // Get ID from string
  var arr = str.split('--');
  var userId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
  if(userId){
    // Lookup the user
    _data.read('users',userId,function(err,userData){
      if(!err && userData){
        // Remove the hashed password
        delete userData.hashedPassword;

        // Print their JSON object with text highlighting
        cli.verticalSpace();
        console.dir(userData,{'colors' : true});
        cli.verticalSpace();
      }
    });
  }

};

// List of all Orders
cli.responders.listOrders = function(str){
	 _data.list('orders',function(err,orderIds){
    if(!err && orderIds && orderIds.length > 0){
      cli.verticalSpace();
      orderIds.forEach(function(orderId){
        _data.read('orders',orderId,function(err,orderData){
          if(!err && orderData && Date.now() - orderData.date <= 24 * 60 * 60 * 1000){
            var includeOrder = false;
            var lowerString = str.toLowerCase();
            // Get the status, default to unsuccessfull
            var status = typeof(orderData.status) == 'string' ? orderData.status : 'unsuccessfull';
            // Get the status, default to unknown
            var statusOrUnknown = typeof(orderData.status) == 'string' ? orderData.status : 'unknown';
            // If the user has specified that status, or hasn't specified any status
            if((lowerString.indexOf('--'+status) > -1) || (lowerString.indexOf('--down') == -1 && lowerString.indexOf('--up') == -1)){
              var line = 'ID: '+orderData.id+ 'status: '+statusOrUnknown;
              console.log(line);
              cli.verticalSpace();
            }
          }
        });
      });
    }
  });
};

//All order Info of a particular user
cli.responders.moreOrderInfo = function(str){
	// Get ID from string
  var arr = str.split('--');
  var orderId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
  if(orderId){
    // Lookup the user
    _data.read('orders',orderId,function(err,orderData){
      if(!err && orderData){

        // Print their JSON object with text highlighting
        cli.verticalSpace();
        console.dir(orderData,{'colors' : true});
        cli.verticalSpace();
      }
    });
  }
};

// Display all the menu items
cli.responders.showMenu = function(){
  _data.read('menu','menu',function(err,data){
    if(!err && data){
      // Print their JSON object with text highlighting
        cli.verticalSpace();
        console.dir(data,{'colors' : true});
        cli.verticalSpace();
    }
  });
};


// Input processor
cli.processInput = function(str){
	str = typeof(str) == 'string' && str.trim().length>0 ? str.trim() : false;
	// Only process the input if the user actually wrote something. otherwise ignore
	if(str){
		// Codify the unique strings that identify the unique questions allowed to be asked
		var uniqueInputs = [
			'man',
			'help',
			'exit',
			'stats',
			'list users',
			'more user info',
			'list orders',
			'more order info',
			'show menu'
		];

		// Go through the possible inputs, emit an event when a match is found
		var matchFound = false;
		var counter = 0;
		uniqueInputs.some(function(input){
			if(str.toLowerCase().indexOf(input) > -1){
				matchFound = true;
				// Emit an event matching the unique input, and include the full string
				e.emit(input,str);
				return true;
			}
		});

		// If no match is found, tell the user to try again
		if(!matchFound){
			// Send the start message to the console, in dark blue
			console.log("Sorry, can\'t recognise the above command");
		}

	}
};



 // Init script
 cli.init = function(){
 	// Send the start message to the console, in the dark blue
 	console.log('\x1b[34m%s\x1b[8m',"The CLI is running");

 	// Start the interface
 	var _interface = readline.createInterface({
 		input: process.stdin,
 		output: process.stdout,
 		prompt: '>'
 	});

 	// Create an initial prompt
 	_interface.prompt();

 	// Handle each line of input separately
 	_interface.on('line',function(str){
 		// Send to the input processor
 		cli.processInput(str);

 		// Re-Intialize the prompt afterwards
 		_interface.prompt();
 	});

 	//If the user stops the CLI, kill the associated process
 	_interface.on('close',function(){
 		process.exit(0);
 	});



 };

 //Export the module
 module.exports = cli;