
app.factory('requests', function($http, actions){
    var s = {}

    s.dispatch = function(store, action){
        switch(action.type) {
            case TENANT_SAVE:
                store.next({type: TENANT_SAVING});
                var tenant = store.state.ui.edit_tenant;
                $http.post('tenants/' + tenant.id, tenant.geometry)
                     .then(function(){
                         store.next({type: TENANT_HAS_SAVED, payload: tenant});
                     });
                return;
            case INIT_ACTION: 
                $http.get('tenants/').then(function(d){
                    var tenants = _.mapObject(d.data, function(t, id){
                        t.geometry = t.geom;
                        delete t.geom;
                        t.id = id; 
                        t.type = 'Feature';
                        return t;
                    });
                    store.next( actions.tenatsLoaded(tenants));
                });
        }
        store.next(action);
    }
    return s;
});