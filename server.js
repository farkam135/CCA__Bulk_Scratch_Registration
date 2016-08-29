/**
 * Bulk Scratch Registration Server
 */
var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');

// Set port
//   + Development - 3000
//   + Production  - 80 (default)
var port = 3000 /*process.env.NODE_ENV === 'development' ? 3000 : 80*/;

//process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';   //Used to run tests using fiddler, can ignore

//Attaches the body parser to express to get csrf token
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
   extended: true
}));

// Static assets available at `/`
app.use(express.static('dist'));

//Starts the web server on port 80
app.listen(port,function(){
   console.log("Web Server Started On Port: " + port); // Print the current port for debugging
});

//On index GET send back index.html
app.get('/',function(req, res){
   res.sendFile(__dirname + "/index.html");
});

//On index POST (submit form on index.html) start the registration process
app.post('/',function(req, res){
    if(req.body.schoolInitials == "" || req.body.names == ""){
       res.send("Please enter names and school initials!");
    }
   else{
       register(req.body.names.toLowerCase().split(/\r?\n/), req.body.nFormat, req.body.schoolInitials); //Runs register sending an array of all the names split by line and getting rid of all whitespaces
        res.send("Users sent to Scratch for registration!");
    }
});

/**
 * register
 *
 * Function used to run the registration process. Pulls a new csrf token from scratch and sends each converted name to scratch
 * @param usernames The array of names in the format 'FirstName,LastName'
 * @param schoolInitials The schools initials that need to be appended to the username
 */
function register(usernames, format, schoolInitials){
   request('https://scratch.mit.edu/csrf_token/', {
       //proxy: "http://localhost:8888"  (Used to intercept sent packets for debugging)
      headers: {
         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.87 Safari/537.36'
      }
   }, function (error, response, body) {
       var csrf = response.headers['set-cookie'][0].split(';')[0].substring(17);
       for(var i=0; i < usernames.length; i++) {
           registerUser(getUsername(usernames[i],schoolInitials,format), schoolInitials, csrf);
       }
   });
}

/**
 * getUsername
 *
 * Function used to get the actual username to register with using the student's name school initals and format
 * @param name The student's name
 * @param schoolInitials The student's school's initials
 * @param format The format the student's name is in (0: First,Last; 1: Last,First; 2: First Last; 3: Last First)
 * @returns {string} The username to register with
 */
function getUsername(name, schoolInitials, format){
    switch(format){
        case 0:
            var sName = name.replace(' ','').split(',');
            return sName[0].substring(0,1) + sName[1] + schoolInitials;
        case 1:
            var sName = name.replace(' ','').split(',');
            return sName[1].substring(0,1) + sName[0] + schoolInitials;
        case 2:
            var sName = name.split(' ');
            return sName[0].substring(0,1) + sName[1] + schoolInitials;
        case 3:
            var sName = name.split(' ');
            return sName[1].substring(0,1) + sName[0] + schoolInitials;

    }
}

/**
 * registerUser
 *
 * Helper function for register, used to actually send the request to scratch using the passed username and csrf token.
 * @param username The username to register with, should be converted by register and in the form returned by getUsername
 * @param csrf The csrf token used to register with
 */
function registerUser(username,schoolInitials, csrf){
    console.log("Registering User: " + username + " CSRF: " + csrf);
    request('https://scratch.mit.edu/accounts/register_new_user/', {
        method: "POST",
       // proxy: "http://127.0.0.1:8888",
        headers: {
            'Host': 'scratch.mit.edu',
            'Connection': 'keep-alive',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Origin': 'https://scratch.mit.edu',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36',
            'X-CSRFToken': csrf,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': 'https://scratch.mit.edu/accounts/standalone-registration/',
            'Accept-Language': 'en-US,en;q=0.8',
            'Cookie': 'scratchcsrftoken=' + csrf,
        },
        body: 'username=' + username
              + '&password=c0ding'
              + '&birth_month=1&birth_year=2000'
              + '&gender=student'
              + '&country=United+States'
              + '&email=questions+' + schoolInitials + '%40bitscouts.org'
              + '&is_robot=false&should_generate_admin_ticket=false&usernames_and_messages=%3Ctable+class%3D\'banhistory\'%3E%0A++++%3Cthead%3E%0A++++++++%3Ctr%3E%0A++++++++++++%3Ctd%3EAccount%3C%2Ftd%3E%0A++++++++++++%3Ctd%3EEmail%3C%2Ftd%3E%0A++++++++++++%3Ctd%3EReason%3C%2Ftd%3E%0A++++++++++++%3Ctd%3EDate%3C%2Ftd%3E%0A++++++++%3C%2Ftr%3E%0A++++%3C%2Fthead%3E%0A++++%0A%3C%2Ftable%3E%0A'
              + '&csrfmiddlewaretoken=' + csrf
    }, function (error, response, body) {
        var result = JSON.parse(response.body)[0];
        if(result.success){
            console.log(username + " Registered!");
        }
        else{
            console.log("Unable to register " + username + " error: " + result.msg);
        }
    });
}
