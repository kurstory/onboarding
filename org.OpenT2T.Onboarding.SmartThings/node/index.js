'use strict';

var https = require('https');
var inquirer = require('inquirer');
var express = require('express'),
    app = express();

// module exports, implementing the schema
module.exports = {

    onboard: function(name, type, successCallback, errorCallback) {
        console.log('Onboarding device  : ' + name);
        console.log('type               : ' + type);

        // build questions for credentials
        console.log('\nPlease enter credentials for the SmartThings IOTDB API:\n');

        var questions = [
            {
                type: 'input',
                name: 'client_id',
                message: 'SmartThings IOTDB Client ID: ',
                validate: function(value) {
                    var pass = !!value;
                    if (pass) {
                        return true;
                    } else {
                        return 'Please enter a valid Client ID.';
                    }
                }
            },
            {
                type: 'input',
                name: 'client_secret',
                message: 'SmartThings IOTDB Client Secret: ',
                validate: function(value) {
                    var pass = !!value;
                    if (pass) {
                        return true;
                    } else {
                        return 'Please enter a valid Client Secret.';
                    }
                }
            }
        ];

        // show questions for credentials
        // inquirer.prompt(questions, function(answers) {
        //    console.log('\nThanks! Signing you in to SmartThings.');
// debug answers:
        var answers = {
            client_id : '14a2150f-08be-485f-90e2-ca378e288a94',
            client_secret : '591d3b65-b73b-4ae2-8f6d-d06a458de3f6'
        };
        


        // This is currently using the oAuth password flow, which
        // requires high trust and is probably not the right thing long term.
        // Look into moving to an Authorization flow, maybe by running an express server or similar to
        // handle the OAuth callback loop
        var credentials = {
            clientID : answers.client_id,
            clientSecret : answers.client_secret,
            site : 'https://graph.api.smartthings.com'
        }
        
        var oauth2 = require('simple-oauth2')(credentials);

        // Authorization oauth2 URI 
        var authorization_uri = oauth2.authCode.authorizeURL({
            redirect_uri: 'http://localhost:3000/callback',
            scope: 'app'
        });

        app.get('/auth', function (req, res) {
            // redirect to SmartThings auth uri
            res.redirect(authorization_uri);
        });

        app.get('/callback', function (req, res) {
            // parse request from SmartThings and get access token
            var code = req.query.code;

            console.log(code);
            
            oauth2.authCode.getToken({
                code: code,
                redirect_uri: 'http://localhost:3000/callback'
                },
                function (error, result) {
                    if (error) { console.log('Access Token Error', error); }

                    // extract auth token
                    var token = oauth2.accessToken.create(result);
                    // setup request options with uri to get this app's endpoints
                    // and add retrieved oauth token to auth header
                    var request_options = {
                        uri: 'https://graph.api.smartthings.com/api/smartapps/endpoints',
                        headers: { Authorization: 'Bearer '+token.token.access_token }
                    }

                    request(request_options, function(error, response, body) {
                        if (error) { console.log('Endpoints Request Error', error); }

                        // extract the app's unique installation url
                        var installation_url = JSON.parse(body)[0]['url'];
                        // reuse request options with new uri for the "things" endpoint
                        // specific to this app installation
                        request_options.uri = 'https://graph.api.smartthings.com' + installation_url + '/things'

                        request(request_options, function(error, response, body){
                            var all_things = JSON.parse(body)
                            res.json(all_things); // send JSON of all things
                        });
                    });
                });
            });

            app.listen(3000, function() {
                console.log('Server running on port', 3000);
            });

            return;

            console.log()

            var token;
            var tokenConfig = {
                username : answers.username,
                password : answers.password,
                grant_type : 'access_'
            };

            oauth2.password.getToken(tokenConfig, function saveToken(error, result) {
                if (error) { console.log('Access Token Error', error.message); }
                token = oauth2.accessToken.create(result);
                
                console.log(token);
                oauth2.api('GET', '/users', {
                    access_token: token.token.access_token
                }, function (err, data) {
                    console.log(data);
                });
                });

                return;

            var postData = JSON.stringify({
                'client_id': answers.client_id,
                'client_secret': answers.client_secret,
                'username': answers.username,
                'password': answers.password,
                'grant_type': 'password'
            });

            var postOptions = {
                protocol: 'https:',
                host: 'graph.api.smartthings.com',
                path: '/oauth/authorize',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': postData.length
                },
                method: 'POST'
            };

            // set up sign in request
            var req = https.request(postOptions, (res) => {

                var body = '';
                res.setEncoding('utf8');
                res.on('data', function(data) {
                    body += data;
                });

                res.on('end', function() {

                    if (res.statusCode != 200) {
                        if (errorCallback) {
                            errorCallback(res.statusCode, body);
                            return;
                        }
                    }
                    else {
                        // signed in, now enumerate devices and let the user pick one
                        var user = JSON.parse(body);
                        console.log('Signed in to SmartThings.');

                        var getOptions = {
                            protocol: 'https:',
                            host: 'api.wink.com',
                            path: '/users/me/wink_devices',
                            headers: {
                                'Authorization': 'Bearer ' + user.access_token,
                                'Accept': 'application/json'
                            },
                            method: 'GET'
                        };

                        var req = https.get(getOptions, function(res) {
                            var body = '';
                            res.setEncoding('utf8');
                            res.on('data', function(data) {
                                body += data;
                            });

                            res.on('end', function() {
                                if (res.statusCode != 200) {
                                    if (errorCallback) {
                                        errorCallback(res.statusCode, body);
                                        return;
                                    }
                                } else {
                                    var devices = JSON.parse(body).data;

                                    // apply the id key filter (only show devices that have this id key)
                                    devices = devices.filter(function(device) {
                                        return !!device[type];
                                    });

                                    if (!!devices && devices.length > 0) {
                                        var deviceChoices = devices.map(function(device) {
                                            return device.name + ' (' + device[type] + ')';
                                        });

                                        // ask the user to select a device
                                        inquirer.prompt([
                                            {
                                                type: "list",
                                                name: "selectedDevice",
                                                message: "Which device do you want to onboard?",
                                                choices: deviceChoices
                                            }
                                        ], function(answers) {
                                            // all done. Now we have both parameters we needed.
                                            var d = answers.selectedDevice;
                                            var deviceId = d.substring(d.lastIndexOf('(') + 1, d.lastIndexOf(')'));

                                            if (successCallback) {
                                                successCallback(user.access_token, deviceId, 'All done. Happy coding!');
                                                return;
                                            }
                                        });

                                    } else {
                                        if (errorCallback) {
                                            errorCallback('NotFound', 'No devices found.');
                                            return;
                                        }
                                    }
                                }
                            });

                            res.on('error', function(e) {
                                if (errorCallback) {
                                    errorCallback('enumerate', e.message);
                                    return;
                                }
                            });
                        });
                    }
                });

                res.on('error', function(e) {
                    if (errorCallback) {
                        errorCallback('token', e.message);
                        return;
                    }
                });

            });

            req.on('error', (e) => {
                if (errorCallback) {
                    errorCallback('token', e.message);
                    return;
                }
            });

            // initiate sign in request
            req.write(postData);
            req.end();
        //});
    }
};