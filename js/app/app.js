var app = angular.module('ozmap-editor', []);

app.run(function(store){
    store.dispatch({type: INIT_ACTION });
});


function Selfcheck(){
    var me = false;
    return function(callback){
        return function(){
            if(me) return; 
            me = true;
            try{var res = callback.apply(this, arguments); } finally {me= false;}
            return res;
        } 
    }
}

String.prototype.startsWith = function(str) { 
    return this.indexOf(str) === 0;
};