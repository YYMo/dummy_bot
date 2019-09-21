const GSR = require('google-search-results-nodejs')
let client = new GSR.GoogleSearchResults("secret_api_key")


var callback = function(data) {
  console.log(data)
}

// Show result as JSON
client.json(parameter, callback)

module.exports = function(query) {
    var parameter = {
        engine: "google",
        q: query,
        google_domain: "google.com",
        gl: "us",
        hl: "en",
    };
    
}
