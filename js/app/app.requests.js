
app.factory('requests', function($http, actions){
    var s = {}

    s.dispatch = function(store, action){
        if(action.type == INIT_ACTION){
            $http.get('/tenants/').then(function(d){
                store.next( actions.tenatsLoaded(d.data));
            });
        }
        store.next(action);
    }
    return s;
});