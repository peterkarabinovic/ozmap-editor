app.controller("MapController", function(store, actions){

    var selfcheck = new Selfcheck();

    /**********************************************************
       Init Map    
     **********************************************************/
    var map = L.map('map', {
        crs: L.CRS.Simple,
        maxZoom: -1,
        minZoom: -1,
        zoomControl: false,
        dragging: false
    });

    /**********************************************************
       Floor switch    
     **********************************************************/
    var floor_img_size = [ [896, 1171.4], [814.4, 964.9], [781.8, 752.1] ]
    var floor_imgs = [LEVEL1_SVG_URL,LEVEL2_SVG_URL,LEVEL3_SVG_URL]
    var cur_img = null;
    var updateFloor = function(){
        if(cur_img)
            map.removeLayer(cur_img)
        var floor = store.state.floor;
        var bounds = [[0,0], floor_img_size[floor-1]];
        cur_img = L.imageOverlay(floor_imgs[floor-1], bounds, {crossOrigin:true}).addTo(map);
        map.fitBounds(bounds, {animate: false});
        
    }
    store.on('floor', updateFloor);
    updateFloor();
    
});