'use strict';

var https = require('https');
var inquirer = require('inquirer');
var request = require('request');
var util = require('util');

// module exports, implementing the schema
module.exports = {

    onboard: function(type, successCallback, errorCallback) {
        console.log('Onboarding device of type : ' + type);

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
            },
            {
                type: 'input',
                name: 'access_token',
                message: 'SmartThings IOTDB Access Token (https://iotdb.org/playground/oauthorize/smartthings): ',
                validate: function(value) {
                    var pass = !!value;
                    if (pass) {
                        return true;
                    } else {
                        return 'Please enter a valid Client Secret (https://iotdb.org/playground/oauthorize/smartthings).';
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
                client_secret : '591d3b65-b73b-4ae2-8f6d-d06a458de3f6',
                access_token : '21e9b108-8295-4568-9f8b-6a53d5025ddd',
                location : "Awesomeland"
            };

            // get the location endpoint info:
            var requesturl = util.format('https://graph.api.smartthings.com/api/smartapps/endpoints/%s/', answers.client_id);

            request.get(requesturl, function(error, response, body) {
                // TODO: needs error checking
                var endpointsList = JSON.parse(body);
                
                // Filter based on name
                endpointsList = endpointsList.filter(function(endpoint) {
                    return endpoint.location.name == answers.location;
                });

                // Grab first endpoint
                var locationendpoint = endpointsList[0].uri;

                // make a new request:
                var requesturl = util.format('%s/%s', locationendpoint, type);

                request.get(requesturl, function(error, response, body) {
                    // TODO: Needs error checking
                    var devices = JSON.parse(body);

                    var deviceChoices = devices.map(function(device) {
                        return device.label + ' (' + device.id + ')';
                    });

                    // ask the user to select a device
                    inquirer.prompt([
                        {
                            type: "list",
                            name: "selectedDevice",
                            message: "Which device do you want to onboard?",
                            choices: deviceChoices
                        }
                    ], function(answers2) {
                        // all done. Now we have both parameters we needed.
                        var d = answers2.selectedDevice;
                        var deviceId = d.substring(d.lastIndexOf('(') + 1, d.lastIndexOf(')'));
                        var deviceUrl = util.format('%s/%s', requesturl, deviceId);

                        if (successCallback) {
                            successCallback(answers.access_token, deviceUrl, 'All done. Happy coding!');
                            return;
                        }
                    });

                }).auth(null, null, true, answers.access_token);
            }).auth(null, null, true, answers.access_token);
    }
}