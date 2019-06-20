let  crypto = require('crypto');
let bs58 = require('bs58');

function createApiKey(email,appName){
    let hashEmail = crypto.createHash('sha256');
    let hashAppName = crypto.createHash('sha256');
    let hashTimstamp = crypto.createHash('sha256');

    time_buf = hashTimstamp.update((new Date()).valueOf().toString()).digest();
    Email_buf = hashEmail.update(email).digest();
    appName_buf = hashAppName.update(appName).digest();
    for (let i = 0; i < time_buf.length; i++) {
    	time_buf[i] += Email_buf[i] + appName_buf[i]
    }
    return bs58.encode(time_buf)
}

module.exports = createApiKey;
