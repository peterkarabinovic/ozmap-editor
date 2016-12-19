var _ = require('./lib/lodash.js')

var obj1 = {
    s1: [1,2,3,4,5],
    s2: [{p1:1, p2:2}]
}

var obj2 = {
    s1: [1,2,3,4],
    s2: [{p1:1, p2:3}]
}

console.log(_.isEqual(obj1, obj2))


// find the properties that is not equals
function changes(obj1, obj2){
    return _.reduce(obj1, function(result, value, key) {
        return _.isEqual(value, obj2[key]) ? result : result.concat(key);
    }, [])
}


console.log( changes(obj1.s2, obj2.s2) )