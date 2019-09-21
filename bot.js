//  __   __  ___        ___
// |__) /  \  |  |__/ |  |  
// |__) \__/  |  |  \ |  |  

// This is the main file for the bot bot.

// Import Botkit's core features
const { Botkit } = require('botkit');
const { BotkitCMSHelper } = require('botkit-plugin-cms');

// Import a platform-specific adapter for slack.

const { SlackAdapter, SlackMessageTypeMiddleware, SlackEventMiddleware } = require('botbuilder-adapter-slack');

const { MongoDbStorage } = require('botbuilder-storage-mongodb');

// Load process.env values from .env file
require('dotenv').config();

let storage = null;
if (process.env.MONGO_URI) {
    storage = mongoStorage = new MongoDbStorage({
        url : process.env.MONGO_URI,
    });
}



const adapter = new SlackAdapter({
    // REMOVE THIS OPTION AFTER YOU HAVE CONFIGURED YOUR APP!
    enable_incomplete: true,

    // parameters used to secure webhook endpoint
    verificationToken: process.env.verificationToken,
    clientSigningSecret: process.env.clientSigningSecret,  

    // auth token for a single-team app
    botToken: process.env.botToken,

    // credentials used to set up oauth for multi-team apps
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot'], 
    redirectUri: process.env.redirectUri,
 
    // functions required for retrieving team-specific info
    // for use in multi-team apps
    getTokenForTeam: getTokenForTeam,
    getBotUserByTeam: getBotUserByTeam,
});

// Use SlackEventMiddleware to emit events that match their original Slack event types.
adapter.use(new SlackEventMiddleware());

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
adapter.use(new SlackMessageTypeMiddleware());


const controller = new Botkit({
    webhook_uri: '/api/messages',

    adapter: adapter,

    storage
});

if (process.env.cms_uri) {
    controller.usePlugin(new BotkitCMSHelper({
        uri: process.env.cms_uri,
        token: process.env.cms_token,
    }));
}

// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(() => {

    // load traditional developer-created local custom feature modules
    controller.loadModules(__dirname + '/features');

    /* catch-all that uses the CMS to trigger dialogs */
    if (controller.plugins.cms) {
        controller.on('message,direct_message', async (bot, message) => {
            let results = false;
            results = await controller.plugins.cms.testTrigger(bot, message);

            if (results !== false) {
                // do not continue middleware!
                return false;
            }
        });
    }

});



controller.webserver.get('/', (req, res) => {

    res.send(`This app is running Botkit ${ controller.version }.`);

});






controller.webserver.get('/install', (req, res) => {
    // getInstallLink points to slack's oauth endpoint and includes clientId and scopes
    res.redirect(controller.adapter.getInstallLink());
});

controller.webserver.get('/install/auth', async (req, res) => {
    try {
        const results = await controller.adapter.validateOauthCode(req.query.code);

        console.log('FULL OAUTH DETAILS', results);

        // Store token by team in bot state.
        tokenCache[results.team_id] = results.bot.bot_access_token;

        // Capture team to bot id
        userCache[results.team_id] =  results.bot.bot_user_id;

        res.json('Success! Bot installed.');

    } catch (err) {
        console.error('OAUTH ERROR:', err);
        res.status(401);
        res.send(err.message);
    }
});

let tokenCache = {};
let userCache = {};

if (process.env.TOKENS) {
    tokenCache = JSON.parse(process.env.TOKENS);
} 

if (process.env.USERS) {
    userCache = JSON.parse(process.env.USERS);
} 

async function getTokenForTeam(teamId) {
    if (tokenCache[teamId]) {
        return new Promise((resolve) => {
            setTimeout(function() {
                resolve(tokenCache[teamId]);
            }, 150);
        });
    } else {
        console.error('Team not found in tokenCache: ', teamId);
    }
}

async function getBotUserByTeam(teamId) {
    if (userCache[teamId]) {
        return new Promise((resolve) => {
            setTimeout(function() {
                resolve(userCache[teamId]);
            }, 150);
        });
    } else {
        console.error('Team not found in userCache: ', teamId);
    }
}

controller.hears(['hi','hello','howdy','hey','aloha','hola','bonjour','oi'], 'message', async (bot,message) => {

  // do something to respond to message
  await bot.reply(message,'Oh hai!' + message.text);

});


controller.hears([new RegExp('search (.*)')], 'message', async (bot,message) => {

  // do something to respond to message
   //await bot.reply(message, "okay: " + message.matches[1]);

    const axios = require("axios");


    console.log(message);
    console.log(message.user);
 
;(async () => {
  const response = await axios.get('https://fiddle.jshell.net/robots.txt')
  console.log(response)
    await bot.reply(message,'Oh hai!' + body.text);
})()


/*
    var options = {
        url: 'https://cse.google.com/cse?cx=001524111494326250050:xyzfsu31695',
        headers: {
            'Content-Type': 'application/json',
            'apikey': 'AIzaSyDHw_XVC0-pBoP2yr59pVh374G9Ij_dE3I'
         },
         //body: "{  \"q\": \"" + message.matches[1] + "\",  \"search_engine\": \"google.com\",  \"location\": \"United States\",  \"hl\": \"en\",  \"gl\": \"US\"}"
         body: message.matches[1] 
    };

    */

    //console.log(options.body);
    //function callback(error, response, body) {
    //    if (!error && response.statusCode == 200) {
    //        try{
    //            bot.reply(message, body);
    //        }
    //        catch(e){
    //            console.log(e);
    //        }
    //    }
   // };
   //request(options, callback)
   /*
   await request.post(options, (error, response, body) => {
        if (!error && response.statusCode == 200){
            console.log(body);
            try{
                 bot.reply(message, JSON.parse(body).organic[0].description); 
                 console.log(r)
            }
            catch(e){
                console.log(e);
            }
         }
        else {
            console.log(error);
        }
   }).catch( (error) => {console.log(error)})
*/
});

