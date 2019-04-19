// var BigNumber = require('bignumber.js').default;
import BigNumber from 'bignumber.js'


var unitMap = {
    'none':       '0',
    'None':       '0',
    'wei':        '1',
    'Wei':        '1',
    'kwei':       '1000',
    'Kwei':       '1000', 
    'mwei':       '1000000',
    'Mwei':       '1000000',
    'gwei':       '1000000000',
    'Gwei':       '1000000000',
    'czr':        '1000000000000000000',
    'CZR':        '1000000000000000000',
};

var isString = function (obj) {
    return typeof obj === 'string' && obj.constructor === String;
};

var isBigNumber = function (object) {
    return (object && object.constructor && object.constructor.name === 'BigNumber');
};

var toBigNumber = function(number) {
    number = number || 0;
    if (isBigNumber(number)){
        return number;
    }
    if (isString(number) && (number.indexOf('0x') === 0 || number.indexOf('-0x') === 0)) {
        return new BigNumber(number.replace('0x',''), 16);
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

var fromWei = function(number, unit) {
    var returnValue = toBigNumber(number).dividedBy(getValueOfUnit(unit));
    return isBigNumber(number) ? returnValue : returnValue.toString(10);
};


var toWei = function(number, unit) {
    var returnValue = toBigNumber(number).times(getValueOfUnit(unit));
    return isBigNumber(number) ? returnValue : returnValue.toString(10);
};

var exportsObj={
    toBigNumber: toBigNumber,
    isBigNumber: isBigNumber,
    toWei: toWei,
    fromWei: fromWei
};

export default exportsObj;