let config = require("./apikey_config");

// module.exports = {
//     appName:'canonChain',
//     email:"email@example.com"
// }

let geneMethod = require("../apikey_gene");
let PgPromise = require('../../database/PG-promise');
let pgPromise = PgPromise.pool;

async function gene_apikey(config){
    let apikey = geneMethod(config.appName,config.email);
    let stamp = (new Date()).valueOf();
    let sql = {
        text:`insert into 
                api_keys
            values('${config.email}','${config.appName}','${apikey}',${stamp})`
    }

    await pgPromise.query(sql);
    console.log("new generated apikey :",apikey);
}
gene_apikey(config);