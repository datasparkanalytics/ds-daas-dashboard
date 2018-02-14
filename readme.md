# Dataspark Daas Dashboard

## Prerequisite
The application needs a http-server to host the geoJson and properties files.
You can use python http-server or nginx

## Instructions
1. Open conf/footfall_dashboard.properties and update your username, password, consumer_key and consumer_secret.

2. start the python http-server in the base folder.

3. There are three dashboards:   
**3.1 Footfall Dashboard:** Shows the footfall in different areas of Singapore based on selected date and filters
URL: http://<host>:<port>/FootfallDashboard/  
**3.2 Footfall Animation:** Shows the animation of houraly footfall in different areas of Singapore based on selected date and filters
URL: http://<host>:<port>/FootfallAnimation/  
**3.3 Trip Destination Dashboard:** Shows the Top origins for a particular destination
URL: http://<host>:<port>/TripDestinationDashboard/
