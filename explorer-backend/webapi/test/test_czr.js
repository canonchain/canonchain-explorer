let Czr = require("czr");
let czr = new Czr();


let obj = {
    "action": "send_offline_block",
    "previous": "A5E40538D4FA7505DDE81C538AAAB97142312E3FE3D606901E2C439967FE10F0",    
    "from": "czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u",
    "to": "czr_4k1FXs5xvfYcKiikFeV3GtyMRqYMwbjatL5YVURqYf1KBgC8Mq",
    "amount": "1000000000000000000", //1CZR
    "gas": "21000",
    "gas_price": "1000000000000",
    "data": "A2A98215E8DB2953",
    "signature": "4ABC0440DEC29AA49B6C1EEAE1D5C263B9856C218ACA4E9EDA0292FF3CBB6E85404F5266CD0B58CEF825E24EDF9C7F9A5B6FDCE415EF384C5AAF403D187ABF03"
}

async function nosdn(obj){
    let res = await czr.request.sendOfflineBlock(obj);
    console.log(res)
}

nosdn(obj)