(async () => {
    var PgPromise = require('../PG-promise');// 引用上述文件
    var pgPromise = PgPromise.pool;

    //添加Token表
    //                "hash","mc_timestamp","from","to","contract_account","token_symbol","amount"

    //czr_aaaaa
    //czr_bbbbb

    let pageUtility = {
        init: async () => {
            pageUtility.accounts();
            pageUtility.trans_normal();
            pageUtility.contract();
            pageUtility.contract_code();
            pageUtility.token();
            pageUtility.token_asset();
            pageUtility.trans_token();
            pageUtility.trans_internal();
            pageUtility.event_log();
        },
        accounts: async () => {
            console.log("accounts 开始")
            let tempAry = [
                "('czr_aaaaa',1,'1800000000','12',false,false,false,false)",
                "('czr_bbbbb',2,'1800000000','23',true,true,true,true)"
            ];
            let insertSql = {
                text: `INSERT INTO accounts 
                (
                    "account","type","balance","transaction_count",
                    "is_token_account","is_has_token_trans",
                    "is_has_intel_trans","is_has_event_logs"
                )
                VALUES ${tempAry.toString()}`
            };
            await pgPromise.query(insertSql);
            console.log("accounts 完成")
        },
        trans_normal: async () => {
            console.log("accounts 开始")
            let tempAry = [
                "('HASHAAAA',1,'CZR_aaaaa','previous','1560246068','work','signature',99,1,101,0,18,'1560246068','1560246068',1000,889,1300,'contract_aaa','log','log_bloom','CZR_bbbbb','123123','data','data_hash',true,true,true)",
                "('HASHBBBB',1,'CZR_aaaaa','previous','1560246068','work','signature',99,1,101,0,19,'1570246068','1570246068',1000,889,1300,'contract_aaa','log','log_bloom','CZR_bbbbb','123123','data','data_hash',true,true,true)",
                "('HASHCCCC',1,'CZR_bbbbb','previous','1560246068','work','signature',99,1,101,0,20,'1580246068','1580246068',1000,889,1300,'contract_aaa','log','log_bloom','CZR_aaaaa','123123','data','data_hash',true,true,true)",
                "('HASHDDDD',1,'CZR_aaaaa','previous','1560246068','work','signature',99,1,101,0,21,'1590246068','1590246068',1000,889,1300,'contract_aaa','log','log_bloom','CZR_bbbbb','123123','data','data_hash',true,true,true)"
            ];
            let insertSql = {
                text: `INSERT INTO trans_normal 
                (
                    "hash","type","from","previous","exec_timestamp","work","signature","level","is_stable","stable_index",
                    "status","mci","mc_timestamp","stable_timestamp",

                    "gas","gas_used","gas_price","contract_address","log","log_bloom",
                    
                    "to","amount","data","data_hash",

                    "is_event_log","is_token_trans","is_intel_trans"
                )
                VALUES ${tempAry.toString()}`
            };
            await pgPromise.query(insertSql);
            console.log("accounts 完成")
        },
        contract: async () => {
            console.log("contract 开始")
            let tempAry = [
                "('czr_aaaaa','czr_aaaaa','AAAAA','CanonChain','CZR')",
                "('czr_bbbbb','czr_aaaaa','WWWWW','CanonChain','CNC')"
            ];
            let insertSql = {
                text: `INSERT INTO contract 
                ("contract_account","own_account","born_unit","token_name","token_symbol") 
                VALUES ${tempAry.toString()}`
            };
            await pgPromise.query(insertSql);
            console.log("contract 完成")
        },
        contract_code: async () => {
            console.log("contract_code 开始")
            let tempAry = [
                "('czr_aaaaa','ASDDDDDDDDDASDASDSADASDASDASDASDASDSADASDASDSDASDAS')",
                "('czr_bbbbb','ASDDDDDDDDDASDASDSADASDASDASDASDASDSADASDASDSDASDAS')",
                "('ACAAAAAAAAAAAA','ASDDDDDDDDDASDASDSADASDASDASDASDASDSADASDASDSDASDAS')",
                "('ADAAAAAAAAAAAA','ASDDDDDDDDDASDASDSADASDASDASDASDASDSADASDASDSDASDAS')",
                "('AEAAAAAAAAAAAA','ASDDDDDDDDDASDASDSADASDASDASDASDASDSADASDASDSDASDAS')"
            ];
            let insertSql = {
                text: `INSERT INTO contract_code 
                ("contract_account","code")
                 VALUES ${tempAry.toString()}`
            };
            await pgPromise.query(insertSql);
            console.log("contract_code 完成")
        },
        token: async () => {
            console.log("token 开始")
            let tempAry = [
                "('czr_aaaaa','CanonChain1','CZR1',18,'14000000000000',128,68)",
                "('czr_bbbbb','CanonChain2','CZR2',18,'15000000000000',138,38)",
                "('ACAAAAAAAAAAAA','CanonChain3','CZR3',18,'16000000000000',148,12)",
                "('ADAAAAAAAAAAAA','CanonChain4','CZR4',18,'17000000000000',158,28)",
                "('AEAAAAAAAAAAAA','CanonChain5','CZR5',18,'18000000000000',168,18)"
            ];
            let insertSql = {
                text: `INSERT INTO token 
                ("contract_account","token_name","token_symbol","token_precision","token_total","transaction_count","account_count") 
                VALUES ${tempAry.toString()}`
            };
            await pgPromise.query(insertSql);
            console.log("token 完成")
        },
        token_asset: async () => {
            console.log("token_asset 开始")
            let tempAry = [
                "('czr_aaaaa','AAAAAAAAAAAAAA','CZR1','15678532000001')",
                "('czr_aaaaa','ABAAAAAAAAAAAA','CZR2','25678532000001')",
                "('czr_bbbbb','ACAAAAAAAAAAAA','CZR3','35678532000001')",
                "('czr_aaaaa','ADAAAAAAAAAAAA','CZR4','45678532000001')",
                "('czr_bbbbb','AEAAAAAAAAAAAA','CZR5','55678532000001')"
            ];
            let insertSql = {
                text: `INSERT INTO token_asset 
                ("account","contract_account","symbol","balance") 
                VALUES ${tempAry.toString()}`
            };
            await pgPromise.query(insertSql);
            console.log("token_asset 完成")
        },
        trans_token: async () => {
            console.log("trans_token 开始")
            let tempAry = [
                "('AAAAAAAAAAAAAA',1560245068,'czr_aaaaa','czr_bbbbb','czr_contr1','CZR','15678532000001')",
                "('ABAAAAAAAAAAAA',1560246068,'czr_bbbbb','czr_aaaaa','czr_contr2','CCC','25678532000001')",
                "('ACAAAAAAAAAAAA',1560247068,'czr_bbbbb','czr_aaaaa','czr_contr2','CCC','35678532000001')",
                "('ADAAAAAAAAAAAA',1560248068,'czr_aaaaa','czr_bbbbb','czr_contr1','CZR','45678532000001')",
                "('AEAAAAAAAAAAAA',1560249068,'czr_aaaaa','czr_bbbbb','czr_contr1','CZR','55678532000001')"
            ];
            let insertSql = {
                text: `INSERT INTO trans_token 
                ("hash","mc_timestamp","from","to","contract_account","token_symbol","amount")
                VALUES ${tempAry.toString()}`
            };
            await pgPromise.query(insertSql);
            console.log("trans_token 完成")
        },
        trans_internal: async () => {
            console.log("trans_internal 开始")
            let tempAry = [
                "('AAAAAAAAAAAAAA',1560245068,'czr_aaaaa','czr_bbbbb',156788001,1111)",
                "('ABAAAAAAAAAAAA',1560246068,'czr_bbbbb','czr_aaaaa',256785321,2222)",
                "('ACAAAAAAAAAAAA',1560247068,'czr_bbbbb','czr_aaaaa',35678891,3333)",
                "('ADAAAAAAAAAAAA',1560248068,'czr_aaaaa','czr_bbbbb',456785301,4444)",
                "('AEAAAAAAAAAAAA',1560249068,'czr_aaaaa','czr_bbbbb',556785301,5555)"
            ];
            let insertSql = {
                text: `INSERT INTO trans_internal 
                ("hash","mc_timestamp","from","to","amount","gas_limit")
                 VALUES ${tempAry.toString()}`
            };
            await pgPromise.query(insertSql);
            console.log("trans_internal 完成")
        },
        event_log: async () => {
            console.log("event_log 开始")
            let tempAry = [
                "('AAAAAAAAAAAAAA',1560245068,'czr_bbbbb',1231230000,'CZR','method_function','0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef,0x0000000000000000000000004beff723725187eedf76256bee1d4144a67249a2,0x00000000000000000000000099fe5d6383289cdd56e54fc0baf7f67c957a8888')",
                "('ABAAAAAAAAAAAA',1560246068,'czr_bbbbb',1231230000,'CCC','method_function','0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef,0x0000000000000000000000004beff723725187eedf76256bee1d4144a67249a2,0x00000000000000000000000099fe5d6383289cdd56e54fc0baf7f67c957a8888')",
                "('ACAAAAAAAAAAAA',1560247068,'czr_bbbbb',1231230000,'CCC','method_function','0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef,0x0000000000000000000000004beff723725187eedf76256bee1d4144a67249a2,0x00000000000000000000000099fe5d6383289cdd56e54fc0baf7f67c957a8888')",
                "('ADAAAAAAAAAAAA',1560248068,'czr_bbbbb',1231230000,'CZR','method_function','0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef,0x0000000000000000000000004beff723725187eedf76256bee1d4144a67249a2,0x00000000000000000000000099fe5d6383289cdd56e54fc0baf7f67c957a8888')",
                "('AEAAAAAAAAAAAA',1560249068,'czr_bbbbb',1231230000,'CZR','method_function','0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef,0x0000000000000000000000004beff723725187eedf76256bee1d4144a67249a2,0x00000000000000000000000099fe5d6383289cdd56e54fc0baf7f67c957a8888')"
            ];
            let insertSql = {
                text: `INSERT INTO event_log 
                ("hash","mc_timestamp","contract_account","data","method","method_function","topics") 
                VALUES ${tempAry.toString()}`
            };
            await pgPromise.query(insertSql);
            console.log("event_log 完成")
        }
    }
    pageUtility.init();
})()