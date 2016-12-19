
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

    $scope.noNeedSave = function(){
        var et = store.state.ui.edited_tenant;
        var mgs = store.state.ui.map_geo_json;
        return !et || et.geom === mgs;
    }

    $scope.onSave = function(){
        store.dispatch( actions.tenantSave(store.state.ui.edited_tenant.id, store.state.ui.map_geo_json) )
    };

    store.on('ui.map_geo_json ui.tenant_saving', function() {
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