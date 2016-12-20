app.controller("MapController", function(store, actions){
    var selfcheck = new Selfcheck();
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
    var editItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    map.addLayer(editItems);

   
    L.drawLocal.draw.handlers.polygon.tooltip = {
        start: 'Кликните на карте для начала рисования.',
        cont: 'Кликните на карте продолжая фигуру.',
        end: 'Кликните на первую точку для завершения.'        
    }

    L.Draw.Polygon = L.Draw.Polygon.extend({
        options : {
            icon: L.icon({iconUrl: "css/images/one_point.svg", iconSize: [18, 18]})
        }
    });
    
    L.Edit.PolyVerticesEdit = L.Edit.PolyVerticesEdit.extend({
        options : {
            icon: L.icon({iconUrl: "css/images/one_point.svg", iconSize: [18, 18]}),
        }
    });

    var polygonDrawer = new L.Draw.Polygon(map, {
                guidelineDistance: 10,
                shapeOptions: {
                    color: '#009688',
    }});


    store.on('ui.edited_tenant', function(){
        var tenant = store.state.ui.edited_tenant;
        editItems.clearLayers();
        if(tenant) {            
            if(tenant.geom) {
                polygonDrawer.disable(); 
                store.dispatch(actions.mapGeoJSON(tenant.geom));
            }
            else {
                polygonDrawer.enable();
            }
        }
        else   
            polygonDrawer.disable();     
    });

    store.on('ui.edit_geometry', selfcheck(function(){
        editItems.clearLayers();
        if(!store.state.ui.edit_geometry) {
            if(store.state.ui.edited_tenant){
                polygonDrawer.disable(); 
                polygonDrawer.enable();
            }
            editItems.clearLayers();
        }
        else {
            var layer = L.geoJSON(store.state.ui.edit_geometry).getLayers()[0];
            editItems.addLayer(layer);
            layer.editing.enable();
            layer.on('edit', selfcheck(function(e){
                var geoJson = e.target.toGeoJSON().geometry;
                store.dispatch(actions.mapGeoJSON(geoJson));
            }))
        }
    }));

    store.on('ui.selected_tenants', function(){
        var selected_ids = _.clone(store.state.ui.selected_tenants);
        
        var removes = _.reject(drawnItems.getLayers(), function(l){
            var index = selected_ids.indexOf(l.id);
            if( index > -1 ) {
                selected_ids.splice(index, 1);
            }
            return index > -1
        });
        var appends =  _.map(selected_ids, function(id){
            var t = store.state.tenants[id]
            if(t.geom) {
                var layer = L.geoJSON(t.geom);
                layer.id = id;
                return layer;
            }
            else 
                return null;
        });
        appends = _.compact(appends);
        map.removeLayer(drawnItems)
        _.each(removes, function(l){ drawnItems.removeLayer(l); })
        _.each(appends, function(l){ drawnItems.addLayer(l); })
        map.addLayer(drawnItems)


    });

    map.on(L.Draw.Event.CREATED, function (e) {
        var layer = e.layer;
        var geoJson = layer.toGeoJSON().geometry;
        store.dispatch(actions.mapGeoJSON(geoJson));
    });


    

    

});