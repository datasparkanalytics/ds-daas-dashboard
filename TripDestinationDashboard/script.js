jQuery(document).ready(main)

var access_api_token;
var mymap = L.map('mapid').setView([1.320270, 103.851959], 11);
var assetLayerGroup;
var info = L.control();
var area_code_mapping;

var myStyle = {
    "color": "#FFFBE5",
    "weight": 1,
    "opacity": 0.1
};

// div to show hourly footfall
info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

info.update = function(footfall_array) {
    if (footfall_array) {
        var table = "<table id='results'><tr><th>Area Code</th><th>Footfall</th></tr>";
        var k = 0;
        for (j = 0; j < footfall_array.length; j++) {
            var arr = footfall_array[j].split("-")
            var area = area_code_mapping[arr[0]]
            if (area == null) {
                area = arr[0]
            }
            table = table + "<tr class='results'><td class='results'>" + area + "</td><td>" + arr[1] + "</td></tr>";
            if (j == 15) break;
        }
        table = table + "</table>";
        this._div.innerHTML = '<h3>Top 15 origins</h3><hr><p> Displaying unique count of people</p><p>' + table + '</p>';
    } else {
        this._div.innerHTML = '<h3>Top 15 origins</h3><hr><p> Select Filters and click on Submit</p>';
    }
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
    var distance = other_filters['distance'];
    var duration = other_filters['duration'];

    console.log("Date: " + date_selected);
    console.log("roi_level: " + roi_level);
    console.log("roi_value: " + roi_value);
    console.log("gender: " + gender);
    console.log("agent_nationality: " + agent_nationality);
    console.log("agent_race: " + agent_race);
    console.log("agent_age_group: " + agent_age_group);
    console.log("roi_group: " + roi_group);
    console.log("distance: " + distance);

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

    request_data["timeSeriesReference"] = "destination";
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
    if (distance != "") {
        filter = {};
        filter["type"] = "bound";
        filter["dimension"] = "distance";
        filter["lower"] = parseInt(distance);
        filter["ordering"] = "alphanumeric";
        all_filters[num_filters] = filter;
        num_filters++;
    }
    if (duration != "") {
        filter = {};
        filter["type"] = "bound";
        filter["dimension"] = "duration";
        filter["lower"] = parseInt(duration);
        filter["ordering"] = "alphanumeric";
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
    } else if (all_filters.length > 1) {
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

    $.getJSON('../conf/area_code_mapping.json', function(data) {
        area_code_mapping = data;
    });
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
                console.log("Got token" + access_api_token);
            });



    });

    L.tileLayer('https://mts0.google.com/vt/lyrs=m@289000001&hl=en&src=app&x={x}&y={y}&z={z}&s=Gal&apistyle=s.t%3A3|s.e%3Al|p.v%3Aoff', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 15
    }).addTo(mymap);

    assetLayerGroup = L.layerGroup().addTo(mymap);
    info.addTo(mymap);
}

function getGeoJsonURL(roi_group, roi_level) {
    var roi = roi_group;
    if (roi_group == "") {
        roi = roi_level;
    }
    part = roi.substring(7, roi.length);
    return "../conf/" + part + ".geojson";
}

function getROINameInGeoJSON(roi_group, roi_level) {
    var roi = roi_group;
    if (roi_group == "") {
        roi = roi_level;
    }
    switch (roi) {
        case 'origin_planningregion':
            return "REGION_N";
        case 'origin_planningarea':
            return "PLN_AREA_N";
        case 'origin_subzone':
            return "SUBZONE_N";
        case 'destination_planningregion':
            return "REGION_N";
        case 'destination_planningarea':
            return "PLN_AREA_N";
        case 'destination_subzone':
            return "SUBZONE_N";

    }
}

function getROIIdInGeoJSON(roi_group, roi_level) {
    var roi = roi_group;
    if (roi_group == "") {
        roi = roi_level;
    }
    switch (roi) {
        case 'origin_planningregion':
            return "REGION_C";
        case 'origin_planningarea':
            return "PLN_AREA_C";
        case 'origin_subzone':
            return "SUBZONE_C";
        case 'destination_planningregion':
            return "REGION_C";
        case 'destination_planningarea':
            return "PLN_AREA_C";
        case 'destination_subzone':
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

    d3.request("https://apistore.datasparkanalytics.com:8243/odmatrix/v3/query")
        .header("Authorization", "Bearer " + access_api_token)
        .header("Content-Type", "application/json")
        .post(JSON.stringify(request_data), function(data) {
            var resp = JSON.parse(data.response);
            // Create a look up map to store footfall
            footfall_array = [];
            footfall_map = [];
            for (var i = 0; i < resp.length; i++) {
                var key = resp[i].event[roi_group];
                footfall_array[i] = key + "-" + resp[i].event.footfall;
            }

            footfall_array.sort(function(a, b) {
                var a_val = a.split("-");
                var b_val = b.split("-");
                return b_val[1] - a_val[1]
            });

            var maxCount = 0;
            var minCount = 0;
            for (j = 0; j < footfall_array.length; j++) {
                var arr = footfall_array[j].split("-");
                var key = arr[0]
                var value = arr[1]
                footfall_map[key] = value;
                if (j == 0) minCount = value;
                if (j == 15) {
                    maxCount = value;
                    break;
                }
            }

            console.log(footfall_map)
            if (footfall_array.length == 0) {
                alert("No data for the Date or Filters selected!");
            }

            var color_pallete = d3.scaleLinear().range(["red", "green"]).domain([minCount, maxCount]);

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
                        if (footfall_map[feature.properties[roi_id]])
                            return {
                                color: color_pallete(footfall_map[feature.properties[roi_id]]),
                                "weight": 3,
                                "opacity": 0.8,
                                fillOpacity: 0.5
                            }
                        else return myStyle;
                    },
                    onEachFeature: onEachFeature
                }).addTo(assetLayerGroup);
            })
            info.update(footfall_array);
        });
}