
app.factory('requests', function($http, actions){
    var s = {}

    s.dispatch = function(store, action){
        switch(action.type) {
            case TENANT_SAVE:
                store.next({type: TENANT_SAVING});
                var tenant = store.state.ui.edit_tenant;
                $http.post(TENANTS_API_URL + tenant.id, tenant.geometry).then(function(){
                         store.next({type: TENANT_HAS_SAVED, payload: tenant});
                     },function(msg){
                         store.next(actions.error(msg))
                     } );
                return;

            case GRAPH_SAVE:
                store.next({type: GRAPH_SAVING});
                var graph = {};
                var points = store.state.graph.edit_points;
                graph.points = _.map(points, function(p){
                    p =  _.extend({}, p, {type: p.point_type});
                    delete p.point_type;
                    return p;
                });      

                var edges = _.uniq(_.values(store.state.graph.edit_edges), function(e) { return e.from_id + ":" + e.to_id;});
                graph.graph = _.reduce(edges, function(memo, edge){
                    var list = memo[edge.from_id] || [];
                    var p1 = L.point(points[edge.from_id].geometry.coordinates);
                    var p2 = L.point(points[edge.to_id].geometry.coordinates);
                    list.push([edge.to_id, Math.round( p1.distanceTo(p2)) ]) ;
                    memo[edge.from_id] = list;
                    return memo;
                },{});

                // Adding transition edges
                var findTransition = function(floor, type, num){
                    return _.find(graph.points, function(cp){
                        return cp.floor == floor && cp.type == type && cp[type+'_id'] === num; 
                    })
                }
                var transition_points = _.filter(store.state.graph.edit_points, isTransitionPoint);
                _.each(transition_points, function(tp){
                    _.each(tp.transitions, function(floor){
                        var dst = findTransition(floor, tp.point_type, tp[tp.point_type+'_id']);
                        if(dst) {
                            var list = graph.graph[tp.id] || [];
                            // the weigt of transition edges is 0 
                            list.push([dst.id, 0]); 
                            graph.graph[tp.id] = list;
                        }
                    })
                });


                $http.post(GRAPH_API_URL, graph).then(function(){
                         store.next({type: GRAPH_HAS_SAVED});
                     }, function(msg){
                         store.next(actions.error(msg))
                     });
                break;

            case INIT_ACTION: 
                $http.get(TENANTS_API_URL).then(function(d){
                    var tenants = _.reduce(d.data, function(memo, t){
                        memo[t.id] = t;
                        t.type = 'Feature';
                        return memo;
                    }, {})
                    store.next( actions.tenatsLoaded(tenants) );
                });
                break;

            case SELECT_TAB:
                if(action.payload === 'graph_tab' && _.isEmpty(store.state.graph.points) ){
                    $http.get(GRAPH_API_URL).then(function(d){
                        var points = _.reduce(d.data.points, function(obj, p){
                            p.point_type = p.type;
                            p.type = 'Feature';
                            obj[p.id] = p;
                            return obj;
                        },{});
                        var edges = {};
                        var id_generator = function() { id_generator.id = (id_generator.id || 0) + 1; return id_generator.id }
                        _.mapObject(d.data.graph, function(val, key){
                            var point_id = key;
                            var point_edges = val;
                            var from = points[point_id];
                            _.each(point_edges, function(e){
                                var to = points[e[0]];
                                if(isTransitionPoint(from) && isTransitionPoint(to)) return;
                                var edge = {
                                    id: id_generator(),
                                    from_id: from.id,
                                    to_id: to.id,
                                    type: "Feature",
                                    geometry: {
                                        type: "LineString",
                                        coordinates: [ from.geometry.coordinates, to.geometry.coordinates ]
                                    } 
                                }
                                edges[edge.id] = edge;
                            });
                        })
                        store.next(actions.graphLoaded({points:points, edges:edges}))
                    });

                    $http.get(POINT_TYPES_URL).then(function(d){
                        var ptypes = _.reduce(d.data, function(memo, pt){
                            memo[pt.id] = pt;
                            return memo;
                        }, {})
                        store.next(  {type: POINT_TYPES_LOADED, payload: ptypes} );
                    })
                }
                break;
        }
        store.next(action);
    }
    return s;
});