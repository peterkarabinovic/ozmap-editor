
function applyScope($scope) {
    return function(fn){
        if(!$scope.$$phase) $scope.$apply( fn )
        else fn();
    }
}

app.controller("FloorsController", function($scope, store, actions){
    var $update = _.partial(applyScope($scope), function() {
        $scope.floor = store.state.ui.selected_floor;
    }) 
    
    
    $scope.switchFloor = function(floor){
        store.dispatch( actions.switchFloor(floor) );
    }

    store.on('ui.selected_floor',  $update)
    $update()
});

app.controller("ErrorController", function($scope, store, actions){
    var $update = _.partial(applyScope($scope), function() {
        $scope.error = store.state.ui.error;
    }) 
    
    $scope.close = function(floor){
        store.dispatch( actions.error(null) );
    }

    store.on('ui.error',  $update)
    $update()
});



app.controller("TabController", function($rootScope, store, actions){
    var $update = _.partial(applyScope($rootScope), function() {
        $rootScope.selected_tab = store.state.ui.selected_tab;
    })   

    $rootScope.notSelected = function(tab_name) {
         return $rootScope.selected_tab !== tab_name
    }
    
    $rootScope.isSelected = function(tab_name) {
         return $rootScope.selected_tab === tab_name
    }

    $rootScope.select = function(tab_name){
        if(!$rootScope.isSelected(tab_name))
            store.dispatch(actions.selectTab(tab_name))   
    }

    store.on('ui.selected_tab',  $update);
    $update()
});

app.controller("TenantsController", function($scope, store, actions){
    var $apply = applyScope($scope)
    var ui = function() { return store.state.ui; }
    $scope.tenants = [];

    
    $scope.deleteGeometry = function(){
        store.dispatch(actions.newTenantGeometry(null));
    }

    $scope.onEdit = function(tenant){
        store.dispatch( actions.editTenant(tenant) )
    };

    $scope.closeEdit = function() {
        store.dispatch( actions.editTenant(null) )
    }

    $scope.geomType = function(tenant){
        return tenant && tenant.geometry ? 
               (tenant.geometry.type === "Polygon" ? "Площадь" : "Точка") : "—"
    }

    $scope.isVisible = function(tenant){
        return _.contains(ui().selected_tenants, tenant.id);
    }

    $scope.toggleVisibility = function(tenant_id){
        var selected_list = ui().selected_tenants;
        var is_v = _.contains(selected_list, tenant_id);
        selected_list = is_v ? _.without(selected_list, tenant_id) : _.union(selected_list, [tenant_id]);
        store.dispatch(actions.tenantSelection(selected_list));
    }
    

    $scope.noNeedSave = function(){
        var et = ui().edit_tenant;
        if(!et) return true;
        var t = _.find( store.state.tenants, function(t) { return et.id == t.id });
        return _.isEqual(et, t);
    }

    $scope.noGeometry = function() { return !ui().edit_tenant  || !ui().edit_tenant.geometry; }

    $scope.onSave = function(){
        store.dispatch( actions.saveTenant() )
    };

    store.on('ui.edit_tenant ui.tenant_saving', function() {
        $apply(function(){ $scope.tenant_saving = ui().tenant_saving }); 
    })

    store.on('ui.edit_tenant', function(){
        $apply(function(){ $scope.edit_tenant = ui().edit_tenant; });
    })

    store.on('tenants ui.selected_floor', function(e){
        var floor = ui().selected_floor;
        var tenants = _.filter(store.state.tenants, function(it) { return it.floor == floor} );
        $apply(function(){ 
            $scope.tenants = tenants;
            // $scope.tenants.length = 0;
            // _.each(tenants,function(t) { $scope.tenants.push(t)} )
        });
    });
});

app.controller("GraphController", function($scope, store, actions){
    var $update = _.partial(applyScope($scope), function() {
        var floor = store.state.ui.selected_floor;
        $scope.points = _.filter( store.state.graph.edit_points, function(p){ return p.floor === floor});
        $scope.editing_mode = store.state.ui.editing_mode;
        $scope.graph_saving = store.state.ui.graph_saving;
    });

    $scope.noChanges = function(){
        var graph = store.state.graph;
        return _.isEqual(graph.points, graph.edit_points) && 
               _.isEqual(graph.edges, graph.edit_edges) 
    }

    $scope.onSave = function(){
        store.dispatch(actions.saveGraph());
    }

    $scope.onCancel = function(){
        store.dispatch(actions.cancelGraphChanges());
    }

    $scope.mode = function(mode) {  store.dispatch({type: mode}); }
    $scope.isMode = function(mode) { return $scope.editing_mode === mode;}
    $scope.noFeatures = function() { return $scope.points.length === 0; }
    $scope.lessThen2 = function(){ return $scope.points.length < 2; }
    
    store.on('ui.editing_mode graph.edit_points graph.edit_edges ui.graph_saving', $update);
    $update();
});