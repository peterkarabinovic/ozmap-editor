app.controller("MapController", function(store, actions){
    
    var map = L.map('map', {
        crs: L.CRS.Simple,
        maxZoom: 2,
        minZoom: -1,
        zoomControl: false
    });


    var floor_img_size = [ [896, 1171.4], [814.4, 964.9], [781.8, 752.1] ]
    var cur_img = null;
    var updateFloor = function(){
        if(cur_img)
            map.removeLayer(cur_img)
        var floor = store.state.ui.selected_floor;
        var bounds = [[0,0], floor_img_size[floor-1]];
        cur_img = L.imageOverlay('data/'+floor+'level.svg', bounds, {crossOrigin:true}).addTo(map);
        map.fitBounds(bounds);
        
    }
    store.on('ui.selected_floor', updateFloor);
    updateFloor();

    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    var drawControl = new L.Control.Draw({
        edit:{
             featureGroup: drawnItems,
             edit: false
         },
        draw: {
            polyline: false,
            circle: false,
            rectangle: false,
            polygon: {
                shapeOptions: {
                    color: 'red'
                }
            }
        }
    });

    store.on('ui.edited_tenant', function(){
        var tenant = store.state.ui.edited_tenant;
        drawnItems.clearLayers();
        if(tenant) {
            map.addControl(drawControl);
            if(tenant.geom) {
                var layer = L.geoJSON(tenant.geom);
                drawnItems.addLayer(layer);
            }
        }
        else        
            map.removeControl(drawControl);
    });

    map.on(L.Draw.Event.CREATED, function (e) {
        var layer = e.layer;
        drawnItems.addLayer(layer);
        var geoJson = layer.toGeoJSON().geometry;
        store.dispatch(actions.mapGeoJSON(geoJson));
        layer.editing.enable();
    });
    
    

});