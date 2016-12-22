// ACTIONS

var INIT_ACTION = 'init',
    SELECT_TAB = 'select_tab',
    SWITCH_FLOOR = "switch_floor",
    ERROR = "ERROR";

var TENANT_SELECT = 'tselect',
    TENANT_EDIT = 'tedit',
    TENANT_NEW_GEOMETRY = 't_newgeometry',
    TENANT_SAVE = 't_save',
    TENANT_SAVING = 't_saving',
    TENANT_HAS_SAVED = 't_has_saved',
    TENANT_LOADED = 't_loaded',
    TENANT_SELETION = 't_selection';

var GRAPH_LOADED = "graph_loaded",
    POINT_ADDING = "POINT_ADDING",
    REMOVING = "REMOVING",
    EDGE_ADDING = "EDGE_ADDING",
    MAP_SELECTION = "MAP_SELECTION",
    POINT_NEW = 'p_new',
    POINT_REMOVE = 'p_remove',
    EDGE_NEW = 'e_new',
    EDGE_REMOVE = 'e_remove',
    POINT_MOVE = 'p_move',
    GRAPH_SAVE = 'g_save',
    GRAPH_SAVING = "g_saving",
    GRAPH_HAS_SAVED = "g_has_saved",
    GRAPH_CANCEL = "g_cancel"


var MAP_DRAWING_POLYGON = "map_drawing",
    MAP_GEOJSON = 'map_geojson';

app.factory('actions', function(){
    return {
        tenatsLoaded: function(d) { return {type: TENANT_LOADED, payload: d} },
        saveTenant: function() { return {type: TENANT_SAVE} },
        selectTab: function(tab) { return {type: SELECT_TAB, payload: tab} },
        switchFloor: function(floor) { return {type: SWITCH_FLOOR, payload: floor} },
        editTenant: function(tenant) { return {type: TENANT_EDIT, payload: tenant} },
        tenantSelection: function(sel_list) { return {type:TENANT_SELETION, payload: sel_list}},
        newTenantGeometry: function(geom) { return {type:TENANT_NEW_GEOMETRY, payload: geom}},
        newPoint: function(geom) { return {type: POINT_NEW, payload: geom}},
        removePoint: function(point) {return {type: POINT_REMOVE, payload: point}},
        removeEdge: function(point) {return {type: EDGE_REMOVE, payload: point}},
        newEdge: function(edge) { return {type: EDGE_NEW, payload: edge}},
        pointMove: function(point) { return {type: POINT_MOVE, payload: point }},
        saveGraph: function() { return {type: GRAPH_SAVE} },
        cancelGraphChanges: function() { return {type: GRAPH_CANCEL}},
        graphLoaded: function(graph) { return { type: GRAPH_LOADED, payload: graph } },
        error: function(er) { return {type: ERROR, payload: er}}
    };
})

app.factory('reducers', function(){

    function selected_ids(tenants, floor){
        return _.chain(tenats)
                .filter(_.property('geometry'))
                .filter(function(t) { return t.floor === floor})
                .map(_.property('id'))
                .value();
    }

    function generate_id(features){
        if(_.keys(features).length == 0) return 1;
        var ids = _.map(features, _.property('id'));
        return _.max(ids) + 1;
    }

    function ui(ui_state, action){
        ui_state = ui_state || {selected_tab: 'tenants_tab',
                                selected_floor: 1,
                                selected_tenants: [],
                                edit_tenant: null,
                                editing_mode: null,
                                tenant_saving: false,
                                graph_saving: false,
                                error: null };

        switch(action.type)
        {
            case SELECT_TAB:
                return _.extend({}, ui_state, {selected_tab: action.payload, 
                    edit_tenant: null,
                    editing_mode: null, 
                    edit_point: null});
            case SWITCH_FLOOR:
                return _.extend({}, ui_state, {selected_floor: action.payload,
                                               selected_tenants: [],  
                                               edit_tenant: null,   
                                               editing_mode: null});
            case ERROR:
                return _.extend({}, ui_state, {error: action.payload, tenant_saving: false, graph_saving: false });
            case TENANT_EDIT:
                var editing_mode = action.payload ? TENANT_EDIT : null;
                return _.extend({}, ui_state, {edit_tenant: action.payload, editing_mode: editing_mode, selected_tab: 'tenants_tab'});
            case TENANT_NEW_GEOMETRY:
                var t = _.extend({}, ui_state.edit_tenant, {geometry: action.payload})
                return _.extend({}, ui_state, {edit_tenant: t});
                
            case TENANT_LOADED:
                return _.extend({}, ui_state, {selected_tenants: selected_ids});
            case TENANT_SAVING:
                return _.extend({}, ui_state, {tenant_saving: true});
            case GRAPH_SAVING:
                return _.extend({}, ui_state, {graph_saving: true, editing_mode: null});                
            case TENANT_HAS_SAVED:
                var selected_tenants = _.union(ui_state.selected_tenants, [action.payload.id]);
                return _.extend({}, ui_state, {edit_tenant: null, editing_mode: null, tenant_saving: false, selected_tenants:selected_tenants});
            case GRAPH_HAS_SAVED:
                return _.extend({}, ui_state, {graph_saving: false});    
            case TENANT_SELETION:
                return _.extend({}, ui_state, {selected_tenants: action.payload});
            case POINT_ADDING:
                return _.extend({}, ui_state, {editing_mode: POINT_ADDING});
            case REMOVING:
                return _.extend({}, ui_state, {editing_mode: REMOVING});
            case EDGE_ADDING:
                return _.extend({}, ui_state, {editing_mode: EDGE_ADDING});
            case MAP_SELECTION:
                return _.extend({}, ui_state, {editing_mode: MAP_SELECTION});
            default:
                return ui_state;
        }

    }

    function tenats(tenants_state, action){
        tenants_state = tenants_state || {};
        switch(action.type){
            case TENANT_LOADED:
                return action.payload;
            case TENANT_HAS_SAVED:
                var tenant = action.payload;
                if( tenants_state[tenant.id] ) {
                    return _.extend({}, tenants_state, _.object([ [tenant.id, tenant] ]));
                }
            default:
                return tenants_state;
        }
    }

    function graph(graph_state, action){
        graph_state = graph_state || { 
            points: {},
            edges: {},
            edit_points: {},
            edit_edges: {}
        };
        switch(action.type){
            case GRAPH_LOADED:
                var graph = action.payload;
                return _.extend({}, graph_state, {points:graph.points, 
                                                 edit_points: graph.points,
                                                 edges: graph.edges,
                                                edit_edges: graph.edges} )

            case POINT_REMOVE:
                var point = action.payload;
                var edit_points = _.extend({}, graph_state.edit_points);
                delete edit_points[point.id];
                var from_edges = _.filter(graph_state.edit_edges, function(e){ return e.from_id === point.id});
                var to_edges = _.filter(graph_state.edit_edges, function(e){ return e.to_id === point.id});
                var edit_edges = _.extend({}, graph_state.edit_edges);
                _.each(from_edges.concat(to_edges), function(e){
                    delete edit_edges[e.id]
                });
                return _.extend({}, graph_state, {edit_points:edit_points,edit_edges:edit_edges});
            case EDGE_REMOVE:
                var edge = action.payload;
                var edit_edges = _.extend({}, graph_state.edit_edges);
                delete edit_edges[edge.id];
                return _.extend({},graph_state, {edit_edges:edit_edges})
                
            case EDGE_NEW:
                var edge = action.payload;
                var id = generate_id(graph_state.edit_edges);
                edge = _.extend({}, edge, {type:"Feature", id:id});
                var edit_edges = _.extend({}, graph_state.edit_edges, _.object([ [edge.id, edge] ]));
                return _.extend({}, graph_state, { edit_edges:edit_edges});

            case POINT_MOVE:
                var point = action.payload;
                point = _.extend({}, graph_state.edit_points[point.id], point);
                var from_edges = _.filter(graph_state.edit_edges, function(e){ return e.from_id === point.id});
                var to_edges = _.filter(graph_state.edit_edges, function(e){ return e.to_id === point.id});
                var edit_points = _.extend({}, graph_state.edit_points, _.object([ [point.id, point] ]) );
                var edit_edges = _.extend({}, graph_state.edit_edges);
                _.each(from_edges, function(e){
                    var coords = e.geometry.coordinates;
                    edit_edges[e.id] = _.extend( {}, e, {geometry: {type:"LineString", coordinates: [point.geometry.coordinates, coords[1]]}});
                });
                _.each(to_edges, function(e){
                    var coords = e.geometry.coordinates;
                    edit_edges[e.id] = _.extend( {}, e, {geometry: {type:"LineString", coordinates: [coords[0], point.geometry.coordinates]}});
                });
                return _.extend({}, graph_state, {edit_points:edit_points,edit_edges:edit_edges})
            
            case GRAPH_CANCEL:
                return _.extend({}, graph_state, {edit_points:graph_state.points,edit_edges:graph_state.edges} );
            
            case GRAPH_HAS_SAVED:
                return _.extend({}, graph_state, {points:graph_state.edit_points,edges:graph_state.edit_edges} );


            default:
                return graph_state;
        }

    }

    function globalReduser(state, action){
        switch(action.type){
            case TENANT_LOADED:
            case SWITCH_FLOOR:
                var selected_tenants =  _.chain(state.tenants)
                    .filter(_.property('geometry'))
                    .filter(function(t) { return t.floor === state.ui.selected_floor})
                    .map(_.property('id'))
                    .value();
                state.ui = _.extend({}, state.ui, {selected_tenants:selected_tenants} )
                break;     
            case POINT_NEW:
                var geometry = action.payload;
                var id = generate_id(state.graph.edit_points);; 
                var point = { point_type: "path", geometry: geometry, id:id, type: "Feature", floor: state.ui.selected_floor }
                var edit_points = _.extend({}, state.graph.edit_points, _.object([ [id, point] ]) );
                state.graph =  _.extend({}, state.graph, {edit_points: edit_points});
                break;
            case POINT_REMOVE:
                if(!state.graph.edit_points.length)
                    state.ui = _.extend({}, state.ui, {editing_mode:null} )
                break;
        }
        return state;
    }

    return function(state, action) {
        state = {
            ui: ui(state.ui, action),
            tenants: tenats(state.tenants, action),
            graph: graph(state.graph, action)  
        }
        return globalReduser(state, action);
    }

});
