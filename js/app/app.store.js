

app.factory('store', function(reducers, requests){

    var s = _.extend({}, L.Mixin.Events);
    s.state = {}

    s.dispatch = function(action){
        return requests.dispatch(s, action);
    }

    s.next = function(action){
        var old_state = s.state;
        var new_state = reducers(s.state, action);
        s.state = new_state;

        var props = changes(new_state, old_state);
        _.each(props, function(pr){
            s.fire(pr, {old_state: old_state[pr], new_state: new_state[pr]});
            var props2 = changes(new_state[pr], old_state[pr]);
            _.each(props2, function(pr2){
                var old_val = old_state && old_state[pr] ? old_state[pr][pr2] : undefined
                s.fire(pr + '.' + pr2, {old_state: old_val, new_state: new_state[pr][pr2]});
            })
        })
    }

    return s;
});


// find the properties that is not equals
function changes(obj1, obj2){
    return _.reduce(obj1, function(result, value, key) {
        return obj2 && _.isEqual(value, obj2[key]) ? result : result.concat(key);
    }, [])
}