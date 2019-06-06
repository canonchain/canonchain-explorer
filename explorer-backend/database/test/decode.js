let Czr = require("czr");
let czr = new Czr();
let abi = {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
}

let name_response = "0x" + "0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000A63616E6F6E436861696E00000000000000000000000000000000000000000000";
// let trans = 'A9059CBBE7CB03C3C6C2EBE7F5B4BA2E6417E014D5D6D0E0D7B67FF9692160977ED7CB4F00000000000000000000000000000000000000000000000000000000000003E8';
console.log(czr.utils.decode);
// let nameInfo = czr.utils.decode.transfer(trans);
let nameInfo2 = czr.utils.decode.parse(name_response, abi);
// console.log(nameInfo)
console.log(nameInfo2)