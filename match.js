#!/usr/bin/env node
'use strict'

const XmlParser = require('xml-stream-saxes')
const {IANAZone, DateTime} = require('luxon')
const {strictEqual, ok} = require('assert')
const db = require('./lib/db')

const gtfsAgencyIdsByVdvBetreiberId = new Map([
	['rbrBOS', '566'], // Busverkehr Oder-Spree GmbH
	['rbrSNB', '772'], // Spree-Neiße-Bus, operated by DB Regio Bus Ost GmbH
	// todo: verify this
	['rbrSBE', '772'], // DB Regio Bus Ost GmbH
	// todo: verify this
	['rbrOST', '796'], // Berliner Verkehrsbetriebe
])

const abortWithError = (err) => {
	console.error(err)
	process.exit(1)
}

const close = async () => {
	await db.end()
}

// todo: DRY with find-trip
const zone = new IANAZone('Europe/Berlin')
const inBerlinTime = (d) => {
	return DateTime
	.fromJSDate(d, {zone})
	.toISO({suppressMilliseconds: true})
}

const matchVdvIstFahrt = async (istFahrt) => {
	const lineName = istFahrt.LinienID?.$text
	strictEqual(typeof lineName, 'string', 'istFahrt.LinienID')
	ok(lineName, 'istFahrt.LinienID')

	// todo: use ProductID

	const direction = istFahrt.RichtungsText?.$text
	strictEqual(typeof direction, 'string', 'istFahrt.RichtungsText')
	ok(direction, 'istFahrt.RichtungsText')
	// todo: use provenance from VonRichtungsText?

	const _operator = istFahrt.BetreiberID?.$text
	strictEqual(typeof lineName, 'string', 'istFahrt.BetreiberID')
	ok(lineName, 'istFahrt.BetreiberID')
	if (!gtfsAgencyIdsByVdvBetreiberId.has(_operator)) {
		const err = new Error('unknown BetreiberID: ' + _operator)
		err.istFahrt = istFahrt
		throw err
	}
	const operator = gtfsAgencyIdsByVdvBetreiberId.get(_operator)

	let dep0 = istFahrt.FahrtRef?.FahrtStartEnde?.Startzeit?.$text
	strictEqual(typeof dep0, 'string', 'istFahrt.FahrtRef.FahrtStartEnde.Startzeit')
	ok(dep0, 'istFahrt.FahrtRef.FahrtStartEnde.Startzeit')
	dep0 = DateTime.fromISO(dep0)
	ok(dep0.isValid, 'istFahrt.FahrtRef.FahrtStartEnde.Startzeit must be ISO 8601')
	const dep0Date = dep0.toISODate()
	dep0 = dep0.toISO({suppressMilliseconds: true})

	// todo
	console.log({
		lineName,
		direction,
		operator,
		dep0,
	})
	const query = `
		WITH dep AS (
			SELECT trip_id, "date"
			FROM arrivals_departures_with_stable_ids a_d_s
			LEFT JOIN routes ON a_d_s.route_id = routes.route_id
			WHERE stop_sequence_consec = 0
			-- todo: normalize
			AND routes.route_short_name = $1
			-- todo: normalize
			-- AND trip_headsign = $2
			AND agency_id = $3
			AND t_departure = $4
			AND "date" = $5
			LIMIT 1
		)
		SELECT DISTINCT ON (trip_id, date, stop_sequence)
			trip_id, trip_short_name,
			route_id, route_short_name, route_type,
			direction_id,
			trip_headsign,
			date,
			stop_sequence,
			t_arrival,
			t_departure,
			a_d_s.stop_id, a_d_s.stop_name,
			ST_Y(stops.stop_loc::geometry) as stop_lat, ST_X(stops.stop_loc::geometry) as stop_lon,
			array_agg(stop_stable_id) OVER (PARTITION BY trip_id, date, stop_sequence) AS stop_stable_ids,
			station_id, station_name,
			ST_Y(stations.stop_loc::geometry) as station_lat, ST_X(stations.stop_loc::geometry) as station_lon,
			array_agg(station_stable_id) OVER (PARTITION BY trip_id, date, stop_sequence) AS station_stable_ids
		FROM arrivals_departures_with_stable_ids a_d_s
		LEFT JOIN stops ON stops.stop_id = a_d_s.stop_id
		LEFT JOIN stops stations ON stations.stop_id = a_d_s.station_id
		WHERE True
		AND trip_id = (SELECT trip_id FROM dep)
		AND date = (SELECT "date" FROM dep)
		ORDER BY trip_id, date, stop_sequence
	`
	const queryParameters = [
		lineName,
		// todo
		// direction,
		operator,
		dep0, dep0Date,
	]
	const {rows} = await db.query(query, queryParameters)
	if (rows.length === 0) {
		const err = new Error('no departure found')
		err.istFahrt = istFahrt
		err.query = query
		err.queryParameters = queryParameters
		throw err
	}

	// todo
}

// todo: decode ISO-* encoding
const parser = new XmlParser(process.stdin)
parser.once('error', abortWithError)

const tag = 'IstFahrt'
parser.collect(tag)
parser.preserve(tag)
parser.on('endElement: ' + tag, (istFahrt) => {
	matchVdvIstFahrt(istFahrt)
	.catch((err) => {
		console.error(require('util').inspect(istFahrt, {depth: null, colors: true}))
		console.error(err)
	})
})
