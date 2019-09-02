(async () => {
    let config = require("./apikey_config");

    // module.exports = {
    //     appName:'canonChain',
    //     email:"email@example.com"
    // }

    let geneMethod = require("../apikey_gene");
    let pgPromise = require('../../database/PG-promise');
    let client = await pgPromise.pool.connect(); //获取连接

    async function gene_apikey(config) {
        let apikey = geneMethod(config.appName, config.email);
        let stamp = (new Date()).valueOf();
        let createKeySql = {
            text: `
                    INSERT INTO 
                        api_keys(email, app_name, apikey, create_timestamp)
                    VALUES 
                        ('${config.email}','${config.appName}','${apikey}',${stamp})
                `
        }

        let insertRuleSql = {
            text: `
                    INSERT INTO 
                        api_key_rule(apikey, second, day)
                    VALUES 
                        ('${apikey}',${config.second},${config.day})
                `
        }

        let inserCountSql = {
            text: `
                    INSERT INTO 
                        api_key_count(apikey, day)
                    VALUES 
                        ('${apikey}',${config.day})
                `
        }

        try {
            await client.query('BEGIN')
            await client.query(createKeySql);
            await client.query(insertRuleSql);
            await client.query(inserCountSql);
            await client.query('COMMIT')
            console.log("new generated apikey :", apikey);
        } catch (error) {
            console.error("创建Key失败")
            console.error(error)
        }
        //释放连接
        client.release()
    }

    gene_apikey(config);
})()