<?php
header('Content-Type: application/json');

$t = $_GET['type'];

switch($t) {
	case 4:
		echo '{"title":"Group E","type":"circle","locations":[{"lat":52.1,"lon":11.3,"title":"Title A2","html":"<h3>Content A2</h3><p>Lorem Ipsum..</p>","zoom":8,"circle_options":{"radius":30000}}]}';
		break;
	case 3:
		echo '{"title":"Group D","type":"polygon","locations":[{"lat":52.1,"lon":11.3,"title":"Title A2","html":"<h3>Content A2</h3><p>Lorem Ipsum..</p>","zoom":8},{"lat":51.2,"lon":22.2,"title":"Title B2","html":"<h3>Content B2</h3><p>Lorem Ipsum..</p>","zoom":8},{"lat":49.4,"lon":35.9,"title":"Title C2","html":"<h3>Content C2</h3><p>Lorem Ipsum..</p>","zoom":4},{"lat":47.8,"lon":15.6,"title":"Title D2","html":"<h3>Content D2</h3><p>Lorem Ipsum..</p>","zoom":6}]}';
		break;
	case 2:
		echo '{"title":"Group C","type":"directions","locations":[{"lat":45.9,"lon":10.9,"title":"Title A1","html":"<h3>Content A1</h3>","icon":"http://maps.google.com/mapfiles/markerA.png"},{"lat":44.8,"lon":1.7,"title":"Title B1","html":"<h3>Content B1</h3>","icon":"http://maps.google.com/mapfiles/markerB.png","show_infowindow":false},{"lat":51.5,"lon":-1.1,"title":"Title C1","html":"<h3>Content C1</h3><p>Lorem Ipsum..</p>","zoom":8,"icon":"http://maps.google.com/mapfiles/markerC.png"}]}'; 
		break;
	case 1:
		echo '{"title":"Group B","type":"marker","locations":[{"lat":52.1,"lon":11.3,"title":"Title A2","html":"<h3>Content A2</h3><p>Lorem Ipsum..</p>","zoom":8},{"lat":51.2,"lon":22.2,"title":"Title B2","html":"<h3>Content B2</h3><p>Lorem Ipsum..</p>","zoom":8},{"lat":49.4,"lon":35.9,"title":"Title C2","html":"<h3>Content C2</h3><p>Lorem Ipsum..</p>","zoom":4},{"lat":47.8,"lon":15.6,"title":"Title D2","html":"<h3>Content D2</h3><p>Lorem Ipsum..</p>","zoom":6}]}';
		break;
	case 0:
	default:
		echo '{"title":"Group A","type":"marker","locations":[{"lat":45.9,"lon":10.9,"title":"Title A1","html":"<h3>Content A1</h3>","icon":"http://maps.google.com/mapfiles/markerA.png"},{"lat":44.8,"lon":1.7,"title":"Title B1","html":"<h3>Content B1</h3>","icon":"http://maps.google.com/mapfiles/markerB.png","show_infowindow":false},{"lat":51.5,"lon":-1.1,"title":"Title C1","html":"<h3>Content C1</h3><p>Lorem Ipsum..</p>","zoom":8,"icon":"http://maps.google.com/mapfiles/markerC.png"}]}'; 
		break;
}
