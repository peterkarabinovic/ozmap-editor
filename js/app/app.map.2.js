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
    radius: 6,
    fillColor: "#FFF",
    color: "#009688",
    weight: 2,
    opacity: 1,
    fillOpacity: 0.7
};

var highlightCircleStyle = {
    radius: 8,
    fillColor: "red",
    color: "red",
    weight: 0,
    fillOpacity: 0.5    
}

var edgeStyle = {
    color: '#3f51b5'
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
    var pointEditLayer = new L.FeatureGroup();
    var edgeLayer = new L.FeatureGroup();
    map.addLayer(tenantLayer)
       .addLayer(tenantEditLayer)
       .addLayer(pointLayer)
       .addLayer(pointEditLayer)
       .addLayer(edgeLayer);

    var polygonDrawer = new L.Draw.Polygon(map, {
                guidelineDistance: 10,
                shapeOptions: tenantEditStyle
    });

    var pointDrawer = new L.Draw.Marker(map, {
        icon: L.icon({iconUrl: "css/images/two_point.svg", iconSize: [18, 18]}),
        repeatMode: true
    });

    var edgeDrawer = new EdgeDrawer(map, pointLayer, pointEditLayer);
   
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

        switch(store.state.ui.editing_mode){
            case TENANT_EDIT:

        }
    });
        

    store.on('ui.editing_mode', function(){
        polygonDrawer.disable();
        pointDrawer.disable();
        edgeDrawer.disable();
        _.each([tenantLayer, pointLayer, pointEditLayer, edgeLayer ], function(l){
            l.off('click', onClick)
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
                _.each([pointLayer, pointEditLayer, edgeLayer], function(l){
                    l.on('click', onClick)
                });
                break;

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

    store.on('ui.edit_points', function(){
        var edit_points = _.clone(store.state.ui.edit_points);
        var ids = _.map(edit_points, _.property('id'))
        var removes = _.reject(pointEditLayer.getLayers(), function(l) { 
            var index = ids.indexOf(l.id);
            if(index > -1 ){
                ids.splice(index,1);
                edit_points.splice(index,1);
            }
            return index > -1;
        })
        var appends = _.map(edit_points, function(p){
            return L.geoJSON(p, { 
                pointToLayer: function (feature, latlng) { 
                    return L.circleMarker(latlng, pointStyle);
                }});
        });
        map.removeLayer(pointEditLayer)
        _.each(removes, function(l){ pointEditLayer.removeLayer(l); })
        _.each(appends, function(l){ pointEditLayer.addLayer(l); })
        map.addLayer(pointEditLayer)
    })


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

    map.on(L.Draw.Event.CREATED, function (e) {
        var layer = e.layer;
        var geometry = layer.toGeoJSON().geometry;
        switch(store.state.ui.editing_mode){
            case TENANT_EDIT:
                return store.dispatch(actions.newTenantGeometry(geometry));
            case POINT_ADDING:
                return store.dispatch(actions.newPoint(geometry))

        }
    });
    
    tenantLayer.on('click', onClick)
    pointLayer.on('click', onClick)
    edgeLayer.on('click', onClick)

});

function EdgeDrawer(map, pointLayer1, pointLayer2){
    ed = {};
    
    var index = null;
    var first_point = null;
    var line = L.polyline([],edgeStyle)
    var highlightCircle = L.circleMarker([], highlightCircleStyle);
    ed.enable = function(){
        state = 'enable';
        buildIndex();
        map.on('mousemove', onMove);
        map.on('zoomend', buildIndex);
        highlightCircle.on('click', onPoint)
    }

    ed.disable = function(){
        map.off('mousemove', onMove);
        map.off('zoomend', buildIndex);
        highlightCircle.off('click', onPoint);
        map.removeLayer(line).removeLayer(highlightCircle);
    }

    function buildIndex(){
        index = new KdTree(5);
        _.each([pointLayer1, pointLayer2], function(l) {
                    _.each(l.getLayers(), function(p){
                        var feature = p.getLayers()[0].feature;
                        var lp = map.latLngToLayerPoint(p.getLayers()[0].getLatLng());
                        index.insert(lp, feature);
                    }) 
                });       
    }

    function onPoint(e){
        if(!first_point) {
            first_point = highlightCircle.feature;
            var latlng = highlightCircle.getLatLng();
            line.setLatLngs([latlng,latlng]);
            map.addLayer(line); 
        }
    }



    function onMove(e){
        var lp = e.layerPoint,
            r = index.tolerance * map.getZoom(),
            env = new Envelope(lp.x-r,lp.x+r , lp.y-r,lp.y+r);
        var nodes = index.query(env);
        if(_.isEmpty(nodes))
            map.removeLayer(highlightCircle);
        else {
            var feature = nodes[0].data[0]; 
            var xy = feature.geometry.coordinates;
            highlightCircle.setLatLng([xy[1], xy[0]]);
            highlightCircle.feature = feature;
            map.addLayer(highlightCircle);
        }
        if(first_point) {
            var latlngs = line.getLatLngs();
            latlngs[1] = e.latlng;
            line.setLatLngs(latlngs);
        }
    }

    return ed;
}



/**
 *  Реализация KdTree- индекса
 *  взято из JTS https://github.com/bjornharrtell/jsts
 *
 *  Только я не все взял
 *      я не взял geom.Coordinate, а просто заменил его {x:x,y:y}
 *      я взял только необходимое из  Envelope
 */


//
// Envelope 
//
Envelope = function(x1,x2,y1,y2) 
{
  if (x1 < x2) {
       this.minx = x1;
       this.maxx = x2;
  } else {
       this.minx = x2;
       this.maxx = x1;
  }
  if (y1 < y2) {
       this.miny = y1;
       this.maxy = y2;
  } else {
       this.miny = y2;
       this.maxy = y1;
  }
};

Envelope.prototype = {
    contains: function(p){
        if(this.maxx < this.minx) return false;
        return p.x >= this.minx && p.x <= this.maxx && p.y >= this.miny && p.y <= this.maxy;
    }
}



//
// KdNode 
//
KdNode = function(p, data) {
  this.left = null;
  this.right = null;
  this.p = p;
  this.data = [data];
};
KdNode.prototype.getCoordinate = function() {
  return this.p;
};




KdTree = function(tolerance) {
  var tol = 0.0;
  if (tolerance !== undefined) {
    tol = tolerance;
  }

  this.root = null;
  this.last = null;
  this.numberOfNodes = 0;
  this.tolerance = tol;
};


/**
* Inserts a new point in the kd-tree.
*
* Will call correct *insert function depending on arguments
*
* @return {KdNode} The kd-node containing the point.
*/
KdTree.prototype.insert = function(p, data) 
{
  if (this.root === null) {
    this.root = new KdNode(p, data);
    return this.root;
  }

  var currentNode = this.root, leafNode = this.root, isOddLevel = true, isLessThan = true;

  // traverse the tree first cutting the plane left-right the top-bottom
    while (currentNode !== this.last) {
        // test if point is already a node
        if (currentNode !== null) {
            var isInTolerance = this.distance(p, currentNode.getCoordinate()) <= this.tolerance;

            // check if point is already in tree (up to tolerance) and if so simply
            // return existing node
            if (isInTolerance) {
                currentNode.data.push(data);
                return currentNode;
            }
        }
        if (isOddLevel) {
            isLessThan = p.x < currentNode.p.x;
        } else {
            isLessThan = p.y < currentNode.p.y;
        }
        leafNode = currentNode;
        if (isLessThan) {
            currentNode = currentNode.left;
        } else {
            currentNode = currentNode.right;
        }

        isOddLevel = !isOddLevel;
    }

  // no node found, add new leaf node to tree
  this.numberOfNodes = this.numberOfNodes + 1;
  var node = new KdNode(p, data);
  node.left = this.last;
  node.right = this.last;
  if (isLessThan) {
    leafNode.left = node;
  } else {
    leafNode.right = node;
  }
  return node;
};

KdTree.prototype.distance = function(p1,p2) {
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
};


KdTree.prototype.queryNode = function(currentNode,
    bottomNode, queryEnv, odd, result) {
  if (currentNode === bottomNode) {
    return;
  }

  var min, max, discriminant;
  if (odd) {
    min = queryEnv.minx;
    max = queryEnv.maxx;
    discriminant = currentNode.p.x;
  } else {
    min = queryEnv.miny;
    max = queryEnv.maxy;
    discriminant = currentNode.p.y;
  }

  var searchLeft = min < discriminant;
  var searchRight = discriminant <= max;

  if (searchLeft) {
    this.queryNode(currentNode.left, bottomNode, queryEnv, !odd, result);
  }

  if (queryEnv.contains(currentNode.getCoordinate())) {
    result.push(currentNode);
  }

  if (searchRight) {
    this.queryNode(currentNode.right, bottomNode, queryEnv, !odd, result);
  }
};


KdTree.prototype.query = function(queryEnv) {
  var result = [];
  this.queryNode(this.root, this.last, queryEnv, true, result);
  return result;
};

