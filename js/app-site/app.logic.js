// ACTIONS

var INIT_ACTION = 'init';

app.factory('actions', function(){
    return {
    };
})

app.factory('reducers', function(){

    return function(state, action) {
        state = _.isEmpty(state) ? {
            floor: 1,
            graph: {},
            point_types: {}
        } : state; 

        switch(action.type){
            case "SWITCH_FLOOR":
                state = _.extend({},state, {floor: action.payload});
                break;

            case "GRAPH_LOADED":
                state = _.extend({},state, {graph: action.payload});            
                break;

            case "POINT_TYPES_LOADED":
                state = _.extend({},state, {point_types: action.payload});      
                break;
        }
        return state;
    }

});
