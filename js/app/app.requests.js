
app.factory('requests', function($http, actions){
    var s = {}

    s.dispatch = function(store, action){
        switch(action.type) {
            case TENANT_SAVE:
                store.next({type: TENANT_SAVING});
                $http.post('tenants/' + action.payload.id, action.payload.geometry)
                     .then(function(){
                         store.next({type: TENANT_HAS_SAVED, payload: action.payload});
                     });
                return;
            case INIT_ACTION: 
                $http.get('tenants/').then(function(d){
                    _.each(d.data, function(t, id){
                        t.id = id;
                    });
                    store.next( actions.tenatsLoaded(d.data));
                });
        }
        store.next(action);
    }
    return s;
});