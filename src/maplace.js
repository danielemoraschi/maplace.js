/**
* Maplace.js
*
* Copyright (c) @YEAR Daniele Moraschi
* Licensed under the MIT license
* For all details and documentation:
* https://maplacejs.com
*
* @version  @VERSION
* @preserve
*/

;(function(root, MaplaceFactory) {

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('MaplaceFactory', ['jquery', 'google'], MaplaceFactory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = MaplaceFactory;
    } else {
        // Browser globals (root is window)
        root.Maplace = MaplaceFactory(root.jQuery, root.google);
    }

}(window || this, function($, google) {
    'use strict';

    // Dropdown menu type
    var html_dropdown = {
        activateCurrent: function(index) {
            this.html_element.find('select').val(index);
        },

        getHtml: function() {
            var self = this;
            var html = '';
            var title, a;

            if (this.scope.calculatedLength > 1) {
                html += '<select class="dropdown controls '
                    + this.o.controls_cssclass + '">';

                if (this.ShowOnMenu(this.scope.view_all_key)) {
                    html += '<option value="' + this.scope.view_all_key + '">'
                        + this.o.view_all_text + '</option>';
                }

                for (a = 0; a < this.scope.calculatedLength; a += 1) {
                    if (this.ShowOnMenu(a)) {
                        html += '<option value="' + (a + 1) + '">'
                            + (this.o.locations[a].title || ('#' + (a + 1)))
                            + '</option>';
                    }
                }
                html += '</select>';

                html = $(html).bind('change', function() {
                    self.ViewOnMap(this.value);
                });
            }

            title = this.o.controls_title;
            if (this.o.controls_title) {
                title = $('<div class="controls_title"></div>').css(
                    this.o.controls_applycss ? {
                        fontWeight: 'bold',
                        fontSize: this.o.controls_on_map ? '12px' : 'inherit',
                        padding: '3px 10px 5px 0'
                    } : {})
                .append(this.o.controls_title);
            }

            this.html_element = $('<div class="wrap_controls"></div>')
                .append(title).append(html);

            return this.html_element;
        }
    };


    // List ul/li menu type
    var html_ullist = {
        html_a: function(i, hash, ttl) {
            var self = this;
            var index = hash || (i + 1);
            var title = ttl || this.o.locations[i].title;
            var el_a = $(
                    '<a data-load="' + index + '" id="ullist_a_'
                    + index + '" href="#' + index + '" title="' + title
                    + '"><span>' + (title || ('#' + (i + 1))) + '</span></a>'
                );

            el_a.css(this.o.controls_applycss ? {
                color: '#666',
                display: 'block',
                padding: '5px',
                fontSize: this.o.controls_on_map ? '12px' : 'inherit',
                textDecoration: 'none'
            } : {});

            el_a.on('click', function(e) {
                e.preventDefault();
                var i = $(this).attr('data-load');
                self.ViewOnMap(i);
            });

            return el_a;
        },

        activateCurrent: function(index) {
            this.html_element.find('li').removeClass('active');
            this.html_element.find('#ullist_a_' + index).parent().addClass('active');
        },

        getHtml: function() {
            var title, a;
            var html = $('<ul class=\'ullist controls ' + this.o.controls_cssclass + '\'></ul>')
                .css(this.o.controls_applycss ? {
                    margin: 0,
                    padding: 0,
                    listStyleType: 'none'
                } : {});

            if (this.ShowOnMenu(this.scope.view_all_key)) {
                html.append($('<li></li>').append(html_ullist.html_a.call(
                    this,
                    false,
                    this.scope.view_all_key, this.o.view_all_text)
                ));
            }

            for (a = 0; a < this.scope.calculatedLength; a++) {
                if (this.ShowOnMenu(a)) {
                    html.append($('<li></li>').append(
                        html_ullist.html_a.call(this, a)
                    ));
                }
            }

            title = this.o.controls_title;
            if (this.o.controls_title) {
                title = $('<div class="controls_title"></div>').css(
                    this.o.controls_applycss ? {
                        fontWeight: 'bold',
                        padding: '3px 10px 5px 0',
                        fontSize: this.o.controls_on_map ? '12px' : 'inherit'
                    } : {})
                .append(this.o.controls_title);
            }

            this.html_element = $('<div class="wrap_controls"></div>')
                .append(title).append(html);

            return this.html_element;
        }
    };


    /**
    * Create a new instance
    * @class Maplace
    * @param args
    * @constructor
    */
    function Maplace(args) {
        this.VERSION = '@VERSION';

        this.scope = {
            freeze_zoom: false,
            view_all_key: 'all',
            loaded: false,
            oMap: false,
            markers: [],
            circles: [],
            infoWindow: null,
            maxZIndex: 0,
            calculatedLength: 0,
            oBounds: null,
            map_div: null,
            canvas_map: null,
            controls_wrapper: null,
            current_control: null,
            current_index: null,
            Polyline: null,
            Polygon: null,
            Fusion: null,
            directionsService: null,
            directionsDisplay: null
        };

        // Default options
        this.o = {
            debug: false,
            map_div: '#gmap',
            controls_div: '#controls',
            generate_controls: true,
            controls_type: 'dropdown',
            controls_cssclass: '',
            controls_title: '',
            controls_on_map: true,
            controls_applycss: true,
            controls_position: google.maps.ControlPosition.RIGHT_TOP,
            type: 'marker',
            view_all: true,
            view_all_text: 'View All',
            pan_on_click: true,
            start: 0,
            locations: [],
            shared: {},
            map_options: {
                mapTypeId: google.maps.MapTypeId.ROADMAP
            },
            stroke_options: {
                strokeColor: '#0000FF',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#0000FF',
                fillOpacity: 0.4
            },
            directions_options: {
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
                optimizeWaypoints: false,
                provideRouteAlternatives: false,
                avoidHighways: false,
                avoidTolls: false
            },
            circle_options: {
                radius: 100,
                visible: true
            },
            styles: {},
            fusion_options: {},
            directions_panel: null,
            draggable: false,
            editable: false,
            show_infoWindows: true,
            show_markers: true,
            infoWindow_type: 'bubble',
            listeners: {},

            // Events
            beforeViewAll: function() {},
            afterViewAll: function() {},
            beforeShow: function(index, location, marker) {},
            afterShow: function(index, location, marker) {},
            afterCreateMarker: function(index, location, marker) {},

            beforeCloseInfowindow: function(index, location) {},
            afterCloseInfowindow: function(index, location) {},
            beforeOpenInfowindow: function(index, location, marker) {},
            afterOpenInfowindow: function(index, location, marker) {},

            afterRoute: function(distance, status, result) {},
            onPolylineClick: function(obj) {},
            onPolygonClick: function(obj) {},

            circleRadiusChanged: function(index, circle, marker) {},
            circleCenterChanged: function(index, circle, marker) {},

            drag: function(index, location, marker) {},
            dragEnd: function(index, location, marker) {},
            dragStart: function(index, location, marker) {}
        };

        // Default menu types
        this.AddControl('dropdown', html_dropdown);
        this.AddControl('list', html_ullist);

        if (args && args.type === 'directions') {
            !args.show_markers && (args.show_markers = false);
            !args.show_infoWindows && (args.show_infoWindows = false);
        }

        // Init
        $.extend(true, this.o, args);
    }

    // Where to store the menu types
    Maplace.prototype.controls = {};

    // Initialize google map object
    Maplace.prototype.create_objMap = function() {
        var self = this;
        var count = 0;
        var i;

        // Check styles
        for (i in this.o.styles) {
            if (this.o.styles.hasOwnProperty(i)) {
                if (count === 0) {
                    this.o.map_options.mapTypeControlOptions = {
                        mapTypeIds: [google.maps.MapTypeId.ROADMAP]
                    };
                }
                count++;
                this.o.map_options.mapTypeControlOptions.mapTypeIds.push(
                    'map_style_' + count
                );
            }
        }

        // If init
        if (! this.scope.loaded) {
            try {
                this.scope.map_div.css({
                    position: 'relative',
                    overflow: 'hidden'
                });

                // Create the container div into map_div
                this.scope.canvas_map = $('<div>').addClass('canvas_map').css({
                    width: '100%',
                    height: '100%'
                }).appendTo(this.scope.map_div);

                this.scope.oMap = new google.maps.Map(
                    this.scope.canvas_map.get(0),
                    this.o.map_options
                );

            } catch (err) {
                this.debug(
                    'create_objMap::' + this.scope.map_div.selector,
                    err.toString()
                );
            }

        // Else loads the new optionsl
        } else {
            self.scope.oMap.setOptions(this.o.map_options);
        }

        // Apply styles
        count = 0;
        for (i in this.o.styles) {
            if (this.o.styles.hasOwnProperty(i)) {
                count++;
                this.scope.oMap.mapTypes.set(
                    'map_style_' + count,
                    new google.maps.StyledMapType(this.o.styles[i], {
                        name: i
                    })
                );
                this.scope.oMap.setMapTypeId('map_style_' + count);
            }
        }
    };

    // Add markers to the map
    Maplace.prototype.add_markers_to_objMap = function() {
        var a, point;
        var type = this.o.type || 'marker';

        // Switch how to display the locations
        switch (type) {
            case 'marker':
                for (a = 0; a < this.scope.calculatedLength; a++) {
                    point = this.create_objPoint(a);
                    this.create.marker.call(this, a, point);
                }
                break;
            default:
                this.create[type].apply(this);
                break;
        }
    };

    // Create the main object point
    Maplace.prototype.create_objPoint = function(index) {
        var point = $.extend({}, this.o.locations[index]);
        var visibility = point.visible === undefined ? undefined : point.visible;

        !point.type && (point.type = this.o.type);

        // Set obj map
        point.map = this.scope.oMap;
        point.position = new google.maps.LatLng(point.lat, point.lon);
        point.zIndex = point.zIndex === undefined ? 10000 : (point.zIndex + 100);
        point.visible = visibility === undefined  ? this.o.show_markers : visibility;

        this.o.maxZIndex = point.zIndex > this.scope.maxZIndex ? point.zIndex : this.scope.maxZIndex;

        if (point.image) {
            point.icon = new google.maps.MarkerImage(
                point.image,
                new google.maps.Size(point.image_w || 32, point.image_h || 32),
                new google.maps.Point(0, 0),
                new google.maps.Point((point.image_w || 32) / 2, (point.image_h || 32)  / 2)
            );
        }

        return point;
    };

    // Create the main object circle
    Maplace.prototype.create_objCircle = function(point) {
        var def_stroke_opz, def_circle_opz, circle;

        circle = $.extend({}, point);
        def_stroke_opz = $.extend({}, this.o.stroke_options);
        def_circle_opz = $.extend({}, this.o.circle_options);

        $.extend(def_stroke_opz, point.stroke_options || {});
        $.extend(circle, def_stroke_opz);

        $.extend(def_circle_opz, point.circle_options || {});
        $.extend(circle, def_circle_opz);

        circle.center = point.position;
        circle.draggable = false;
        circle.zIndex = point.zIndex > 0 ? point.zIndex - 10 : 1;

        return circle;
    };

    // Create the main object point
    Maplace.prototype.add_markerEv = function(index, point, marker) {
        var self = this;

        google.maps.event.addListener(marker, 'click', function(ev) {
            self.CloseInfoWindow();
            self.o.beforeShow.call(self, index, point, marker);

            // Show infoWindow?
            if (self.o.show_infoWindows && (point.show_infoWindow !== false)) {
                self.open_infoWindow(index, marker, ev);
            }

            // Pan and zoom the map
            if (self.o.pan_on_click && (point.pan_on_click !== false)) {
                self.scope.oMap.panTo(point.position);
                point.zoom && self.scope.oMap.setZoom(point.zoom);
            }

            // Activate related menu link
            if (self.scope.current_control && self.o.generate_controls
                && self.scope.current_control.activateCurrent) {
              self.scope.current_control.activateCurrent.call(self, index + 1);
            }

            // Update current location index
            self.scope.current_index = index;
            self.o.afterShow.call(self, index, point, marker);
        });

        if (point.draggable) {
            this.add_dragEv(index, point, marker);
        }
    };

    // Add events to circles objs
    Maplace.prototype.add_circleEv = function(index, circle, marker) {
        var self = this;

        google.maps.event.addListener(marker, 'click', function() {
            self.ViewOnMap(index + 1);
        });

        google.maps.event.addListener(marker, 'center_changed', function() {
            self.o.circleCenterChanged.call(self, index, circle, marker);
        });

        google.maps.event.addListener(marker, 'radius_changed', function() {
            self.o.circleRadiusChanged.call(self, index, circle, marker);
        });

        if (circle.draggable) {
            this.add_dragEv(index, circle, marker);
        }
    };

    // Add drag events
    Maplace.prototype.add_dragEv = function(index, obj, marker) {
        var self = this;

        google.maps.event.addListener(marker, 'drag', function(ev) {
            var pos, extraType;

            if (marker.getPosition) {
                pos = marker.getPosition();
            } else if (marker.getCenter) {
                pos = marker.getCenter();
            } else {
                return;
            }

            // Update circle position
            if (self.scope.circles[index]) {
              self.scope.circles[index].setCenter(pos);
            }

            // Update polygon or polyline if defined
            if (self.scope.Polyline) {
                extraType = 'Polyline';
            } else if (self.scope.Polygon) {
                extraType = 'Polygon';
            }

            if (extraType) {
                var path = self.scope[extraType].getPath();
                var pathArray = path.getArray();

                var arr = pathArray.map(function(path, i) {
                    return (index === i)
                        ? new google.maps.LatLng(pos.lat(), pos.lng())
                        : new google.maps.LatLng(path.lat(), path.lng());
                });

                self.scope[extraType].setPath(new google.maps.MVCArray(arr));
                self.add_polyEv(extraType);
            }

            // Fire drag event
            self.o.drag.call(self, index, obj, marker);
        });

        google.maps.event.addListener(marker, 'dragend', function() {
            self.o.dragEnd.call(self, index, obj, marker);
        });

        google.maps.event.addListener(marker, 'dragstart', function() {
            self.o.dragStart.call(self, index, obj, marker);
        });

        google.maps.event.addListener(marker, 'center_changed', function() {
            // Update marker position
            if (self.scope.markers[index] && marker.getCenter) {
                self.scope.markers[index].setPosition(marker.getCenter());
            }

            self.o.drag.call(self, index, obj, marker);
        });
    };

    // Add events to poly objs
    Maplace.prototype.add_polyEv = function(typeName) {
        var self = this;

        google.maps.event.addListener(this.scope[typeName].getPath(), 'set_at', function(index, obj) {
            self.trigger_polyEv(typeName, index, obj);
        });

        google.maps.event.addListener(this.scope[typeName].getPath(), 'insert_at', function(index, obj) {
            self.trigger_polyEv(typeName, index, obj);
        });
    };

    // Trigger events to poly objs
    Maplace.prototype.trigger_polyEv = function(typeName, index, obj) {
        var item = this.scope[typeName].getPath().getAt(index);
        var newPos = new google.maps.LatLng(item.lat(), item.lng());

        this.scope.markers[index] && this.scope.markers[index].setPosition(newPos);
        this.scope.circles[index] && this.scope.circles[index].setCenter(newPos);

        this.o['on' + typeName + 'Changed'](index, obj, this.scope[typeName].getPath().getArray());
    };

    // Wrapper for the map types
    Maplace.prototype.create = {
        // Single marker
        marker: function(index, point, marker) {
            // Allow mix circles with markers
            if (point.type === 'circle' && !marker) {
                var circle = this.create_objCircle(point);

                if (!point.visible) {
                    circle.draggable = point.draggable;
                }

                marker = new google.maps.Circle(circle);
                this.add_circleEv(index, circle, marker);

                // Store the new circle
                this.scope.circles[index] = marker;
            }

            point.type = 'marker';

            // Create the marker and add click event
            marker = new google.maps.Marker(point);
            this.add_markerEv(index, point, marker);

            // Extends bounds with this location
            this.scope.oBounds.extend(point.position);

            // Store the new marker
            this.scope.markers[index] = marker;

            this.o.afterCreateMarker.call(this, index, point, marker);

            return marker;
        },


        // Circle mode
        circle: function() {
            var self = this;
            this.o.locations.forEach(function(location, i) {
                var marker = null;
                var point = self.create_objPoint(i);
                // Allow mixing markers with circles
                if (point.type === 'circle') {
                    var circle = self.create_objCircle(point);
                    // If the marker is not visible
                    // then pass the draggable setting down to the circle
                    if (! point.visible) {
                        circle.draggable = point.draggable;
                    }
                    // Create the circle object and attached the events
                    marker = new google.maps.Circle(circle);
                    self.add_circleEv(i, circle, marker);
                    // Store the new circle
                    self.scope.circles[i] = marker;
                }
                // Create the marker
                point.type = 'marker';
                self.create.marker.call(self, i, point, marker);
            });
        },


        // Polyline mode
        polyline: function() {
            var a, point;
            var stroke = $.extend({}, this.o.stroke_options);

            stroke.path = [];
            stroke.draggable = this.o.draggable;
            stroke.editable = this.o.editable;
            stroke.map = this.scope.oMap;
            stroke.zIndex = this.o.maxZIndex + 100;

            // Create the path and location marker
            for (a = 0; a < this.scope.calculatedLength; a++) {
                point = this.create_objPoint(a);
                this.create.marker.call(this, a, point);

                stroke.path.push(point.position);
            }

            this.scope.Polyline
                ? this.scope.Polyline.setOptions(stroke)
                : this.scope.Polyline = new google.maps.Polyline(stroke);

            google.maps.event.addListener(this.scope.Polyline, 'click', function(obj) {
                self.o.onPolylineClick.call(self, obj);
            });

            this.add_polyEv('Polyline');
        },


        // Polygon mode
        polygon: function() {
            var a, point;
            var self = this;
            var stroke = $.extend({}, this.o.stroke_options);

            stroke.path = [];
            stroke.draggable = this.o.draggable;
            stroke.editable = this.o.editable;
            stroke.map = this.scope.oMap;
            stroke.zIndex = this.o.maxZIndex + 100;

            // Create the path and location marker
            for (a = 0; a < this.scope.calculatedLength; a++) {
                point = this.create_objPoint(a);
                this.create.marker.call(this, a, point);

                stroke.path.push(point.position);
            }

            this.scope.Polygon
                ? this.scope.Polygon.setOptions(stroke)
                : this.scope.Polygon = new google.maps.Polygon(stroke);

            google.maps.event.addListener(this.scope.Polygon, 'click', function(obj) {
                self.o.onPolygonClick.call(self, obj);
            });

            this.add_polyEv('Polygon');
        },


        // Fusion tables
        fusion: function() {
            this.o.fusion_options.styles = [this.o.stroke_options];
            this.o.fusion_options.map = this.scope.oMap;

            this.scope.Fusion ?
                this.scope.Fusion.setOptions(this.o.fusion_options)
                : this.scope.Fusion = new google.maps.FusionTablesLayer(this.o.fusion_options);
        },


        // Directions mode
        directions: function() {
            var a, point, stopover, origin, destination;
            var self = this;
            var waypoints = [];
            var distance = 0;

            // Create the waypoints and location marker
            for (a = 0; a < this.scope.calculatedLength; a++) {
                point = this.create_objPoint(a);

                // First location start point
                if (a === 0) {
                    origin = point.position;

                // Last location end point
                } else if (a === (this.scope.calculatedLength - 1)) {
                    destination = point.position;

                // Waypoints in the middle
                } else {
                    stopover = this.o.locations[a].stopover === true;
                    waypoints.push({
                        location: point.position,
                        stopover: stopover
                    });
                }

                this.create.marker.call(this, a, point);
            }

            this.o.directions_options.origin = origin;
            this.o.directions_options.destination = destination;
            this.o.directions_options.waypoints = waypoints;

            this.scope.directionsService || (this.scope.directionsService = new google.maps.DirectionsService());
            this.scope.directionsDisplay ?
                this.scope.directionsDisplay.setOptions({draggable: this.o.draggable})
                : this.scope.directionsDisplay = new google.maps.DirectionsRenderer({draggable: this.o.draggable});

            this.scope.directionsDisplay.setMap(this.scope.oMap);

            // Show the directions panel
            if (this.o.directions_panel) {
                this.o.directions_panel = $(this.o.directions_panel);
                this.scope.directionsDisplay.setPanel(this.o.directions_panel.get(0));
            }

            if (this.o.draggable) {
                google.maps.event.addListener(this.scope.directionsDisplay, 'directions_changed', function() {
                    var result = self.scope.directionsDisplay.getDirections();
                    distance = self.compute_distance(self.scope.directionsDisplay.directions);
                    self.o.afterRoute.call(self, distance, result.status, result);
                });
            }

            this.scope.directionsService.route(this.o.directions_options, function(result, status) {
                // Directions found
                if (status === google.maps.DirectionsStatus.OK) {
                    distance = self.compute_distance(result);
                    self.scope.directionsDisplay.setDirections(result);
                }
                self.o.afterRoute.call(self, distance, status, result);
            });
        }
    };

    // Route distance
    Maplace.prototype.compute_distance = function(result) {
        var i;
        var total = 0;
        var myroute = result.routes[0];
        var rlen = myroute.legs.length;

        for (i = 0; i < rlen; i++) {
            total += myroute.legs[i].distance.value;
        }

        return total;
    };

    // Wrapper for the infoWindow types
    Maplace.prototype.type_to_open = {
        // Google default infoWindow
        bubble: function(location) {
            var self = this;
            var infoWindow = { content: location.html || '' };

            if (location.infoWindowMaxWidth) {
                infoWindow.maxWidth = location.infoWindowMaxWidth;
            }

            this.scope.infoWindow = new google.maps.InfoWindow(infoWindow);
            google.maps.event.addListener(this.scope.infoWindow, 'closeclick', function(){
                self.CloseInfoWindow();
            });
        }
    };

    // Open the infoWindow
    Maplace.prototype.open_infoWindow = function(index, marker, ev) {
        var point = this.o.locations[index];
        var type = this.o.infoWindow_type;

        // Show if content and valid infoWindow type provided
        if (point.html && this.type_to_open[type]) {
            this.o.beforeOpenInfowindow.call(this, index, point, marker);
            this.type_to_open[type].call(this, point);
            this.scope.infoWindow.open(this.scope.oMap, marker);
            this.o.afterOpenInfowindow.call(this, index, point, marker);
        }
    };

    // Get the html for the menu
    Maplace.prototype.get_html_controls = function() {
        if (this.controls[this.o.controls_type] && this.controls[this.o.controls_type].getHtml) {
            this.scope.current_control = this.controls[this.o.controls_type];

            return this.scope.current_control.getHtml.apply(this);
        }
        return '';
    };

    // Create the controls menu
    Maplace.prototype.generate_controls = function() {
        // Append menu on the div container
        if (!this.o.controls_on_map) {
            this.scope.controls_wrapper.empty();
            this.scope.controls_wrapper.append(this.get_html_controls());
            return;
        }

        // Else add controls in map
        var cntr = $('<div class="on_gmap ' + this.o.controls_type + ' gmap_controls"></div>')
            .css(this.o.controls_applycss ? {margin: '5px'} : {}),

            inner = $(this.get_html_controls()).css(this.o.controls_applycss ? {
                background: '#fff',
                padding: '5px',
                border: '1px solid #eee',
                boxShadow: 'rgba(0, 0, 0, 0.298039) 0px 1px 4px -1px',
                maxHeight: this.scope.map_div.find('.canvas_map').outerHeight() - 80,
                minWidth: 100,
                overflowY: 'auto',
                overflowX: 'hidden'
            } : {});

        cntr.append(inner);

        // Attach controls
        this.scope.oMap.controls[this.o.controls_position].clear();
        this.scope.oMap.controls[this.o.controls_position].push(cntr.get(0));
    };

    // Reset obj map, markers, bounds, listeners, controllers
    Maplace.prototype.init_map = function() {
        var self = this;
        this.scope.Polyline && this.scope.Polyline.setMap(null);
        this.scope.Polygon && this.scope.Polygon.setMap(null);
        this.scope.Fusion && this.scope.Fusion.setMap(null);
        this.scope.directionsDisplay && this.scope.directionsDisplay.setMap(null);

        for (var i = this.scope.markers.length - 1; i >= 0; i -= 1) {
            try {
                this.scope.markers[i] && this.scope.markers[i].setMap(null);
            } catch (err) {
                self.debug('init_map::markers::setMap', err.stack);
            }
        }

        this.scope.markers.length = 0;
        this.scope.markers = [];

        for (var e = this.scope.circles.length - 1; e >= 0; e -= 1) {
            try {
                this.scope.circles[e] && this.scope.circles[e].setMap(null);
            } catch (err) {
                self.debug('init_map::circles::setMap', err.stack);
            }
        }

        this.scope.circles.length = 0;
        this.scope.circles = [];

        if (this.o.controls_on_map && this.scope.oMap.controls) {
            this.scope.oMap.controls[this.o.controls_position].forEach(function(element, index) {
                try {
                    self.scope.oMap.controls[self.o.controls_position].removeAt(index);
                } catch (err) {
                    self.debug('init_map::removeAt', err.stack);
                }
            });
        }

        this.scope.oBounds = new google.maps.LatLngBounds();
    };

    // Perform the first view of the map
    Maplace.prototype.perform_load = function() {
        this.CloseInfoWindow();

        // One location
        if (this.scope.calculatedLength === 1) {
            if (this.o.map_options.set_center) {
                this.scope.oMap.setCenter(new google.maps.LatLng(this.o.map_options.set_center[0], this.o.map_options.set_center[1]));

            } else {
                this.scope.oMap.fitBounds(this.scope.oBounds);
                this.ViewOnMap(1);
            }

            this.o.map_options.zoom && this.scope.oMap.setZoom(this.o.map_options.zoom);

        // No locations
        } else if (this.scope.calculatedLength === 0) {
            if (this.o.map_options.set_center) {
                this.scope.oMap.setCenter(new google.maps.LatLng(this.o.map_options.set_center[0], this.o.map_options.set_center[1]));

            } else {
                this.scope.oMap.fitBounds(this.scope.oBounds);
            }

            this.scope.oMap.setZoom(this.o.map_options.zoom || 1);

        // n+ locations
        } else {
            this.scope.oMap.fitBounds(this.scope.oBounds);

            // Check the start option
            if (typeof (this.o.start - 0) === 'number' && this.o.start > 0 && this.o.start <= this.scope.calculatedLength) {
                this.ViewOnMap(this.o.start);

            // Check if set_center exists
            } else if (this.o.map_options.set_center) {
                this.scope.oMap.setCenter(new google.maps.LatLng(this.o.map_options.set_center[0], this.o.map_options.set_center[1]));

            //view all
            } else {
                this.ViewOnMap(this.scope.view_all_key);
            }

            this.o.map_options.zoom && this.scope.oMap.setZoom(this.o.map_options.zoom);
        }
    };

    Maplace.prototype.debug = function(code, msg) {
        this.o.debug && console.log(code, msg);
        return this;
    };


    /////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////


    // Add a custom menu to the class
    Maplace.prototype.AddControl = function(name, func) {
        if (!name || !func) {
            self.debug('AddControl', 'Missing "name" and "func" callback.');
            return false;
        }
        this.controls[name] = func;
        return this;
    };

    // Close the infoWindow
    Maplace.prototype.CloseInfoWindow = function() {
        if (this.scope.infoWindow && (this.scope.current_index || this.scope.current_index === 0)) {
            this.o.beforeCloseInfowindow.call(
                this,
                this.scope.current_index,
                this.o.locations[this.scope.current_index]
            );

            this.scope.infoWindow.close();
            this.scope.infoWindow = null;

            this.o.afterCloseInfowindow.call(
                this,
                this.scope.current_index,
                this.o.locations[this.scope.current_index]
            );
        }
        return this;
    };

    // Check if a location has to be in menu
    Maplace.prototype.ShowOnMenu = function(index) {
        if (index === this.scope.view_all_key && this.o.view_all && this.scope.calculatedLength > 1) {
            return true;
        }

        index = parseInt(index, 10);
        if (typeof (index - 0) === 'number' && index >= 0 && index < this.scope.calculatedLength) {
            return this.o.locations[index].on_menu !== false;
        }

        return false;
    };

    // Trigger to show a location in the map
    Maplace.prototype.ViewOnMap = function(index) {
        // View all
        if (index === this.scope.view_all_key) {
            this.o.beforeViewAll.call(this);

            this.scope.current_index = index;
            if (this.o.locations.length > 0 && this.o.generate_controls
              && this.scope.current_control && this.scope.current_control.activateCurrent) {
                this.scope.current_control.activateCurrent.apply(this, [index]);
            }
            this.scope.oMap.fitBounds(this.scope.oBounds);

            this.o.afterViewAll.call(this);

        // Specific location
        } else {
            index = parseInt(index, 10);
            if (typeof (index - 0) === 'number' && index > 0 && index <= this.scope.calculatedLength) {
                try {
                    google.maps.event.trigger(this.scope.markers[index - 1], 'click');
                } catch (err) {
                    this.debug('ViewOnMap::trigger', err.stack);
                }
            }
        }
        return this;
    };

    // Replace current locations
    Maplace.prototype.SetLocations = function(locs, reload) {
        this.o.locations = locs;
        reload && this.Load();
        return this;
    };

    // Add one or more locations to the end of the array
    Maplace.prototype.AddLocations = function(locs, reload) {
        var self = this;

        if ($.isArray(locs)) {
            $.each(locs, function(index, value) {
                self.o.locations.push(value);
            });
        }

        if ($.isPlainObject(locs)) {
            this.o.locations.push(locs);
        }

        reload && this.Load();
        return this;
    };

    // Add a location at the specific index
    Maplace.prototype.AddLocation = function(location, index, reload) {
        if ($.isPlainObject(location)) {
            this.o.locations.splice(index, 0, location);
        }

        reload && this.Load();
        return this;
    };

    // Remove one or more locations
    Maplace.prototype.RemoveLocations = function(locs, reload) {
        var self = this;
        var k = 0;

        if ($.isArray(locs)) {
            $.each(locs, function(index, value) {
                if ((value - k) < self.scope.calculatedLength) {
                    self.o.locations.splice(value - k, 1);
                }
                k++;
            });
        } else {
            if (locs < this.scope.calculatedLength) {
                this.o.locations.splice(locs, 1);
            }
        }

        reload && this.Load();
        return this;
    };

    // Check if already initialized with a Load()
    Maplace.prototype.Loaded = function() {
        return this.scope.loaded;
    };

    /**
     * @TODO
     */
    // Freeze current zoom across multiple Load actions,
    // Including AddLocation, RemoveLocations, AddLocations, SetLocations
    Maplace.prototype.FreezeZoom = function() {
        this.scope.freeze_zoom = true;
    };

    /**
     * @TODO
     */
    // Un-freeze current zoom across multiple Load actions,
    // Including AddLocation, RemoveLocations, AddLocations, SetLocations
    Maplace.prototype.UnFreezeZoom = function() {
        this.scope.freeze_zoom = false;
    };

    // Loads the options
    Maplace.prototype._init = function() {
        // Store the locations length
        this.scope.calculatedLength = this.o.locations.length;

        // Update all locations with shared
        for (var i = 0; i < this.scope.calculatedLength; i++) {
            var common = $.extend({}, this.o.shared);
            this.o.locations[i] = $.extend(common, this.o.locations[i]);
            if (this.o.locations[i].html) {
                this.o.locations[i].html = this.o.locations[i].html.replace('%index', i + 1);
                this.o.locations[i].html = this.o.locations[i].html.replace('%title', (this.o.locations[i].title || ''));
            }
        }

        // Store dom references
        this.scope.map_div = $(this.o.map_div);
        this.scope.controls_wrapper = $(this.o.controls_div);
        return this;
    };

    // Create the map and menu
    Maplace.prototype.Load = function(args) {
        $.extend(true, this.o, args);
        args && args.locations && (this.o.locations = args.locations);

        this._init();

        // Reset/Init google map objects
        this.o.visualRefresh === false ? (google.maps.visualRefresh = false) : (google.maps.visualRefresh = true);
        this.init_map();
        this.create_objMap();

        // Add markers
        this.add_markers_to_objMap();

        // Generate controls
        if ((this.scope.calculatedLength > 1 && this.o.generate_controls) || this.o.force_generate_controls)  {
            this.o.generate_controls = true;
            this.generate_controls();
        } else {
            this.o.generate_controls = false;
        }

        var self = this;

        // First call !!!
        if (!this.scope.loaded) {
            google.maps.event.addListenerOnce(this.scope.oMap, 'idle', function() {
                self.perform_load();
            });

            // Add custom listeners
            for (var i in this.o.listeners) {
                if (this.o.listeners.hasOwnProperty(i)) {
                    google.maps.event.addListener(this.scope.oMap, i, this.o.listeners[i]);
                }
            }

        // Any other call
        } else {
            this.perform_load();
        }

        this.scope.loaded = true;

        return this;
    };

    return Maplace;
}));
