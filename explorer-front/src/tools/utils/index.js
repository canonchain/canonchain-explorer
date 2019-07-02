// var BigNumber = require('bignumber.js').default;
import BigNumber from 'bignumber.js'


var unitMap = {
    'none': '0',
    'None': '0',
    'king': '1',
    'King': '1',
    'kking': '1000',
    'Kking': '1000',
    'mking': '1000000',
    'Mking': '1000000',
    'gking': '1000000000',
    'Gking': '1000000000',
    'czr': '1000000000000000000',
    'CZR': '1000000000000000000',
};

var isString = function (obj) {
    return typeof obj === 'string' && obj.constructor === String;
};

var isBigNumber = function (object) {
    return (object && object.constructor && object.constructor.name === 'BigNumber');
};

var toBigNumber = function (number) {
    number = number || 0;
    if (isBigNumber(number)) {
        return number;
    }
    if (isString(number) && (number.indexOf('0x') === 0 || number.indexOf('-0x') === 0)) {
        return new BigNumber(number.replace('0x', ''), 16);
    }
    return new BigNumber(number.toString(10), 10);
};

var getValueOfUnit = function (unit) {
    unit = unit ? unit.toLowerCase() : 'czr';
    var unitValue = unitMap[unit];
    if (unitValue === undefined) {
        throw new Error('This unit doesn\'t exists, please use the one of the following units' + JSON.stringify(unitMap, null, 2));
    }
    return new BigNumber(unitValue, 10);
};

var fromKing = function (number, unit) {
    var returnValue = toBigNumber(number).dividedBy(getValueOfUnit(unit));
    return isBigNumber(number) ? returnValue : returnValue.toString(10);
};

let fromKingToken = function (number, precision) {
    let returnValue = toBigNumber(number).dividedBy(precision);
    return isBigNumber(number) ? returnValue : returnValue.toString(10);
};

var toKing = function (number, unit) {
    var returnValue = toBigNumber(number).times(getValueOfUnit(unit));
    return isBigNumber(number) ? returnValue : returnValue.toString(10);
};

var exportsObj = {
    toBigNumber: toBigNumber,
    isBigNumber: isBigNumber,
    toKing: toKing,
    fromKing: fromKing,
    fromKingToken: fromKingToken
};

export default exportsObj;