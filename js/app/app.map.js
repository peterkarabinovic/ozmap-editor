app.controller("MapController", function($rootScope, store){
    
    var map = L.map('map', {
        crs: L.CRS.Simple,
        maxZoom: 2,
        minZoom: -1,
        zoomControl: false
    });

    var bounds = [[0,0], [896, 1171.4]];
    var image = L.imageOverlay('data/1level.svg', bounds, {crossOrigin:true}).addTo(map);
    map.fitBounds(bounds);

});