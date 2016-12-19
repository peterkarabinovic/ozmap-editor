var app = angular.module('ozmap-editor', []);

app.run(function(store){
    store.dispatch({type: INIT_ACTION });
});


