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

var listMessages = [];


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


controller.middleware.receive.use(async (bot, message, next) => {

    // log it
    console.log('RECEIVED: ', message);
    await listMessages.push(message.text)
    console.log('listMessages: ', listMessages);

    // modify the message
    message.logged = true;

    // continue processing the message
    next();

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

controller.hears(['hi ','hello','howdy','hey','aloha','hola','bonjour'], 'message', async (bot,message) => {

  // do something to respond to message
  await bot.reply(message,'Oh hai!');

});


controller.hears([new RegExp('search (.*)'), new RegExp('what .*'), new RegExp('where .*'), new RegExp('how .*'), new RegExp('who .*'), new RegExp('do .*'), new RegExp('Search (.*)'), new RegExp('What .*'), new RegExp('Where .*'), new RegExp('How .*'), new RegExp('Who .*'), new RegExp('Do .*')], 'message', async (bot,message) => {

    const axios = require("axios");
    const pos = require("pos"); // part-of-speech tags for NLP

    console.log(message);
    console.log(message.user);
 
    prev_question = ""
    var cnt = 0
    for(var i = listMessages.length - 1; i >= 1; i--){
        if(listMessages[i]){ 
            cnt += 1
            if (cnt == 2){
                prev_question = listMessages[i];
                break;
            }
        }
    }

    curr_question = message.matches[message.matches.length - 1];
    has_prp = false; 
    var words = new pos.Lexer().lex(curr_question);
    var tagger = new pos.Tagger();
    var taggedWords = tagger.tag(words);
    for (i in taggedWords) {
        var taggedWord = taggedWords[i];
        var word = taggedWord[0];
        var tag = taggedWord[1];
        console.log(word + " /" + tag);
        if(tag=="PRP"){has_prp = true;}
    }

    if(has_prp){
        question = prev_question + ', ' + curr_question; }
    else{
        question = curr_question;}

    google_search_api_url = 'https://www.googleapis.com/customsearch/v1?'
    var options = {
        params: {
            key: 'AIzaSyDHw_XVC0-pBoP2yr59pVh374G9Ij_dE3I',
            cx: "001524111494326250050:xyzfsu31695",
            q: question,
         },
    };
   
    console.log(options) 
    await bot.reply(message, "Let me check " + question)
    try{
        const response = await axios.get(google_search_api_url, options);
        console.log(response)
        var item = response.data.items[0];
        await bot.reply(message, item.title + '\n' + item.snippet + '\n' + item.link);
    }
    catch(error){
        console.log(error)
        await bot.reply(message, "Sorry, I lost connect to the wifi... please still love me")
    }
});

    controller.on('direct_mention', async(bot, message) => {
        const axios = require("axios");
        curr_question = message.text
        prev_question = ""
        var cnt = 0
        for(var i = listMessages.length - 1; i >= 1; i--){
            if(listMessages[i]){ 
                    prev_question = listMessages[i];
                    break;
            }
        }
        question = curr_question
        if(!curr_question){question = prev_question;}
        google_search_api_url = 'https://www.googleapis.com/customsearch/v1?'
        var options = {
            params: {
                key: 'AIzaSyDHw_XVC0-pBoP2yr59pVh374G9Ij_dE3I',
                cx: "001524111494326250050:xyzfsu31695",
                q: question,
             },
        };
   
        console.log(options) 
        await bot.reply(message, "Here I am! Let me check " + question)
        try{
            const response = await axios.get(google_search_api_url, options);
            console.log(response)
            var item = response.data.items[0];
            await bot.reply(message, item.title + '\n' + item.snippet + '\n' + item.link);
        }  
        catch(error){
            console.log(error)
            await bot.reply(message, "Sorry, I lost connect to the wifi... please still love me")
        }
    });

   async function retrieve_from_google(query) {
       const axios = require("axios")
       google_search_api_url = 'https://www.googleapis.com/customsearch/v1?'
       var options = {
            params: {
                key: 'AIzaSyDHw_XVC0-pBoP2yr59pVh374G9Ij_dE3I',
                cx: "001524111494326250050:xyzfsu31695",
                q: query,
             },
        }; 
        const response = await axios.get(google_search_api_url, options);
        return response;
   }
