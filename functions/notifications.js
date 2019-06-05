
exports.testNotification = function testNotification(){
    var userID = 'ABwppHGKZe_sxq25BB-UesIt1AMqK8eAbMWXMUvrFm5HdjKHVKx1rr9HAjuF7fOvHSBhQEXoZq4TgT9k5tvndZKTBMos7Ra9';
    sendNotifcation( userID, 'Check a Lift');
}

function sendNotifcation( userId, intent ){ 
    let jwtClient = new google.auth.JWT(
        key.client_email, null, key.private_key,
        ['https://www.googleapis.com/auth/actions.fulfillment.conversation'],
        null
    );
    
    jwtClient.authorize((err, tokens ) => {
    
        // code to retrieve target userId and intent
        let notif = {
            userNotification: {
            title: 'Caught!',
            },
            target: {
            userId: userId,
            intent: intent,
            // Expects a IETF BCP-47 language code (i.e. en-US)
            locale: 'en-US'
            },
        };

        request.post('https://actions.googleapis.com/v2/conversations:send', {
            'auth': {
            'bearer': tokens.access_token,
            },
            'json': true,
            'body': {'customPushMessage': notif},
        }, (err, httpResponse, body) => {
            console.log( 'notifcation post: ' + httpResponse.statusCode + ': ' + httpResponse.statusMessage);
        });
    });
}