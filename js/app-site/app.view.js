
app.controller('PointController', function($scope, store, actions){
    var $update = _.partial(applyScope($scope), function() {
        $scope.floor = store.state.floor;
        $scope.types = _.chain(store.state.graph.points)
            .filter(function(p){ return p.floor == $scope.floor})
            .filter(function(p){ return p.type != 'path'})
            .filter(function(p){ return p.type != 'entry'})
            .map(function(p){ return store.state.point_types[p.type] })
            .compact()
            .uniq(_.property('id') ).value();
    }); 
     
    $scope.onFloor = function(floor){
        store.dispatch( {type: "SWITCH_FLOOR", payload: floor} );
    }

    store.on('floor graph point_types', $update)
    $update();
});


function applyScope($scope) {
    return function(fn){
        if(!$scope.$$phase) $scope.$apply( fn )
        else fn();
    }
}
