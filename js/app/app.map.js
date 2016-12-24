/**********************************************************
 Map styles    
 **********************************************************/
tenantStyle = {
    color: '#009688'
}

tenantEditStyle = {
    color: '#3f51b5'
}

var editPointStyle = {
    radius: 8,
    fillColor: "red",
    color: "white",
    weight: 2,
    opacity: 1,
    fillOpacity:1,
    pane: "popupPane"
};

var edgeStyle = {
    color: '#009688',
    weight: 2
}

var icons = function(point_type){
    var size = point_type == 'path' ? [15, 15] : [35, 35]; 
    return L.icon({iconUrl: "data/icons/"+point_type+".svg", iconSize: size})
}

var editPointStyle2 = {
    icon: L.icon({iconUrl: "css/images/edit_point.svg", iconSize: [15, 15]}),
    draggable: true
}


app.controller("MapController", function(store, actions){

    var selfcheck = new Selfcheck();

    /**********************************************************
       Init Map    
     **********************************************************/
    var map = L.map('map', {
        crs: L.CRS.Simple,
        maxZoom: 2,
        minZoom: -1,
        zoomControl: false
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
        var floor = store.state.ui.selected_floor;
        var bounds = [[0,0], floor_img_size[floor-1]];
        cur_img = L.imageOverlay(floor_imgs[floor-1], bounds, {crossOrigin:true}).addTo(map);
        map.fitBounds(bounds);
        
    }
    store.on('ui.selected_floor', updateFloor);
    updateFloor();

    /**********************************************************
       Drawing & editing     
     **********************************************************/
    var tenantLayer = new L.FeatureGroup();
    var tenantEditLayer = new L.FeatureGroup();
    var pointLayer = new L.FeatureGroup();
    var edgeLayer = new L.FeatureGroup();
    var editPointMarker = L.marker([], editPointStyle2).setZIndexOffset(1000)
    map.addLayer(tenantLayer)
       .addLayer(tenantEditLayer)
       .addLayer(edgeLayer)
       .addLayer(pointLayer);

    var polygonDrawer = new L.Draw.Polygon(map, {
                // guidelineDistance: 10,
                shapeOptions: tenantEditStyle
    });

    var pointDrawer = new L.Draw.Marker(map, {
        icon: L.icon({iconUrl: "css/images/one_point.svg", iconSize: [18, 18]}),
        repeatMode: true
    });

    var edgeDrawer = new EdgeDrawer(map, pointLayer);
   
    L.drawLocal.draw.handlers.polygon.tooltip = {
        start: 'Кликните на карте для начала рисования.',
        cont: 'Кликните на карте продолжая фигуру.',
        end: 'Кликните на первую точку для завершения.'        
    }

    L.drawLocal.draw.handlers.marker.tooltip = {
        start: 'Кликните на карте что бы поставить точку.',
    }

    L.Draw.Polygon = L.Draw.Polygon.extend({
        options : {
            icon: L.icon({iconUrl: "css/images/one_point.svg", iconSize: [18, 18]}),
            touchIcon: L.icon({iconUrl: "css/images/one_point.svg", iconSize: [18, 18]}),             
        }
    });
    
    L.Edit.PolyVerticesEdit = L.Edit.PolyVerticesEdit.extend({
        options : {
            icon: L.icon({iconUrl: "css/images/one_point.svg", iconSize: [18, 18]}),
            touchIcon: L.icon({iconUrl: "css/images/one_point.svg", iconSize: [18, 18]}), 
        }
    });

    /**********************************************************
       Helper functions     
     **********************************************************/
    function features_fn(layer){
        return _.chain(layer.getLayers()).map(function(l){ return l.getLayers()}).flatten().map(_.property('feature')).value();
    }

    function layer_by_featid(layer, feat_id){
        return _.find(layer.getLayers(), function(l) { return l.getLayers()[0].feature.id === feat_id})
    }

    /**********************************************************
       Logic, listeners & actions     
     **********************************************************/

    store.on('ui.editing_mode', function(){
        polygonDrawer.disable();
        pointDrawer.disable();
        edgeDrawer.disable();
        _.each([tenantLayer, pointLayer, edgeLayer ], function(l){
            l.off('click', onClick)
        });
        _.each(pointLayer.getLayers(), function(ll){
            _.each(ll.getLayers(), function(l){l.dragging.disable()}); 
            
        });

        switch(store.state.ui.editing_mode){
            case TENANT_EDIT:
                var tenant = store.state.ui.edit_tenant;
                if(!tenant.geometry) 
                    polygonDrawer.enable();
                break;
            case POINT_ADDING:
                pointDrawer.enable();
                break;
            case EDGE_ADDING:
                edgeDrawer.enable();
                break;
            case REMOVING:
                _.each([pointLayer, edgeLayer], function(l){
                    l.on('click', onClick)
                });
                break;
            case MAP_SELECTION:
                _.each(pointLayer.getLayers(), function(ll){
                    _.each(ll.getLayers(), function(l){l.dragging.enable()}); 
                    
                });
                

            default:
                tenantLayer.on('click', onClick)
                pointLayer.on('click', onClick)
        }
    });

    store.on('ui.edit_tenant', selfcheck(function(){
        var tenant = store.state.ui.edit_tenant;
        tenantEditLayer.clearLayers();
        if(tenant && tenant.geometry) {
            var layer = L.geoJSON(tenant.geometry,tenantEditStyle).getLayers()[0];
            tenantEditLayer.addLayer(layer);
            layer.editing.enable();
            layer.on('edit',onEdit);
            polygonDrawer.disable();
            var drawnLayer = _.find( tenantLayer.getLayers(), function(l) { return l.id == tenant.id  });
            if(drawnLayer) tenantLayer.removeLayer(drawnLayer);
        }
        else {
            polygonDrawer.enable();
            redrawTenants();
        }
    }));

    store.on("ui.edit_point", selfcheck(function(e){
        var edit_point = e.new_state;
        if(edit_point) 
            editPointMarker.setLatLng(latlngF(edit_point)).addTo(map);
        else
            map.removeLayer(editPointMarker);
    }));

    editPointMarker.on('drag', selfcheck(function(e){
        var latlng = e.target.getLatLng();
        var coords = [latlng.lng, latlng.lat];
        store.state.ui.edit_point.geometry = { type: "Point", coordinates: coords };
        store.dispatch(actions.pointMove(store.state.ui.edit_point)); 

    }));    

    var redrawTenants = function(){
        var selected_ids = _.clone(store.state.ui.selected_tenants);
        
        var removes = _.reject(tenantLayer.getLayers(), function(l){
            var index = selected_ids.indexOf(l.id);
            if( index > -1 ) {
                selected_ids.splice(index, 1);
            }
            return index > -1
        });
        var appends =  _.map(selected_ids, function(id){
            var t = store.state.tenants[id]
            if(t.geometry) {
                var layer = L.geoJSON(t, tenantStyle);
                layer.id = id;
                return layer;
            }
            else 
                return null;
        });
        appends = _.compact(appends);
        map.removeLayer(tenantLayer)
        _.each(removes, function(l){ tenantLayer.removeLayer(l); })
        _.each(appends, function(l){ tenantLayer.addLayer(l); })
        map.addLayer(tenantLayer)

    }
    store.on('ui.selected_tenants', redrawTenants);
    store.on('tenants', function(){
        tenantLayer.clearLayers();
        redrawTenants();    
    });

    function updateLayer(layer, features, options){
        features = _.values(features);
        var map_features = features_fn(layer);

        map.removeLayer(layer)
        var ff = _.difference(map_features, features);
        // Removes
        _.chain(map_features)
                .difference(features)
                .map( function(f) { 
                    return layer_by_featid(layer, f.id);
                 }) 
                .each( function(l) { 
                    layer.removeLayer(l);
                })
                .value();

        // Adding
         _.chain(features)
                .difference(map_features)
                .map(function(f){
                    return L.geoJSON(f, options);
                })
                .each(function(l){
                    layer.addLayer(l);
                });
        map.addLayer(layer)
    }

    store.on('graph.edit_points ui.selected_floor', function(){
        var options = { 
                pointToLayer: function (feature, latlng) { 
                    var icon = icons(feature.point_type);    
                    return L.marker(latlng, {icon:icon, draggable: true}).on('dragend', onDragend);
                }
            }
        var floor = store.state.ui.selected_floor;
        var points = _.filter( store.state.graph.edit_points, function(p){ return p.floor === floor});
        updateLayer(pointLayer, points, options);
        pointLayer.setZIndex(500);
    });

    store.on('graph.edit_edges ui.selected_floor', function(){
        var floor = store.state.ui.selected_floor;
        var points = store.state.graph.edit_points;
        var edges = _.filter( store.state.graph.edit_edges, function(e) { return points[e.from_id].floor === floor; })
        updateLayer(edgeLayer, edges, edgeStyle);
        _.each(edgeLayer.getLayers(), function(l){
            L.Arrows.add(l.getLayers()[0]);
        })
    });


    var onEdit = selfcheck(function(e)
    {
        var layer = e.target;
        var geometry = layer.toGeoJSON().geometry;
        switch(store.state.ui.editing_mode){
            case TENANT_EDIT:
                return store.dispatch(actions.newTenantGeometry(geometry));
        }
    });

    var onClick = function(e){
        var feature = e.layer.feature;
        var geo_type = feature.geometry.type;
        
        switch(store.state.ui.editing_mode){
            case REMOVING:
                if(geo_type == "Point")
                    store.dispatch(actions.removePoint(feature));
                else 
                    store.dispatch(actions.removeEdge(feature));
                break;

            // case MAP_SELECTION:
            //     break;
            default:
                if(geo_type === "Polygon")
                    store.dispatch( actions.editTenant(feature) )
                else if(geo_type == "Point")
                    store.dispatch( actions.editPoint(feature) )
        }
        
    }

    var onDragend = function(e){
        var point = e.target.toGeoJSON();
        store.dispatch(actions.pointMove(point))
    }



    map.on(L.Draw.Event.CREATED, function (e) {
        var layer = e.layer;
        var geometry = layer.toGeoJSON().geometry;
        switch(store.state.ui.editing_mode){
            case TENANT_EDIT:
                return store.dispatch(actions.newTenantGeometry(geometry));
            case POINT_ADDING:
                return store.dispatch(actions.newPoint(geometry));
            case EDGE_ADDING:
                return store.dispatch(actions.newEdge(layer.feature));

        }
    });
    
    tenantLayer.on('click', onClick)
    pointLayer.on('click', onClick)
    edgeLayer.on('click', onClick)

});

function EdgeDrawer(map, pointLayer){
    ed = {};
    
    var first_point = null;
    var line = L.polyline([],edgeStyle)
    ed.enable = function(){
        state = 'enable';
        map.on('mousemove', onMove);
        pointLayer.on('click', onPoint)
    }

    ed.disable = function(){
        pointLayer.off('click', onPoint);
        map.removeLayer(line);
    }

    function onPoint(e){
        if(!first_point) {
            first_point = e.layer.feature;
            var latlng = e.layer.getLatLng();
            line.setLatLngs([latlng,latlng]);
            map.addLayer(line); 
        }
        else {
            var point = e.layer.feature;
            if(_.isEqual(first_point, point)) return;
            var latlngs = [latlngF(first_point), latlngF(point)];
            var edge = L.polyline(latlngs);
            edge.feature = {
                from_id: first_point.id,
                to_id: point.id,
                geometry: geometry = edge.toGeoJSON().geometry
            }
            map.removeLayer(line);
            first_point = null;
            map.fire(L.Draw.Event.CREATED, {layer:edge});
        }
    }



    function onMove(e){

        if(first_point) {
            var latlngs = line.getLatLngs();
            e.latlng.lat += e.latlng.lat > first_point.geometry.coordinates[1] ? -5 :  5; 
            e.latlng.lng += e.latlng.lng > first_point.geometry.coordinates[0] ? -5 :  5; 
            latlngs[1] = e.latlng;
            line.setLatLngs(latlngs);
        }
    }

    return ed;
}

function latlngF(feature){
    return L.latLng(feature.geometry.coordinates[1],
                    feature.geometry.coordinates[0]);
}


L.Arrows = {

    arrowoptions: {
        clickable: false,
        stroke: false,
    },
    
    $marker: null,
    
    init: function (line) {
        if(this.$marker) return;
        this.$marker = L.SVG.create('marker');
        line._renderer._container.appendChild(this.$marker);
        var attr = _.bind(this.$marker.setAttribute, this.$marker);
            attr("id", 'marker_route');
            attr("refX", 0);
            attr("refY", 0);
            attr("orient", "auto");
            this.$marker.style.overflow = "visible";
        var $path = L.SVG.create( 'path');
        this.$marker.appendChild($path);
            attr = _.bind($path.setAttribute, $path);
            attr("d", "M 0,0 5,-5 -12,0 5,5 0,0 z");
            attr("transform", "matrix(-0.4,0,0,-0.4,-4,0)");
            attr("stroke-width", 8);
            attr("fill",'#009688');
            attr('stroke', 'none');
    },
    
    add: function(line){
        this.init(line);
        line._path.setAttribute('marker-end','url(#marker_route)');
        return;
    }
};

