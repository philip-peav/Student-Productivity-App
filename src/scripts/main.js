const electron = require('electron');
const url = require('url');
const path = require('path');
const express = require('express');
const request = require('request');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const {app, BrowserWindow, Menu, Notification, ipcMain} = electron;

// application setup and user login
let mainWindow;
var currUser = new Object();

// receives login info from user after login
ipcMain.on('sendUserInfo', (event, user) =>
{
    currUser.accountHolder = user;
    currUser.currName = user.email;
});

// sends back user info after reaching the welcome page
ipcMain.handle('getUser', (event) => 
{
    return currUser;
});

ipcMain.handle('logoutUser', (event)=>
{
    // clear info
    currUser = new Object();
});



/***** SPOTIFY BACKEND SETUP ALL GOES HERE *****/

// dependency setups
var client_id = 'b36df35577fa4fffa5e11564df2f5132'; // your client ID
var client_secret = '8965b3446a124dec9ff30eb21bd68472'; // your secret
var redirect_uri = 'http://localhost:8888/callback'; // your redirect uri

// function to generate a random string containing numbers and letters
var generateRandomString = function(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i=0; i<length; i++) {
        text += possible.charAt(Math.floor(Math.random()*possible.length));
    }

    return text;
}

var stateKey = 'spotify_auth_state';

// middleware setup
var server = express();

server.use(cors())
      .use(cookieParser());

server.get('/login', (req, res) => {
    var state = generateRandomString(16);
    res.cookie(stateKey, state);
    
    // application requests authorization
    var scope = 'user-read-private user-read-email'; // asking for permissions (can be modified)
    res.redirect('https://accounts.spotify.com/authorize?'+
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        })
    );
});
      
server.get('/callback', function(req, res) {
      
    // your application requests refresh and access tokens
    // after checking the state parameter
    
    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;
    
    if (state === null || state !== storedState) {
        res.redirect('/#' +
        querystring.stringify({
          error: 'state_mismatch'
        }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
          url: 'https://accounts.spotify.com/api/token',
          form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
          },
          headers: {
            'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
          },
          json: true
        };
      
        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {
        
                var access_token = body.access_token,
                    refresh_token = body.refresh_token;
        
                var options = {
                url: 'https://api.spotify.com/v1/me',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
                };
        
                // use the access token to access the Spotify Web API
                request.get(options, function(error, response, body) {
                    console.log(body);
                });
                // we can also pass the token to the browser to make requests from there
                res.redirect('/?' +
                querystring.stringify({
                    access_token: access_token,
                    refresh_token: refresh_token
                }));
            } else {
            res.redirect('/?' +
              querystring.stringify({
                error: 'invalid_token'
              }));
          }
        });
    }
});

// this is the redirect page we lead the user to
server.get('/', function(req, res) {
    var accessToken = req.query.access_token;
    var refreshToken = req.query.refresh_token;
    res.send('access token: '+accessToken+' and refresh token: '+refreshToken);
});
      
server.get('/refresh_token', function(req, res) {
    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };
    
    request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
});

// initialize port
server.listen(8888, ()=> {
    console.log("API Server started on port:8888");
});



/***** WINDOW APPLICATION SETUP ALL GOES HERE *****/

// Listen for app to be ready
app.on('ready', function(){
    // Create new window
    mainWindow = new BrowserWindow({width:800, height:640, webPreferences: {nodeIntegration: true}, icon: path.join(__dirname, '../public/icons/logo_1.png')});

    // Load html into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '../pages/loginPage.html'),
        protocol: 'file:', 
        slashes: true
    }));

    /****we'll keep this commented out for now until we're done using developer tools ****/
    //build menu from template
    //const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    //Menu.setApplicationMenu(mainMenu);

    //below code is for refocusing the window after an alert is given by the app
    const isWindows = process.platform === 'win32';
    let needsFocusFix = false;
    let triggeringProgrammaticBlur = false;

    mainWindow.on('blur', (event) => 
    {
        if(!triggeringProgrammaticBlur) 
        {
            needsFocusFix = true;
        }
    })

    mainWindow.on('focus', (event) => 
    {
        if(isWindows && needsFocusFix) 
        {
            needsFocusFix = false;
            triggeringProgrammaticBlur = true;
            setTimeout(function () 
            {
                mainWindow.blur();
                mainWindow.focus();
                setTimeout(function () 
                {
                    triggeringProgrammaticBlur = false;
                }, 100);
            }, 100);
        }
    });
});


//creating menu template
const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Create Reminder'
            },
            {
                label: 'Set Timer'
            },
            {
                label: 'Modify Routine'
            },
            {
                label: 'Quit',
                //check OS of device for shortcut functionality
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click()
                {
                    app.quit();
                }
            }
        ]
    }
];