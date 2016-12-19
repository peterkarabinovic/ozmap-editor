
function applyScope($scope) {
    return function(fn){
        if(!$scope.$$phase) $scope.$apply( fn )
        else fn();
    }
}

app.controller("TabController", function($scope, store, actions){
    var $apply = applyScope($scope)
    $scope.selected_tab = store.state.ui.selected_tab;

    $scope.isSelected = function(tab_name) {
         return $scope.selected_tab === tab_name
    }

    $scope.select = function(tab_name){
        if(!$scope.isSelected(tab_name))
            store.dispatch(actions.selectTab(tab_name))   
    }

    store.on('ui.selected_tab', function(e){
        $apply( function() { $scope.selected_tab = e.new_state; } )
    });
});