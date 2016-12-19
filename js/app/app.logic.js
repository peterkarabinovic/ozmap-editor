// ACTIONS

var INIT_ACTION = 'init',
    SELECT_TAB = 'select_tab'

var TENAT_SELECT = 'tselect',
    TENAT_EDIT = 'tedit',
    TENAT_NEW_GEOMETRY = 't_newgeometry',
    TENAT_SAVE = 't_save',
    TENAT_LOADED = 't_loaded';

var MAP_DRAWING_POLYGON = "map_drawing"

app.factory('actions', function(){
    return {
        tenatsLoaded: function(d) { return {type: TENAT_LOADED, payload: d} },
        selectTab: function(tab) { return {type: SELECT_TAB, payload: tab} },
    };
})

app.factory('reducers', function(){

    function ui(ui_state, action){
        ui_state = ui_state || {selected_tab: 'tenants_tab',
                                selected_tenat: null,
                                selected_point: null,
                                edited_tenat: null,
                                edit_point: null };

        switch(action.type){
            case SELECT_TAB:
                return _.extend({}, ui_state, {selected_tab: action.payload});
            default:
                return ui_state;
        }

    }

    function tenats(tenats_state, action){
        tenats_state = tenats_state || [];
        switch(action.type){
            default:
                return tenats_state;
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
            tenats: tenats(state.tenats, action),
            graph: graph(state.graph, action)  
        }
    }

});
