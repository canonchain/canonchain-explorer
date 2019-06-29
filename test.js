format = {
    account: "String",
    hash: "String",
    stable_index: "Number",
}
let insertStr = ``;
let keyAry = Object.keys(format);
keyAry.forEach(item => {
    insertStr += item;
})
console.log(keyAry)
console.log(insertStr)