// ACTIONS

var INIT_ACTION = 'init',
    SELECT_TAB = 'select_tab',
    SWITCH_FLOOR = "switch_floor"

var TENANT_SELECT = 'tselect',
    TENANT_EDIT = 'tedit',
    TENANT_NEW_GEOMETRY = 't_newgeometry',
    TENANT_SAVE = 't_save',
    TENANT_SAVING = 't_saving',
    TENANT_HAS_SAVED = 't_has_saved',
    TENANT_LOADED = 't_loaded',
    TENANT_SELETION = 't_selection';

var MAP_DRAWING_POLYGON = "map_drawing",
    MAP_GEOJSON = 'map_geojson';

app.factory('actions', function(){
    return {
        tenatsLoaded: function(d) { return {type: TENANT_LOADED, payload: d} },
        tenantSave: function(id, geometry) { return {type: TENANT_SAVE, payload: {id:id, geometry: geometry}} },
        selectTab: function(tab) { return {type: SELECT_TAB, payload: tab} },
        switchFloor: function(floor) { return {type: SWITCH_FLOOR, payload: floor} },
        editTenant: function(tenant) { return {type: TENANT_EDIT, payload: tenant} },
        mapGeoJSON: function(json) { return {type:MAP_GEOJSON, payload: json}} ,
        tenantSelection: function(sel_list) { return {type:TENANT_SELETION, payload: sel_list}}
    };
})

app.factory('reducers', function(){

    function ui(ui_state, action){
        ui_state = ui_state || {selected_tab: 'tenants_tab',
                                selected_floor: 1,
                                selected_tenants: [],
                                selected_point: null,
                                edited_tenant: null,
                                edit_point: null,
                                edit_geometry: null,
                                tenant_saving: false };

        switch(action.type){
            case SELECT_TAB:
                return _.extend({}, ui_state, {selected_tab: action.payload});
            case SWITCH_FLOOR:
                return _.extend({}, ui_state, {selected_floor: action.payload,
                                               selected_tenants: [],  
                                               edited_tenant: null, edit_geometry: null});
            case TENANT_EDIT:
                return _.extend({}, ui_state, {edited_tenant: action.payload, edit_geometry: null});
            case MAP_GEOJSON:
                return _.extend({}, ui_state, {edit_geometry: action.payload});
            case TENANT_SAVING:
                return _.extend({}, ui_state, {tenant_saving: true});
            case TENANT_HAS_SAVED:
                return _.extend({}, ui_state, {edited_tenant: null, tenant_saving: false});
            case TENANT_SELETION:
                return _.extend({}, ui_state, {selected_tenants: action.payload});
                
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
                var id = action.payload.id,
                    geom = action.payload.geometry;
                if( tenants_state[id] ) {
                    var t = _.extend({}, tenants_state[id], {geom:geom});
                    return _.extend({}, tenants_state, _.object([id], [t]));
                }
            default:
                return tenants_state;
        }
    }

    function graph(graph_state, action){
        graph_state = graph_state || {};
        switch(action.type){
            default:
                return graph_state;
        }

    }

    return function(state, action) {
        return {
            ui: ui(state.ui, action),
            tenants: tenats(state.tenants, action),
            graph: graph(state.graph, action)  
        }
    }

});
