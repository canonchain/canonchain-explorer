// exports.install = function (Vue,options) {
//     Vue.prototype.globalChangeTab = (tab, current_tab, address) => {
//         /**
//          * 交易记录
//          * Token转账
//          * 合约内交易
//          * 事件日志
//          * 合约创建代码
//          */
//         let targetUrl = `/account/${address}/${tab.name}`;
//         let changePage = () => {
//             if (tab.name !== current_tab) {
//                 this.$router.push(targetUrl);
//             }
//         }
//         switch (tab.name) {
//             case "transaction":
//                 changePage()
//                 break;
//             case "token_balances":
//                 changePage()
//                 break;
//             case "trans_token":
//                 changePage()
//                 break;
//             case "trans_internal":
//                 changePage()
//                 break;
//             case "trans_witness":
//                 changePage()
//                 break;
//             case "event_logs":
//                 changePage()
//                 break;
//             case "contract_code":
//                 changePage()
//                 break;
//         }
//     }

// };