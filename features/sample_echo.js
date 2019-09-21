/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = function(controller) {

    controller.on('message,direct_message', async(bot, message) => {
        console.log(message.text) 
    });
}
