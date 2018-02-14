jQuery(document).ready(main)

var access_api_token;
var mymap = L.map('mapid').setView([1.320270, 103.851959], 11);
var assetLayerGroup;

var myStyle = {
    "color": "#FFFBE5",
    "weight": 1,
    "opacity": 0.1
};

function myFunction() {
    // Read the form
    var date_selected_obj = $("#datepicker").datepicker("getDate");
    date_selected = $.datepicker.formatDate('yy-mm-dd', date_selected_obj);

    var roi_level_e = document.getElementById("mandatory_roi_level");
    var roi_level = roi_level_e.options[roi_level_e.selectedIndex].value;
    var gender_e = document.getElementById("gender");
    var gender = gender_e.options[gender_e.selectedIndex].value;
    var agent_race_e = document.getElementById("agent_race");
    var agent_race = agent_race_e.options[agent_race_e.selectedIndex].value;
    var agent_age_group_e = document.getElementById("agent_age_group");
    var agent_age_group = agent_age_group_e.options[agent_age_group_e.selectedIndex].value;
    var roi_group_e = document.getElementById("roi_group_by");
    var roi_group = roi_group_e.options[roi_group_e.selectedIndex].value;

    var elements = document.getElementById("myForm").elements;
    var other_filters = {};
    for (var i = 0; i < elements.length; i++) {
        var item = elements.item(i);
        other_filters[item.name] = item.value;
    }
    var roi_value = $('#roi_vals').val();
    var agent_nationality = other_filters['agent_nationality'];

    console.log("Date: " + date_selected);
    console.log("roi_level: " + roi_level);
    console.log("roi_value: " + roi_value);
    console.log("gender: " + gender);
    console.log("agent_nationality: " + agent_nationality);
    console.log("agent_race: " + agent_race);
    console.log("agent_age_group: " + agent_age_group);
    console.log("roi_group: " + roi_group);
    if (roi_value == "") {
        alert("ROI Value is a mandatory field");
        return false;
    }

    // Create the JSON Request
    var request_data = {}
    request_data["date"] = date_selected;
    location_data = {};
    location_data["locationType"] = "locationHierarchyLevel";
    location_data["levelType"] = roi_level;
    location_data["id"] = roi_value;
    request_data["location"] = location_data;
    queryGranularity = {};
    queryGranularity["type"] = "period";
    queryGranularity["period"] = "PT24H";
    request_data["queryGranularity"] = queryGranularity;
    if (roi_group != "") {
        dimensionFacets = [];
        dimensionFacets[0] = roi_group;
        request_data["dimensionFacets"] = dimensionFacets;
    }
    var num_filters = 0
    all_filters = [];

    if (gender != "") {
        filter = {};
        filter["type"] = "selector";
        filter["dimension"] = "agent_gender";
        filter["value"] = gender;
        //request_data["filter"] = filter;
        all_filters[num_filters] = filter;
        num_filters++;
    }
    if (agent_race != "") {
        filter = {};
        filter["type"] = "selector";
        filter["dimension"] = "agent_race";
        filter["value"] = agent_race;
        all_filters[num_filters] = filter;
        num_filters++;
    }
    if (agent_nationality != "") {
        filter = {};
        filter["type"] = "selector";
        filter["dimension"] = "agent_nationality";
        filter["value"] = agent_nationality;
        all_filters[num_filters] = filter;
        num_filters++;
    }
    if (agent_age_group != "") {
        filter = {};
        var cur_year = (new Date()).getFullYear();
        var age_group = agent_age_group.split("_")
        var upper_bound = cur_year - parseInt(age_group[0]);
        var lower_bound = ""
        if (age_group[1] != "plus") {
            lower_bound = cur_year - parseInt(age_group[1]);
        }
        filter["type"] = "bound";
        filter["dimension"] = "agent_year_of_birth";
        if (lower_bound != "") {
            filter["lower"] = lower_bound;
        }
        filter["upper"] = upper_bound;
        filter["ordering"] = "alphanumeric"
        all_filters[num_filters] = filter;
        num_filters++;
    }

    if (all_filters.length == 1) {
        request_data["filter"] = all_filters[0];
    } else if (all_filters.length > 1){
        filter = {};
        filter["type"] = "and";
        filter["fields"] = all_filters;
        request_data["filter"] = all_filters[0];
        request_data["filter"] = filter;
    }

    aggregations = [];
    metric_unique = {};
    metric_unique["metric"] = "unique_agents";
    metric_unique["type"] = "hyperUnique";
    metric_unique["describedAs"] = "footfall";
    aggregations[0] = metric_unique;
    request_data["aggregations"] = aggregations;

    console.log("Request_data: " + JSON.stringify(request_data));
    render(request_data, roi_group, roi_level);
}

function main() {

    $(function() {
        $("#datepicker").datepicker();
    });

    d3.json("../conf/footfall_dashboard.properties", function(data) {
        var auth_string = data.consumer_key + ":" + data.consumer_secret;
        var auth_string_encoded = btoa(auth_string);
        var token_end_point = data.token_end_point;
        var username = data.username;
        var password = data.password;
        var data_auth = "grant_type=password&username=" + username + "&password=" + password;

        // Obtain the access token
        d3.request(token_end_point)
            .header("Authorization", "Basic " + auth_string_encoded)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .post(data_auth, function(data) {
                var resp = JSON.parse(data.response);
                access_api_token = resp.access_token;
                //console.log("Got token" + access_api_token);
            });



    });

    L.tileLayer('https://mts0.google.com/vt/lyrs=m@289000001&hl=en&src=app&x={x}&y={y}&z={z}&s=Gal&apistyle=s.t%3A3|s.e%3Al|p.v%3Aoff', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 15
    }).addTo(mymap);

    assetLayerGroup = L.layerGroup().addTo(mymap);
}

function getGeoJsonURL(roi_group, roi_level) {
    var roi = roi_group;
    if (roi_group == "") {
        roi = roi_level;
    }
    part = roi.substring(15, roi.length);
    return "../conf/" + part + ".geojson";
}

function getROINameInGeoJSON(roi_group, roi_level) {
    var roi = roi_group;
    if (roi_group == "") {
        roi = roi_level;
    }
    switch (roi) {
        case 'discrete_visit_planningregion':
            return "REGION_N";
        case 'discrete_visit_planningarea':
            return "PLN_AREA_N";
        case 'discrete_visit_subzone':
            return "SUBZONE_N";
    }
}

function getROIIdInGeoJSON(roi_group, roi_level) {
    var roi = roi_group;
    if (roi_group == "") {
        roi = roi_level;
    }
    switch (roi) {
        case 'discrete_visit_planningregion':
            return "REGION_C";
        case 'discrete_visit_planningarea':
            return "PLN_AREA_C";
        case 'discrete_visit_subzone':
            return "SUBZONE_C";
    }
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
}

function render(request_data, roi_group, roi_level) {
    // Clear old layers
    assetLayerGroup.clearLayers();
    var geoJsonUrl = getGeoJsonURL(roi_group, roi_level);
    var roi_id = getROIIdInGeoJSON(roi_group, roi_level);
    var roi_name = getROINameInGeoJSON(roi_group, roi_level);

    d3.request("https://apistore.datasparkanalytics.com:8243/discretevisit/v2/query")
        .header("Authorization", "Bearer " + access_api_token)
        .header("Content-Type", "application/json")
        .post(JSON.stringify(request_data), function(data) {
            var resp = JSON.parse(data.response);
            // Create a look up map to store footfall
            footfall_map = [];
            for (var i = 0; i < resp.length; i++) {
                var key = resp[i].event[roi_group];
                footfall_map[key] = resp[i].event.footfall;
            }
            if(resp.length==0){
                alert("No data for the Date or Filters selected!")
            }
            //console.log(footfall_map)
            var maxCount = d3.max(d3.values(footfall_map));
            var minCount = d3.min(d3.values(footfall_map));

            var color_pallete = d3.scaleLinear().range(["green", "red"]).domain([minCount, maxCount]);

            function onEachFeature(feature, layer) {
                if (feature.properties && footfall_map[feature.properties[roi_id]]) {
                    layer.bindPopup(feature.properties[roi_name] + " ( " + feature.properties[roi_id] + " ) : " + footfall_map[feature.properties[roi_id]]);
                } else {
                    layer.bindPopup(feature.properties[roi_name] + " ( " + feature.properties[roi_id] + " ) ");
                }
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight
                });

            }

            d3.json(geoJsonUrl, function(collection) {
                geojson = L.geoJSON(collection, {
                    style: function(feature) {
                        //console.log(feature);
                        if (footfall_map[feature.properties[roi_id]])
                            return {
                                color: color_pallete(footfall_map[feature.properties[roi_id]]),
                                "weight": 2,
                                "opacity": 0.8,
                                fillOpacity: 0.5
                            }
                        else return myStyle;
                    },
                    onEachFeature: onEachFeature
                }).addTo(assetLayerGroup);
            })
        });
}