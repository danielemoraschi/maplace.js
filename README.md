# Maplace.js 
Helps you to embed Google Maps into your website, quickly create markers and controls menu for the locations on map.

## Demo
See **[demo website](http://maplacejs.com/)**

## Setup
Download the latest version of Maplace.js and include the Google Maps API v3 along with jQuery.

### JS
```javascript
new Maplace({
	locations: data,
	controls_type: 'list',
	controls_on_map: false
}).Load();
```

### HTML
```html
<div id="controls"></div>
<div id="gmap"></div>
```

### Locations Array
```javascript
var data = [{
	    lat: 45.9,
	    lon: 10.9,
	    title: 'Title A1',
	    html: '<h3>Content A1</h3>',
	    zoom: 8,
	    icon: 'http://www.google.com/mapfiles/markerA.png'
	},{
	    lat: 44.8,
	    lon: 1.7,
	    title: 'Title B1',
	    html: '<h3>Content B1</h3>',
	    show_infowindow: false
	}
];
```

## Options
<table>
	<thead>
	  <tr>
	    <th>Option</th>
	    <th>Type</th>
	    <th width="200" style="width:200px">Default</th>
	    <th>Description</th>
	  </tr>
	</thead>
	<tbody>
	  <tr>
	    <td>map_div</td>
	    <td>string</td>
	    <td>#gmap</td>
	    <td>
	      Where you want to show the Map
	    </td>
	  </tr>
	  <tr>
	    <td>controls_div</td>
	    <td>string</td>
	    <td>#controls</td>
	    <td>
	      Where you want to show the menu.
	      <strong>generate_controls</strong> must be <strong>true</strong>
	      <strong>controls_on_map</strong> must be <strong>false</strong>
	      At least more than one location on map
	    </td>
	  </tr>
	  <tr>
	    <td>generate_controls</td>
	    <td>boolean</td>
	    <td>true</td>
	    <td>
	      If <strong>false</strong>, the menu will not generated
	    </td>
	  </tr>
	  <tr>
	    <td>controls_type</td>
	    <td>string</td>
	    <td>dropdown</td>
	    <td>
	      To set the menu type choose between: <strong>dropdown</strong> | <strong>list</strong>
	    </td>
	  </tr>
	  <tr>
	    <td>controls_on_map</td>
	    <td>boolean</td>
	    <td>true</td>
	    <td>
	      If <strong><em>false</em></strong>, the menu will be generated into the element defined by the property <strong>controls_div</strong>
	    </td>
	  </tr>
	  <tr>
	    <td>controls_title</td>
	    <td>string</td>
	    <td></td>
	    <td>
	      Add a title/header text to the menu
	    </td>
	  </tr>
	  <tr>
	    <td>controls_cssclass</td>
	    <td>string</td>
	    <td></td>
	    <td>
	      Add a custom class to the menu element
	    </td>
	  </tr>
	  <tr>
	    <td>controls_applycss</td>
	    <td>boolean</td>
	    <td>true</td>
	    <td>
	      If <strong><em>false</em></strong>, default styles to the menu will not be applied
	    </td>
	  </tr>
      <tr>
        <td>controls_position</td>
        <td>string</td>
        <td>'RIGHT_TOP'</td>
        <td>
          Controls position on the right, below top-right elements of the map.
        </td>
      </tr>
	  <tr>
	    <td>type</td>
	    <td>string</td>
	    <td>marker</td>
	    <td>
	      To set the Map type choose between: <strong>marker</strong> | <strong>polyline</strong> | <strong>polygon</strong> | <strong>directions</strong> | <strong>fusion</strong>
	    </td>
	  </tr>
	  <tr>
	    <td>view_all</td>
	    <td>boolean</td>
	    <td>true</td>
	    <td>
	      If <strong><em>false</em></strong> the link "view all" will not be created
	    </td>
	  </tr>
	  <tr>
	    <td>view_all_text</td>
	    <td>string</td>
	    <td>View All</td>
	    <td>
	      Set a custom text for the link "view all"
	    </td>
	  </tr>
	  <tr>
	    <td>start</td>
	    <td>integer</td>
	    <td>0</td>
	    <td>
	      Set the first location to show, <strong><em>0</em></strong> stands for "view all"
	    </td>
	  </tr>
	  <tr>
	    <td>locations</td>
	    <td>Array [locations]</td>
	    <td>[]</td>
	    <td>
	      List of locations being marked on the map
	    </td>
	  </tr>
	  <tr>
	    <td>commons</td>
	    <td>object</td>
	    <td>{}</td>
	    <td>
	      Overwrite every location with a set of common properties
	    </td>
	  </tr>
	  <tr>
	    <td>show_markers</td>
	    <td>boolean</td>
	    <td>true</td>
	    <td>
	      If <strong><em>false</em></strong>, markers will not be visible on the map
	    </td>
	  </tr>
	  <tr>
	    <td>show_infowindows</td>
	    <td>boolean</td>
	    <td>true</td>
	    <td>
	      If <strong><em>false</em></strong>, infowindows will not be created
	    </td>
	  </tr>
	  <tr>
	    <td>infowindow_type</td>
	    <td>string</td>
	    <td>bubble</td>
	    <td>
	      Only <strong>bubble</strong> is supported
	    </td>
	  </tr>
	  <tr>
	    <td>map_options</td>
	    <td>Object</td>
	    <td> 
	    <code>
		{<br/>
			mapTypeId: google.maps.MapTypeId.ROADMAP, //or roadmap<br/>
			zoom: 1<br/>
		}
		</code>
		</td> 	
	    <td>
	      Map options object, as defined by <a href="https://developers.google.com/maps/documentation/javascript/reference#MapOptions" target="_blank">Google</a>.<br/>
	      The property <strong>center</strong> will be ignored. Check at the Install page to see how to center the map with only one location
	    </td>
	  </tr>
      <tr>
        <td>styles</td>
        <td>Object</td>
        <td>{}</td>
        <td>
          Style options as defined by <a href="https://developers.google.com/maps/documentation/javascript/styling#stylers" target="_blank">Google</a>
        </td>
      </tr>
	  <tr>
	    <td>stroke_options</td>
	    <td>Object</td>
	    <td> 
		<code>
		{<br/>
		strokeColor: '#0000FF',<br/>
		strokeOpacity: 0.8,<br/>
		strokeWeight: 2,<br/>
		fillColor: '#0000FF',<br/>
		fillOpacity: 0.4<br/>
		}
		</code>
	    </td>
	    <td>
	      Stroke options object, as defined by <a href="https://developers.google.com/maps/documentation/javascript/reference#PolylineOptions" target="_blank">Google</a>.<br/>
	      Used in Polyline/Polygon/Directions/Fusion Map type.
	    </td>
	  </tr>
	  <tr>
	    <td>directions_options</td>
	    <td>Object</td>
	    <td> 
		<code>
		{<br/>
		travelMode: 'DRIVING',<br/>
		unitSystem: 'METRIC',<br/>
		optimizeWaypoints: false,<br/>
		provideRouteAlternatives: false,<br/>
		avoidHighways: false,<br/>
		avoidTolls: false<br/>
		}
		</code>
	    </td>
	    <td>
	      Direction options object, as defined by <a href="https://developers.google.com/maps/documentation/javascript/reference#DirectionsRequest" target="_blank">Google</a>
	    </td>
	  </tr>
	  <tr>
	    <td>directions_panel</td>
	    <td>string</td>
	    <td>null</td>
	    <td>
	      ID or class of the div in which to display the directions steps.
	    </td>
	  </tr>
      <tr>
        <td>fusion_options</td>
        <td>Object</td>
        <td>{}</td>
        <td>
          Fusion tables options as defined by <a href="https://developers.google.com/maps/documentation/javascript/reference#FusionTablesLayerOptions" target="_blank">Google</a>
        </td>
      </tr>
	  <tr>
	    <td>draggable</td>
	    <td>boolean</td>
	    <td>false</td>
	    <td>
	      If <strong>true</strong>, allows the user to drag and modify the <strong>route</strong>, the <strong>polyline</strong> or the <strong>polygon</strong>
	    </td>
	  </tr>
	  <tr>
		<td>listeners</td>
		<td>Object</td>
		<td>{}</td>
		<td>Example:<br/>
		<code>
		listeners: {<br/>
			click: function(map, event) {<br/>
				map.setOptions({scrollwheel: true});<br/>
    		}<br/>
		}<br/>
		</code>
		Docs: <a href="https://developers.google.com/maps/documentation/javascript/events#UIEvents" target="_blank">Google maps Events</a>
		</td>
	  </tr>
	</tbody>
</table>

## Methods
<table>
	<thead>
	  <tr>
	    <th>Function</th>
	    <th>Params</th>
	    <th>Return</th>
	    <th>Description</th>
	  </tr>
	</thead>
	<tbody>
	  <tr>
	    <td>AddControl</td>
	    <td>string [name], function</td>
	    <td></td>
	    <td>Add you own menu type to the map</td>
	  </tr>
	  <tr>
	    <td>CloseInfoWindow</td>
	    <td></td>
	    <td></td>
	    <td>Close the current infowindow</td>
	  </tr>
	  <tr>
	    <td>ShowOnMenu</td>
	    <td>integer [index]</td>
	    <td>boolean</td>
	    <td>Checks if a location has to be shown on menu</td>
	  </tr>
	  <tr>
	    <td>ViewOnMap</td>
	    <td>integer [index]</td>
	    <td></td>
	    <td>Triggers to show a location on map</td>
	  </tr>
	  <tr>
	    <td>SetLocations</td>
	    <td>array [locations], boolean [reload]</td>
	    <td></td>
	    <td>Replace the current locations</td>
	  </tr>
	  <tr>
	    <td>AddLocations</td>
	    <td>array [locations] | object [location], boolean [reload]</td>
	    <td></td>
	    <td>Adds one or many locations</td>
	  </tr>
      <tr>
        <td>AddLocation</td>
        <td>object [location], integer [index], boolean [reload]</td>
        <td></td>
        <td>Adds one location at the specific index</td>
      </tr>
	  <tr>
	    <td>RemoveLocations</td>
	    <td>array [indexes] | integer [index], boolean [reload]</td>
	    <td></td>
	    <td>Delete one or many locations</td>
	  </tr>
	  <tr>
	    <td>Load</td>
	    <td>null | boolean | object [options]</td>
	    <td></td>
	    <td>Loads, updates the current options or force to reload the current options and construct the map</td>
	  </tr>
	  <tr>
        <td>Loaded</td>
        <td></td>
        <td></td>
        <td>Checks if a Load() was already been called<br/></td>
      </tr>
	</tbody>
</table>


## Events
<table>
	<thead>
	  <tr>
	    <th>Option</th>
	    <th>Type</th>
	    <th>Default</th>
	    <th>Description</th>
	  </tr>
	</thead>
	<tbody>
	  <tr>
	    <td>beforeViewAll</td>
	    <td>function</td>
	    <td></td>
	    <td>
	      Fires before showing all the locations
	    </td>
	  </tr>
	  <tr>
	    <td>afterViewAll</td>
	    <td>function</td>
	    <td></td>
	    <td>
	      Fires after showing all the locations
	    </td>
	  </tr>
	  <tr>
	    <td>beforeShow</td>
	    <td>function</td>
	    <td>(index, location, marker){}</td>
	    <td>
	      Fires before showing the current triggered location
	    </td>
	  </tr>
	  <tr>
	    <td>afterShow</td>
	    <td>function</td>
	    <td>(index, location, marker){}</td>
	    <td>
	      Fires after showing the current triggered location
	    </td>
	  </tr>
	  <tr>
	    <td>afterCreateMarker</td>
	    <td>function</td>
	    <td>(index, location, marker){}</td>
	    <td>
	      Fires after a marker creation
	    </td>
	  </tr>
	  <tr>
	    <td>beforeCloseInfowindow</td>
	    <td>function</td>
	    <td>(index, location){}</td>
	    <td>
	      Fires before closing the infowindow
	    </td>
	  </tr>
	  <tr>
	    <td>afterCloseInfowindow</td>
	    <td>function</td>
	    <td>(index, location){}</td>
	    <td>
	      Function called after closing the infowindow
	    </td>
	  </tr>
	  <tr>
	    <td>beforeOpenInfowindow</td>
	    <td>function</td>
	    <td>(index, location, marker){}</td>
	    <td>
	      Fires before opening the infowindow
	    </td>
	  </tr>
	  <tr>
	    <td>afterOpenInfowindow</td>
	    <td>function</td>
	    <td>(index, location, marker){}</td>
	    <td>
	      Fires after opening the infowindow
	    </td>
	  </tr>
	  <tr>
	    <td>afterRoute</td>
	    <td>function</td>
	    <td>(distance, status, result){}</td>
	    <td>
	      Fires after the route calcoule
	    </td>
	  </tr>
	  <tr>
	    <td>onPolylineClick</td>
	    <td>function</td>
	    <td>(obj) {}</td>
	    <td>
	      Fires when click on polylines
	    </td>
	  </tr>
	  <tr>
      <td>circleRadiusChanged</td>
          <td>function</td>
          <td>(index, location, marker){}</td>
          <td>
              This event is fired when the circle's radius is changed.
          </td>
      </tr>
      <tr>
          <td>circleCenterChanged</td>
          <td>function</td>
          <td>(index, location, marker){}</td>
          <td>
              This event is fired when the circle's center is changed.
          </td>
      </tr>
      <tr>
          <td>drag</td>
          <td>function</td>
          <td>(index, location, marker){}</td>
          <td>
              This event is fired while a marker is dragged.
          </td>
      </tr>
      <tr>
          <td>dragEnd</td>
          <td>function</td>
          <td>(index, location, marker){}</td>
          <td>
              This event is fired when the drag event ends.
          </td>
      </tr>
      <tr>
          <td>dragStart</td>
          <td>function</td>
          <td>(index, location, marker){}</td>
          <td>
              This event is fired when the drag event starts.
          </td>
      </tr>
	  
	</tbody>
</table>

## Requirements
Maplace.js requires jQuery and Google Maps Library v3.

## Source code
All efforts have been made to keep the source as clean and readable as possible.<br/>
Maplace.js is released under an MIT License.

## Changelog

**v0.1.3**
- Added circles support allowing mixed markers/circles
- Removed 'hide_marker' option for consistency with "visible"
- Added support to set the initial center position and zoom of the Map
- Improved editable polyline and polygon when visible markers
- Added drag events between markers, circles, polyline and polygon
- Return "this" for public functions to allow method chaining
- Renamed property 'commons' to 'shared' now overridden by location specific options
- Added external reference to <a target="_blank" href="http://snazzymaps.com/">Snazzy Maps</a> website for Google Map styling
- Changed debug strategy
- General fixes and enhancements

**v0.1.2**
- General fixes and enhancements

**v0.1.0**
- Initial release

