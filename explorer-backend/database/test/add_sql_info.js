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

            //trans_type    trans_genesis    trans_witness  trans_normal
            pageUtility.trans_type();
            // pageUtility.trans_genesis();
            // pageUtility.trans_witness();
            // pageUtility.trans_normal();

        },
        accounts: async () => {
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
            let tempAry = [
                "('hash_aaaaa',2,'czr_aaaaa','previous','1560246068','work','signature',99,1,101,0,18,'1560246068','1560246068',1000,889,1300,'contract_aaa','log','log_bloom','czr_bbbbb','123123','data','data_hash',true,true,true,'from_state','to_states')",
                "('hash_bbbbb',2,'czr_aaaaa','previous','1560246068','work','signature',99,1,101,0,19,'1570246068','1570246068',1000,889,1300,'contract_aaa','log','log_bloom','czr_bbbbb','123123','data','data_hash',true,true,true,'from_state','to_states')",
                "('hash_ccccc',2,'czr_bbbbb','previous','1560246068','work','signature',99,1,101,0,20,'1580246068','1580246068',1000,889,1300,'contract_aaa','log','log_bloom','czr_aaaaa','123123','data','data_hash',true,true,true,'from_state','to_states')",
                "('hash_ddddd',2,'czr_aaaaa','previous','1560246068','work','signature',99,1,101,0,21,'1590246068','1590246068',1000,889,1300,'contract_aaa','log','log_bloom','czr_bbbbb','123123','data','data_hash',true,true,true,'from_state','to_states')"
            ];
            let insertSql = {
                text: `INSERT INTO trans_normal 
                (
                    "hash","type","from","previous","exec_timestamp","work","signature","level","is_stable","stable_index",
                    "status","mci","mc_timestamp","stable_timestamp",

                    "gas","gas_used","gas_price","contract_address","log","log_bloom",
                    
                    "to","amount","data","data_hash",

                    "is_event_log","is_token_trans","is_intel_trans",
                    "from_state","to_states"
                )
                VALUES ${tempAry.toString()}`
            };
            await pgPromise.query(insertSql);
            console.log("accounts 完成")
        },
        contract: async () => {
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
            let tempAry = [
                "('czr_aaaaa','ASDDDDDDDDDASDASDSADASDASDASDASDASDSADASDASDSDASDAS')",
                "('czr_bbbbb','ASDDDDDDDDDASDASDSADASDASDASDASDASDSADASDASDSDASDAS')",
                "('hash_ccccc','ASDDDDDDDDDASDASDSADASDASDASDASDASDSADASDASDSDASDAS')",
                "('hash_ddddd','ASDDDDDDDDDASDASDSADASDASDASDASDASDSADASDASDSDASDAS')",
                "('hash_eeeee','ASDDDDDDDDDASDASDSADASDASDASDASDASDSADASDASDSDASDAS')"
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
            let tempAry = [
                "('czr_aaaaa','CanonChain1','5A',18,'14000000000000000000000000000000',128,68)",
                "('czr_bbbbb','CanonChain2','5B',18,'15000000000000000000000000000000',138,38)",
                "('czr_ccccc','CanonChain3','5C',18,'16000000000000000000000000000000',148,12)",
                "('czr_ddddd','CanonChain4','5D',18,'17000000000000000000000000000000',158,28)",
                "('czr_eeeee','CanonChain5','5E',18,'18000000000000000000000000000000',168,18)"
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
            let tempAry = [
                "('czr_aaaaa','czr_aaaaa','CZR1','15678532000001')",
                "('czr_aaaaa','czr_bbbbb','CZR2','25678532000001')",
                "('czr_bbbbb','czr_bbbbb','CZR3','35678532000001')",
                "('czr_aaaaa','czr_bbbbb','CZR4','45678532000001')",
                "('czr_bbbbb','czr_bbbbb','CZR5','55678532000001')"
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
            let tempAry = [
                "('hash_aaaaa',1560245068,'czr_aaaaa','czr_bbbbb','czr_bbbbb','CZR','15678532000001')",
                "('hash_bbbbb',1560246068,'czr_bbbbb','czr_aaaaa','czr_aaaaa','CCC','25678532000001')",
                "('hash_ccccc',1560247068,'czr_bbbbb','czr_aaaaa','czr_aaaaa','CCC','35678532000001')",
                "('hash_ddddd',1560248068,'czr_aaaaa','czr_bbbbb','czr_bbbbb','CZR','45678532000001')",
                "('hash_eeeee',1560249068,'czr_aaaaa','czr_bbbbb','czr_bbbbb','CZR','55678532000001')"
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
            let tempAry = [
                "('hash_aaaaa',1560245068,'czr_aaaaa','czr_bbbbb',156788001,1111,'create','0_0')",
                "('hash_bbbbb',1560246068,'czr_bbbbb','czr_aaaaa',256785321,2222,'create','0_0')",
                "('hash_ccccc',1560247068,'czr_bbbbb','czr_aaaaa',35678891,3333,'call','0_0')",
                "('hash_ddddd',1560248068,'czr_aaaaa','czr_bbbbb',456785301,4444,'create','0_0')",
                "('hash_eeeee',1560249068,'czr_aaaaa','czr_bbbbb',556785301,5555,'call','0_0')"
            ];
            let insertSql = {
                text: `INSERT INTO trans_internal 
                ("hash","mc_timestamp","from","to","amount","gas_limit","trace_type","trace_flag")
                 VALUES ${tempAry.toString()}`
            };
            await pgPromise.query(insertSql);
            console.log("trans_internal 完成")
        },
        event_log: async () => {
            let tempAry = [
                "('hash_aaaaa',1560245068,'czr_bbbbb',1231230000,'0xa9059cbb','transfer(address,uint256)','0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef,0x0000000000000000000000004beff723725187eedf76256bee1d4144a67249a2,0x00000000000000000000000099fe5d6383289cdd56e54fc0baf7f67c957a8888')",
                "('hash_bbbbb',1560246068,'czr_bbbbb',1231230000,'0xa9059cbb','transfer(address,uint256)','0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef,0x0000000000000000000000004beff723725187eedf76256bee1d4144a67249a2,0x00000000000000000000000099fe5d6383289cdd56e54fc0baf7f67c957a8888')",
                "('hash_ccccc',1560247068,'czr_bbbbb',1231230000,'0xa9059cbb','transfer(address,uint256)','0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef,0x0000000000000000000000004beff723725187eedf76256bee1d4144a67249a2,0x00000000000000000000000099fe5d6383289cdd56e54fc0baf7f67c957a8888')",
                "('hash_ddddd',1560248068,'czr_bbbbb',1231230000,'0xa9059cbb','transfer(address,uint256)','0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef,0x0000000000000000000000004beff723725187eedf76256bee1d4144a67249a2,0x00000000000000000000000099fe5d6383289cdd56e54fc0baf7f67c957a8888')",
                "('hash_eeeee',1560249068,'czr_bbbbb',1231230000,'0xa9059cbb','transfer(address,uint256)','0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef,0x0000000000000000000000004beff723725187eedf76256bee1d4144a67249a2,0x00000000000000000000000099fe5d6383289cdd56e54fc0baf7f67c957a8888')"
            ];
            let insertSql = {
                text: `INSERT INTO event_log 
                ("hash","mc_timestamp","contract_account","data","method","method_function","topics") 
                VALUES ${tempAry.toString()}`
            };
            await pgPromise.query(insertSql);
            console.log("event_log 完成")
        },
        trans_type: async () => {
            let tempAry = [
                "('hash_aaaaa',0)",
                "('hash_bbbbb',1)",
                "('hash_ccccc',2)"
            ];
            let insertSql = {
                text: `INSERT INTO trans_type
                ("hash","type")
                VALUES ${tempAry.toString()}`
            };
            await pgPromise.query(insertSql);
            console.log("trans_type 完成")
        },
        trans_genesis: async () => {
            let tempAry = [
                `(
                    'hash_aaaaa',0,'czr_aaaaa','previous',123123123123,
                    'work','signature',99,0,0,0,0,12312312312312,123123123123123,
                    'czr_bbbbb','456465456','data','data_hash')`,
            ];
            let insertSql = {
                text: `INSERT INTO trans_genesis
                (
                    "hash","type","from","previous","exec_timestamp",
                    "work","signature","level","is_stable","stable_index","status","mci","mc_timestamp","stable_timestamp"

                    ,"to","amount","data","data_hash"
                )
                VALUES ${tempAry.toString()}`
            };
            await pgPromise.query(insertSql);
            console.log("trans_genesis 完成")
        },
        trans_witness: async () => {
            let tempAry = [
                `(
                    'hash_bbbbb',1,'czr_aaaaa','previous',123123123123,
                    'work','signature',99,0,0,0,0,12312312312312,123123123123123,
                    'last_stable_block','last_summary_block','last_summary',1,12,
                    'best_parent',2
                )`,
            ];
            let insertSql = {
                text: `INSERT INTO trans_witness
                (
                    "hash","type","from","previous","exec_timestamp",
                    "work","signature","level","is_stable","stable_index","status","mci","mc_timestamp","stable_timestamp"

                    ,"last_stable_block","last_summary_block","last_summary","is_free","witnessed_level",
                    "best_parent","is_on_mc"
                )
                VALUES ${tempAry.toString()}`
            };
            await pgPromise.query(insertSql);
            console.log("trans_witness 完成")
        },
        // trans_normal: async () => {
        //     let tempAry = [
        //         `(
        //             'hash_ccccc',1,'czr_aaaaa','previous',123123123123,
        //             'work','signature',99,0,0,0,0,12312312312312,123123123123123,

        //             900,821,123123,'czr_aaaaa','log','log_bloom',
        //             'czr_bbbbb','456465456','data','data_hash',
        //             true,true,true,true
        //         )`,
        //     ];
        //     let insertSql = {
        //         text: `INSERT INTO trans_normal
        //         (
        //             "hash","type","from","previous","exec_timestamp",
        //             "work","signature","level","is_stable","stable_index","status","mci","mc_timestamp","stable_timestamp",

        //             "gas","gas_used","gas_price","contract_address","log","log_bloom",
        //             "to","amount","data","data_hash",
        //             "is_event_log","is_token_trans","is_intel_trans"
        //         )
        //         VALUES ${tempAry.toString()}`
        //     };
        //     await pgPromise.query(insertSql);
        //     console.log("trans_normal 完成")

        // },

        insertGlobal: async () => {
            const insertVal = `
            ('internal_count',15 )
        `;
            let globalFirstInsert = "INSERT INTO global (key,value) VALUES " + insertVal;
            let res = await pgPromise.query(globalFirstInsert);
        }
    }
    pageUtility.init();



})()