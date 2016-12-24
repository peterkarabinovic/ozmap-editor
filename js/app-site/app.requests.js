
app.factory('requests', function($http, actions){
    var s = {}

    s.dispatch = function(store, action){
        switch(action.type){
            case INIT_ACTION:
                $http.get(GRAPH_API_URL).then(function(d){
                    store.next({type:"GRAPH_LOADED", payload: d.data});
                })
                
                $http.get(POINT_TYPES_URL).then(function(d){
                    var ptypes = _.reduce(d.data, function(memo, pt){
                        memo[pt.id] = pt;
                        return memo;
                    }, {})                    
                    store.next({type:"POINT_TYPES_LOADED", payload: ptypes});
                });
                break;
        }
        store.next(action);
    }
    return s;
});