/**
 * Jay St-Metrotech MTA train data only.
 * Fetches real-time arrivals for A, C, F, R, N, Q trains.
 * No visual/bird logic - data output only.
 */

const APIS = {
  jayStInd: 'https://goodservice.io/api/stops/A41',  // A, C, F (Fulton St & Culver platform)
  jayStBmt: 'https://goodservice.io/api/stops/R29'   // R, N, Q (4 Av platform)
};

const JAY_ST_ROUTES = { ind: ['A', 'C', 'F'], bmt: ['R', 'N', 'Q'] };

function formatTimeDiff(seconds) {
  if (seconds < 0) return 'Departed';
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

function getStationName(stopId) {
  const names = { 'D03': 'Rockefeller Ctr', 'D43': 'Coney Island', 'A02': 'Inwood', 'A09': '168 St', 'F01': 'Jamaica', 'F27': 'Coney Island', 'G08': 'Forest Hills', 'G33': 'Court Sq', 'R45': 'Bay Ridge' };
  return names[stopId] || stopId;
}

function processTrains(trains, stationName, direction) {
  const currentTime = Math.floor(Date.now() / 1000);
  return trains
    .filter(t => t.estimated_current_stop_arrival_time)
    .map(train => {
      const etaSeconds = train.estimated_current_stop_arrival_time - currentTime;
      return {
        id: train.id,
        station: stationName,
        direction,
        route: train.route_id,
        destination: getStationName(train.destination_stop),
        etaSeconds,
        etaFormatted: formatTimeDiff(etaSeconds)
      };
    });
}

async function fetchJayStMetrotechData() {
  const allTrains = [];

  const jayStIndResponse = await fetch(APIS.jayStInd);
  const jayStIndData = await jayStIndResponse.json();
  if (jayStIndData.upcoming_trips) {
    if (jayStIndData.upcoming_trips.north) {
      const filtered = jayStIndData.upcoming_trips.north.filter(t => JAY_ST_ROUTES.ind.includes(t.route_id));
      allTrains.push(...processTrains(filtered, 'Jay St-Metrotech', 'north'));
    }
    if (jayStIndData.upcoming_trips.south) {
      const filtered = jayStIndData.upcoming_trips.south.filter(t => JAY_ST_ROUTES.ind.includes(t.route_id));
      allTrains.push(...processTrains(filtered, 'Jay St-Metrotech', 'south'));
    }
  }

  const jayStBmtResponse = await fetch(APIS.jayStBmt);
  const jayStBmtData = await jayStBmtResponse.json();
  if (jayStBmtData.upcoming_trips) {
    if (jayStBmtData.upcoming_trips.north) {
      const filtered = jayStBmtData.upcoming_trips.north.filter(t => JAY_ST_ROUTES.bmt.includes(t.route_id));
      allTrains.push(...processTrains(filtered, 'Jay St-Metrotech', 'north'));
    }
    if (jayStBmtData.upcoming_trips.south) {
      const filtered = jayStBmtData.upcoming_trips.south.filter(t => JAY_ST_ROUTES.bmt.includes(t.route_id));
      allTrains.push(...processTrains(filtered, 'Jay St-Metrotech', 'south'));
    }
  }

  allTrains.sort((a, b) => a.etaSeconds - b.etaSeconds);
  return allTrains;
}

// Usage: fetchJayStMetrotechData().then(data => console.log(JSON.stringify(data, null, 2)))
if (typeof window !== 'undefined') window.fetchJayStMetrotechData = fetchJayStMetrotechData;
