import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const map = new maplibregl.Map({
  container: "map",
  style:
    "https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL", // style URL
  center: [-76.132, 36.413],
  zoom: 7
});

let origin = map.getCenter().toArray();

// Washington DC
const destination = [-77.032, 38.913];

const route = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [origin],
      },
    },
  ],
};

const fullRoute = {
  type: "Feature",
  geometry: {
      type: "LineString",
      coordinates: [origin, destination]
  }
};

const lineDistance = turf.lineDistance(fullRoute, "kilometers");

const steps = 100;
const incrementDistance = lineDistance / steps;
let counter = 0;

const arrow = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: origin,
      },
    },
  ],
};

map.on("load", () => {
  map.addSource("route", {
    type: "geojson",
    data: route,
  });

  map.addSource("arrow", {
    type: "geojson",
    data: arrow,
  });

  map.addLayer({
    id: "route",
    source: "route",
    type: "line",
    paint: {
      "line-width": 2,
      "line-color": "black",
    },
  });

  // 화살표 아이콘을 추가하는 symbol 레이어
  map.addLayer({
    id: "arrow",
    source: "arrow",
    type: "symbol",
    layout: {
      "icon-image": "airport_15",
      "icon-size": 1.2,
      "icon-rotate": ["get", "bearing"],
      "icon-rotation-alignment": "map",
      "icon-anchor": "center",
    }
  });

  let animationFrameId = null; // 현재 실행 중인 requestAnimationFrame ID

  function animate() {
    // 현재 counter에 따른 경로의 새로운 지점 계산
    let currentSegment = turf.along(fullRoute, incrementDistance * counter,  "kilometers");
    let newCoordinates = currentSegment.geometry.coordinates;

    // 현재 위치가 지도 경계 내에 있는지 확인
    const bounds = map.getBounds();
    const isWithinBounds = bounds.contains(newCoordinates);
    const isDestWithinBounds = bounds.contains(destination);

    if (isDestWithinBounds) {
      map.setPaintProperty('arrow', 'icon-opacity', 0);
      return;
    }
    if (!isWithinBounds) {
      const bboxPolygon = turf.bboxPolygon([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]);
      const line = turf.lineString([origin, newCoordinates]);
      const intersection = turf.lineIntersect(line, bboxPolygon);

      if (intersection.features.length > 0) {
        // 교차점 좌표로 설정
        newCoordinates = intersection.features[0].geometry.coordinates;
      }
    }

    // 경로에 교차점까지의 좌표를 추가
    route.features[0].geometry.coordinates.push(newCoordinates);

    // 좌표 비교에 사용할 임계값 설정 (소수점 차이가 거의 없는 경우 무시)
    const epsilon = 1e-6;

    // 화살표 아이콘의 위치를 업데이트
    if (
      Math.abs(arrow.features[0].geometry.coordinates[0] - newCoordinates[0]) > epsilon ||
      Math.abs(arrow.features[0].geometry.coordinates[1] - newCoordinates[1]) > epsilon
    ) {
      arrow.features[0].geometry.coordinates = newCoordinates;
      map.getSource("arrow").setData(arrow);
    }

    // 화살표가 향하는 방향을 계산
    if (counter > 0) {
      const previousSegment = turf.along(fullRoute, incrementDistance * (counter - 1), "kilometers");
      const bearing = turf.bearing(previousSegment, currentSegment);
      arrow.features[0].properties = { bearing: bearing };
    }

    map.getSource("route").setData(route);

    if (counter < steps && isWithinBounds) {
      animationFrameId = requestAnimationFrame(animate);
    }

    ++counter;
  }

  document.getElementById("replay").addEventListener("click", () => {

    route.features[0].geometry.coordinates = [origin];
    arrow.features[0].geometry.coordinates = origin;
    map.getSource("route").setData(route);
    map.getSource("arrow").setData(arrow);
    counter = 0;
    map.setPaintProperty('arrow', 'icon-opacity', 1);

    animate();
  });

  animate();
});