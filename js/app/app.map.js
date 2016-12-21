/**********************************************************
 Map styles    
 **********************************************************/
tenantStyle = {
    color: '#009688'
}

tenantEditStyle = {
    color: '#3f51b5'
}

var pointStyle = {
    radius: 5,
    fillColor: "#FFF",
    color: "#009688",
    weight: 2,
    opacity: 1,
    fillOpacity: 1,
    pane: "popupPane"
};

var highlightCircleStyle = {
    radius: 8,
    fillColor: "red",
    color: "red",
    weight: 0,
    fillOpacity: 0.5    
}

var edgeStyle = {
    color: '#009688',
    weight: 2
}
var pointStyle2 = {
    icon: L.icon({iconUrl: "css/images/point.svg", iconSize: [14, 14]}),
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

    /**********************************************************
       Drawing & editing     
     **********************************************************/
    var tenantLayer = new L.FeatureGroup();
    var tenantEditLayer = new L.FeatureGroup();
    var pointLayer = new L.FeatureGroup();
    var edgeLayer = new L.FeatureGroup();
    map.addLayer(tenantLayer)
       .addLayer(tenantEditLayer)
       .addLayer(edgeLayer)
       .addLayer(pointLayer);

    var polygonDrawer = new L.Draw.Polygon(map, {
                guidelineDistance: 10,
                shapeOptions: tenantEditStyle
    });

    var pointDrawer = new L.Draw.Marker(map, {
        icon: L.icon({iconUrl: "css/images/two_point.svg", iconSize: [18, 18]}),
        repeatMode: true
    });

    var edgeDrawer = new EdgeDrawer(map, pointLayer);
   
    L.drawLocal.draw.handlers.polygon.tooltip = {
        start: 'Кликните на карте для начала рисования.',
        cont: 'Кликните на карте продолжая фигуру.',
        end: 'Кликните на первую точку для завершения.'        
    }

    L.Draw.Polygon = L.Draw.Polygon.extend({
        options : {
            icon: L.icon({iconUrl: "css/images/one_point.svg", iconSize: [18, 18]}),
        }
    });
    
    L.Edit.PolyVerticesEdit = L.Edit.PolyVerticesEdit.extend({
        options : {
            icon: L.icon({iconUrl: "css/images/one_point.svg", iconSize: [18, 18]}),
        }
    });

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
        features = _.clone(features);
        var ids = _.map(features, _.property('id'))
        var removes = _.reject(layer.getLayers(), function(l) { 
            var index = ids.indexOf(l.id);
            if(index > -1 ){
                ids.splice(index,1);
                features.splice(index,1);
            }
            return index > -1;
        })
        var appends = _.map(features, function(p){
            return L.geoJSON(p, options);
        });
        map.removeLayer(layer)
        _.each(removes, function(l){ layer.removeLayer(l); })
        _.each(appends, function(l){ layer.addLayer(l); })
        map.addLayer(layer)
    }

    store.on('graph.edit_points', function(){
        var options = { 
                pointToLayer: function (feature, latlng) { 
                    return L.marker(latlng, pointStyle2).on('dragend', onDragend);
                }
            }
        updateLayer(pointLayer, store.state.graph.edit_points, options);
        pointLayer.setZIndex(500);
    });

    store.on('graph.edit_edges', function(){
        updateLayer(edgeLayer, store.state.graph.edit_edges, edgeStyle);
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
        switch(store.state.ui.editing_mode){
            case REMOVING:
                var is_point = _.isEqual("Point", feature.geometry.type);
                if(is_point)
                    store.dispatch(actions.removePoint(feature));
                else 
                    store.dispatch(actions.removeEdge(feature));
                break;

            case MAP_SELECTION:
                break;
            default:
                store.dispatch( actions.editTenant(feature) )
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
            // e.latlng.lng = e.latlng.lng - 10; 
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

/**
 *  polyline with arrows
 * */
L.LeafletPolyline = L.Polyline
L.Polyline = L.Polyline.extend({

   
    initialize: function (latlngs, options){
        L.LeafletPolyline.prototype.initialize.call(this, latlngs, options);
    },
    
    onRemove: function (map) {
        L.LeafletPolyline.prototype.onRemove.call(this,map);
    },
    
    _updatePath: function () {
        if (!this._map) 
            return;
        L.LeafletPolyline.prototype._updatePath.call(this);
        L.Arrows.add(this);
    }
});


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

