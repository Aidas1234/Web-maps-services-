var map = new maplibregl.Map({
  container: "map",
  maxZoom: 19,
  minZoom: 7,
  style: "map_styles/apzvalginis.openmap.style.json",
  center: [23.165, 55.221],
  zoom: 7,
  hash: true,
  antialias: true
});



const geocoderApi = {
  forwardGeocode: async (config) => {
      const features = [];
      try {
          const request =
      `https://nominatim.openstreetmap.org/search?q=${
          config.query
      }&format=geojson&polygon_geojson=1&addressdetails=1`;
          const response = await fetch(request);
          const geojson = await response.json();
          for (const feature of geojson.features) {
              const center = [
                  feature.bbox[0] +
              (feature.bbox[2] - feature.bbox[0]) / 2,
                  feature.bbox[1] +
              (feature.bbox[3] - feature.bbox[1]) / 2
              ];
              const point = {
                  type: 'Feature',
                  geometry: {
                      type: 'Point',
                      coordinates: center
                  },
                  place_name: feature.properties.display_name,
                  properties: feature.properties,
                  text: feature.properties.display_name,
                  place_type: ['place'],
                  center
              };
              features.push(point);
          }
      } catch (e) {
          console.error(`Failed to forwardGeocode with error: ${e}`);
      }

      return {
          features
      };
  }
};
map.addControl(
  new MaplibreGeocoder(geocoderApi, {
      maplibregl
  })
);



/*map.addControl(new maplibregl.NavigationControl());*/


let nav = new maplibregl.NavigationControl();
map.addControl(nav, 'top-right');

let scale = new maplibregl.ScaleControl({
  maxWidth: 80,
  unit: 'imperial'
});
map.addControl(scale, 'bottom-right');
scale.setUnit('metric');

map.addControl(new maplibregl.FullscreenControl({container: document.querySelector('body')}));


map.addControl(new maplibregl.GeolocateControl({
  positionOptions: {
      enableHighAccuracy: true
  },
  trackUserLocation: true
}));

MapboxDraw.constants.classes.CONTROL_BASE  = 'maplibregl-ctrl';
MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-';
MapboxDraw.constants.classes.CONTROL_GROUP = 'maplibregl-ctrl-group';

const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
      polygon: true,
      trash: true
  }
});
map.addControl(draw);

map.on('draw.create', updateArea);
map.on('draw.delete', updateArea);
map.on('draw.update', updateArea);

function updateArea(e) {
  const data = draw.getAll();
  const answer = document.getElementById('calculated-area');
  if (data.features.length > 0) {
      const area = turf.area(data);
      // restrict to area to 2 decimal points
      const roundedArea = Math.round(area * 100) / 100;
      answer.innerHTML =
          `<p><strong>${
              roundedArea
          }</strong><a><Strong> m<sup>2</sup></Strong></a></p>`;
  } else {
      answer.innerHTML = '';
      if (e.type !== 'draw.delete')
          alert('Naudok plotų braižymo įrankį!');
  }
}


function changeMapStyle(styleType) {
  removeLayer();
 
  
  map.setStyle("map_styles/" + styleType + ".openmap.style.json");

  /*
    Šioje vietoje turėtų būti naudojamas MapLibre GL įvykis style.load
    Kol kas realizuojama su timeout, nes įvykis nesuveikia, aprašytas bug'as repozitorijoje
  */
  setTimeout(() => {
    loadLayers();
  }, "1000");
  
}

map.on("load", () => {
  
  loadLayers();
});

function toggleLayer(layerName) {
  const layerNameHtml = "layer-btn-" + layerName;

  if (map.getLayoutProperty(layerName, "visibility") == "none") {
    map.setLayoutProperty(layerName, "visibility", "visible");
  } else {
    map.setLayoutProperty(layerName, "visibility", "none");

  }
}


function loadLayers() {
  map.setPaintProperty('background', 'background-color', '#E6E6E6');
  console.log("Loading layers");
 

  map.addSource("miskai-source", {
    type: "raster",
    tiles: [
      "http://127.0.0.1:8010/ogc/demo_miskai?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=Miskai",
    ],
    tileSize: 256,
  });
  map.addLayer({
    id: "id-miskai",
    type: "raster",
    source: "miskai-source",
    layout: {
      visibility: "none",
    },

    
  });
  

  map.addSource("keliai-source", {
    type: "raster",
    tiles: [
      "http://127.0.0.1:8010/ogc/demo_keliai?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=Keliai",
    ],
    tileSize: 256,
  });
  map.addLayer({
    id: "id-keliai",
    type: "raster",
    source: "keliai-source",
    layout: {
      visibility: "none",
    },
    paint: {},
  });

  
  map.addSource("vietovardziai-source", {
    type: "raster",
    tiles: [
      "http://127.0.0.1:8010/ogc/demo_vietovardziai?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=Vietovardziai",
    ],
    tileSize: 256,
  });
  map.addLayer({
    id: "id-vietovardziai",
    type: "raster",
    source: "vietovardziai-source",
    layout: {
      visibility: "none",
    },
    paint: {},
  });
  
}

function removeLayer() {
  /*
  
    Apsvarstykite, kas būtų, jeigu mūsų žemėlapyje būtų 30 sluoksnių. 
    Pagalvokite apie šios vietos išskaidymą į funkciją(-as).
    
    Kaip tą spręstumėte? 

  */

  console.log("Removing layers");
  map.removeLayer("id-vietovardziai");
  map.removeLayer("id-keliai");
  map.removeLayer("id-miskai");
  var checkbox = document.getElementById('vietovardziai');
    checkbox.checked = false;
  var checkbox = document.getElementById('keliai');
    checkbox.checked = false;
  var checkbox = document.getElementById('miskai');
    checkbox.checked = false;


  map.removeSource("vietovardziai-source");
  map.removeSource("keliai-source");
  map.removeSource("miskai-source");
}

