
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
    $scope.tenants = [];

    
    $scope.deleteGeometry = function(){
        store.dispatch(actions.mapGeoJSON(null));
    }

    $scope.onEdit = function(tenant){
        store.dispatch( actions.editTenant(tenant) )
    };

    $scope.closeEdit = function() {
        store.dispatch( actions.editTenant(null) )
    }

    $scope.geomType = function(tenant){
        return tenant && tenant.geom ? 
               (tenant.geom.type === "Polygon" ? "Площадь" : "Точка") : "—"
    }

    $scope.isVisible = function(tenant){
        return _.contains(store.state.ui.selected_tenants, tenant.id);
    }

    $scope.toggleVisibility = function(tenant_id){
        var selected_list = store.state.ui.selected_tenants;
        var is_v = _.contains(selected_list, tenant_id);
        selected_list = is_v ? _.without(selected_list, tenant_id) : _.union(selected_list, [tenant_id]);
        store.dispatch(actions.tenantSelection(selected_list));
    }
    

    $scope.noNeedSave = function(){
        var et = store.state.ui.edited_tenant;
        var mgs = store.state.ui.edit_geometry;
        return !et || _.isEqual(et.geom, mgs);
    }

    $scope.noGeometry = function() { return !store.state.ui.edit_geometry; }

    $scope.onSave = function(){
        store.dispatch( actions.tenantSave(store.state.ui.edited_tenant.id, store.state.ui.edit_geometry) )
    };

    store.on('ui.edit_geometry ui.tenant_saving', function() {
        $apply(function(){ $scope.tenant_saving = store.state.ui.tenant_saving }); 
    })

    store.on('ui.edited_tenant', function(){
        $apply(function(){ $scope.edited_tenant = store.state.ui.edited_tenant; });
    })

    store.on('tenants ui.selected_floor', function(e){
        var floor = store.state.ui.selected_floor;
        var tenants = _.filter(store.state.tenants, function(it) { return it.floor == floor} );
        $apply(function(){ $scope.tenants = tenants; });
    });
});

app.controller("GraphController", function($scope, store, actions){

});