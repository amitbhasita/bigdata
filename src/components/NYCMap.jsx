import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngBounds, Icon } from 'leaflet'; // Import Icon from leaflet
import glbTripsData from './data/2022_JAN_to_DEC.json';
import { useNavigate } from 'react-router-dom';


const center = [40.7128, -74.006]; // NYC center
const nycBounds = new LatLngBounds([40.4774, -74.2591], [40.9176, -73.7004]);
// Coordinates for each of the five boroughs of NYC
const boroughs = [
    { name: 'Manhattan', position: [40.7831, -73.9712] },
    { name: 'Brooklyn', position: [40.6782, -73.9442] },
    { name: 'Queens', position: [40.7282, -73.7949] },
    { name: 'The Bronx', position: [40.8448, -73.8648] },
    { name: 'Staten Island', position: [40.5795, -74.1502] },
];

// Custom Marker Icon with reduced size
const customIcon = new Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [20, 30], // Set smaller icon size (width, height)
    iconAnchor: [10, 30], // Anchor point (relative to the icon size)
    popupAnchor: [0, -30], // Popup position (relative to the icon size)
});

const boroughIcon = new Icon({
    iconUrl: './markers/src.png', // Custom icon for borough markers
    iconSize: [30, 30],
    iconAnchor: [10, 30],
    popupAnchor: [0, -30],
});

const monthsList = [
    'None', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];


const getMonthIndex = (month) => {
    return monthsList.findIndex(m => m === month);
}

const getMonthName = (index) => {
    return monthsList[index + 1];
}

const Modal = ({ show, onClose, tableData }) => {
    if (!show) return null;

    return (
        <div className="ag-theme-alpine" style={{ width: '80%', height: 'auto', margin: '0 auto', padding: '20px', display: 'flex', justifyContent: 'center'}}>
            <div style={{ width: '100%' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px' }}>Close</button>
                <h2>Monthly Breakdown</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ border: '2px dotted #007bff', padding: '8px' }}>Month</th>
                                <th style={{ border: '2px dotted #007bff', padding: '8px' }}>Total Trips</th>
                                <th style={{ border: '2px dotted #007bff', padding: '8px' }}>Total Time</th>
                                <th style={{ border: '2px dotted #007bff', padding: '8px' }}>Total Amount</th>
                                <th style={{ border: '2px dotted #007bff', padding: '8px' }}>Total Distance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((data, index) => (
                                <tr key={index}>
                                    <td style={{ border: '2px dotted #007bff', padding: '8px' }}>{data.month}</td>
                                    <td style={{ border: '2px dotted #007bff', padding: '8px' }}>{data.totalTrips}</td>
                                    <td style={{ border: '2px dotted #007bff', padding: '8px' }}>{data.totalTime} minute</td>
                                    <td style={{ border: '2px dotted #007bff', padding: '8px' }}>${data.totalAmount}</td>
                                    <td style={{ border: '2px dotted #007bff', padding: '8px' }}>{data.totalDistance} miles</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
    );
};




const NYCMap = () => {
    const [pickup, setPickup] = useState('None');
    const [destination, setDestination] = useState('None');
    const [selectedMonth, setSelectedMonth] = useState('None');
    const [availableDestinations, setAvailableDestinations] = useState([]);
    const [availablePickups, setAvailablePickups] = useState([]);

    const [tripsData, setTripsData] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [totalTrips, setTotalTrips] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [totalDistance, setTotalDistance] = useState(0);

    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const handleShowModal = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };
    const processDataForAllMonths = (tripsData, pickup, destination) => {
        const monthlyStats = [];

        for (let i = 0; i < 12; i++) {
            const filteredTrips = tripsData[i]
                .filter((trip) =>
                    (pickup === 'None' || trip.Zone_x === pickup) &&
                    (destination === 'None' || trip.Zone_y === destination)
                );

            const totalTrips = filteredTrips.reduce((acc, trip) => acc + trip.trip_count, 0);
            const totalTime = filteredTrips.reduce((acc, trip) => acc + (trip.trip_count * trip.est_time_mean || 0), 0);
            const totalAmount = filteredTrips.reduce((acc, trip) => acc + (trip.trip_count * trip.total_amount_mean || 0), 0);
            const totalDistance = filteredTrips.reduce((acc, trip) => acc + (trip.trip_count * trip.trip_distance_mean || 0), 0);
            
            monthlyStats.push({
                month: getMonthName(i),
                totalTrips: parseFloat(totalTrips.toFixed(2)),
                totalTime: parseFloat(totalTime.toFixed(2)),
                totalAmount: parseFloat(totalAmount.toFixed(2)),
                totalDistance: parseFloat(totalDistance.toFixed(2)),
            });
        }

        return monthlyStats;
    };

    useEffect(() => {
        const monthIndex = getMonthIndex(selectedMonth);
        const monthlyStats = processDataForAllMonths(glbTripsData, pickup, destination);
        setTableData(monthlyStats);
        console.log(monthlyStats)
        if (selectedMonth === 'None' || monthIndex === -1) {
            setTripsData(glbTripsData.flat());
        } else {
            setTripsData(glbTripsData[monthIndex - 1]);
        }

        // Available Destinations filter based on selected pickup
        if (pickup !== 'None') {
            const destinationsForPickup = tripsData
                .filter((trip) => trip.Zone_x === pickup)
                .map((trip) => trip.Zone_y)
                .filter((zone) => zone !== null); // Remove null values
            setAvailableDestinations([...new Set(destinationsForPickup)]);
        } else {
            setAvailableDestinations([]);
        }

        // Available Pickups filter based on selected destination
        if (destination !== 'None') {
            const pickupsForDestination = tripsData
                .filter((trip) => trip.Zone_y === destination)
                .map((trip) => trip.Zone_x)
                .filter((zone) => zone !== null);
            setAvailablePickups([...new Set(pickupsForDestination)]);
        } else {
            setAvailablePickups([]);
        }

        // Filter trips based on pickup and destination
        const filteredTrips = tripsData.filter((trip) =>
            (pickup === 'None' || trip.Zone_x === pickup) &&
            (destination === 'None' || trip.Zone_y === destination)
        );

        // Update stats based on filtered trips
        setTotalTrips(filteredTrips.reduce((acc, trip) => acc + trip.trip_count, 0));
        setTotalTime(filteredTrips.reduce((acc, trip) => acc + (trip.trip_count * trip.est_time_mean || 0), 0));
        setTotalAmount(filteredTrips.reduce((acc, trip) => acc + (trip.trip_count * trip.total_amount_mean || 0), 0));
        setTotalDistance(filteredTrips.reduce((acc, trip) => acc + (trip.trip_count * trip.trip_distance_mean || 0), 0));

    }, [pickup, destination, selectedMonth, tripsData]);

    const getCoordinates = (zoneName) => {
        const trip = tripsData.find(
            (t) => t.Zone_x === zoneName || t.Zone_y === zoneName
        );
        if (trip) {
            return zoneName === trip.Zone_x
                ? [trip.PU_lat, trip.PU_lon]
                : [trip.DO_lat, trip.DO_lon];
        }
        return null;
    };

    const getTripDetails = (pickupZone, destinationZone) => {
        const trip = tripsData.find(
            (t) => t.Zone_x === pickupZone && t.Zone_y === destinationZone
        );
        if (trip) {
            return {
                amount: trip.total_amount_mean ? trip.total_amount_mean.toFixed(2) : 'N/A',
                pickUpZone: trip.Zone_x,
                destinationZone: trip.Zone_y,
                tripDuration: trip.est_time_mean ? trip.est_time_mean.toFixed(2) : 'N/A',
                distance: trip.trip_distance_mean ? trip.trip_distance_mean.toFixed(2) : 'N/A',
            };
        }
        return {};
    };

    const filterNullCoordinates = (coordinates) => {
        return coordinates && coordinates.every(coord => coord !== null);
    };

    const polylineCoordinates = pickup !== 'None' && destination !== 'None'
        ? [getCoordinates(pickup), getCoordinates(destination)].filter(filterNullCoordinates)
        : [];

    const tripDetails = pickup !== 'None' && destination !== 'None' ? getTripDetails(pickup, destination) : {};

    return (
        <div style={{ height: '100vh', width: '100vw', position: 'relative', background: '#f8f9fa' }}>
            {/* Back to Dashboard Button in Bottom Left Corner */}
            <div style={{ position: 'fixed', bottom: 30, left: 30, zIndex: 1000 }}>
                <button
                    className="btn btn-primary"
                    style={{
                        fontSize: '0.95rem',
                        padding: '6px 16px 6px 10px',
                        borderRadius: '22px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 500,
                        letterSpacing: '0.3px',
                    }}
                    onClick={() => window.location.replace('/')}
                >
                    <span style={{ fontSize: '1.05em', display: 'flex', alignItems: 'center' }}>←</span>
                    Back to Dashboard
                </button>
            </div>
            <div style={{ display: 'flex', height: '100%', width: '100%' }}>
                <div
                    style={{
                        flex: 1,
                        backgroundColor: '#fff',
                        padding: '20px',
                        justifyContent: 'space-between',
                    }}
                >   <h1>Trip Search</h1>
                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="pickup" style={{ display: 'block', marginBottom: '10px' }}>
                            Pick-Up Location:
                        </label>
                        <select
                            id="pickup"
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                fontSize: '16px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                            }}
                        >
                            <option value="None">None</option>
                            {[...new Set(tripsData.flatMap((trip) => trip.Zone_x))].filter(zone => zone !== null).map((zone) => (
                                <option key={zone} value={zone}>
                                    {zone}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="destination" style={{ display: 'block', marginBottom: '10px' }}>
                            Destination Location:
                        </label>
                        <select
                            id="destination"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                fontSize: '16px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                            }}
                        >
                            <option value="None">None</option>
                            {pickup !== 'None'
                                ? availableDestinations.filter(zone => zone !== null).map((zone) => (
                                    <option key={zone} value={zone}>
                                        {zone}
                                    </option>
                                ))
                                : [...new Set(tripsData.flatMap((trip) => trip.Zone_y))].filter(zone => zone !== null).map((zone) => (
                                    <option key={zone} value={zone}>
                                        {zone}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Month selection dropdown */}
                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="month" style={{ display: 'block', marginBottom: '10px' }}>
                            Select Month:
                        </label>
                        <select
                            id="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                fontSize: '16px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                            }}
                        >
                            {monthsList.map((month) => (
                                <option key={month} value={month}>
                                    {month}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => {
                            setPickup('None');
                            setDestination('None');
                            setAvailableDestinations([]);
                            setAvailablePickups([]);
                            setSelectedMonth('None');
                        }}
                        style={{
                            width: 'auto',
                            padding: '8px 16px',
                            fontSize: '14px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '10px',
                        }}
                    >
                        Reset Filters
                    </button>

                    <button
                        onClick={handleShowModal}
                        style={{
                            width: 'auto',
                            padding: '8px 16px',
                            fontSize: '14px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Show
                    </button>
                    {/* Cards for total stats */}
                    <div style={{ display: 'flex', padding: '5px' }}>
                        <div style={cardStyle}>
                            <h6>Total Trips</h6>
                            <p style={{ color: '#007bff', fontWeight: '800' }}>{totalTrips}</p> {/* Blue color for trips */}
                        </div>
                        <div style={cardStyle}>
                            <h6>Total Time</h6>
                            <p style={{ color: '#28a745', fontWeight: '800' }}>{totalTime.toFixed(2)} minute</p> {/* Green color for time */}
                        </div>
                        <div style={cardStyle}>
                            <h6>Total Amount</h6>
                            <p style={{ color: '#dc3545', fontWeight: '800' }}>${totalAmount.toFixed(2)}</p> {/* Red color for amount */}
                        </div>
                        <div style={cardStyle}>
                            <h6>Total Distance</h6>
                            <p style={{ color: '#424200', fontWeight: '800' }}>{totalDistance.toFixed(2)} miles</p> {/* Yellow color for distance */}
                        </div>

                    </div>
                </div>
                <Modal
                        show={showModal}
                        onClose={handleCloseModal}
                        tableData={tableData}
                    />
                {/* Right side with Map */}
                <div style={{ flex: 1 }}>
                    <MapContainer
                        center={center}
                        zoom={11}
                        minZoom={10}
                        maxZoom={14}
                        maxBounds={nycBounds}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                        {boroughs.map((boro, index) => {
                            return (
                                <Marker
                                    key={index}
                                    position={boro.position}
                                    icon={boroughIcon}
                                >
                                    <Popup>{boro.name}</Popup>
                                </Marker>
                            );
                        })}

                        {/* Only render map markers and polylines if at least one of pickup or destination is selected */}
                        {pickup !== 'None' || destination !== 'None' ? (
                            <>
                                {/* If both pick-up and destination are selected, show only those two markers and the polyline */}
                                {pickup !== 'None' && destination !== 'None' && (
                                    <>
                                        <Marker key={`pickup-${pickup}`} position={getCoordinates(pickup)} icon={customIcon}>
                                            <Popup>
                                                <div>
                                                    <h6>Pick-Up Location</h6>
                                                    <p><strong>Pick-Up Zone:</strong> {tripDetails.pickUpZone}</p>
                                                    <p><strong>Destination Zone:</strong> {tripDetails.destinationZone}</p>
                                                    <p><strong>Avg Amount:</strong> ${tripDetails.amount}</p>
                                                    <p><strong>Avg Duration:</strong> {tripDetails.tripDuration} mins</p>
                                                    <p><strong>Avg Distance:</strong> {tripDetails.distance} miles</p>
                                                </div>
                                            </Popup>
                                        </Marker>
                                        <Marker key={`destination-${destination}`} position={getCoordinates(destination)} icon={customIcon}>
                                            <Popup>
                                                <div>
                                                    <h6>Destination Location</h6>
                                                    <p><strong>Pick-Up Zone:</strong> {tripDetails.pickUpZone}</p>
                                                    <p><strong>Destination Zone:</strong> {tripDetails.destinationZone}</p>
                                                    <p><strong>Avg Amount:</strong> ${tripDetails.amount}</p>
                                                    <p><strong>Avg Duration:</strong> {tripDetails.tripDuration} mins</p>
                                                    <p><strong>Avg Distance:</strong> {tripDetails.distance} miles</p>
                                                </div>
                                            </Popup>
                                        </Marker>
                                        <Polyline positions={polylineCoordinates} color="blue" weight={1} />
                                    </>
                                )}

                                {/* If only pick-up is selected, show marker for pickup and markers for all available destinations, and draw polylines */}
                                {pickup !== 'None' && destination === 'None' && (
                                    <>
                                        <Marker position={getCoordinates(pickup)} icon={customIcon}>
                                            <Popup>{pickup}</Popup>
                                        </Marker>

                                        {availableDestinations
                                            .map((dest) => getCoordinates(dest))
                                            .filter(filterNullCoordinates)
                                            .map((coordinates, index) => (
                                                <React.Fragment key={index}>
                                                    <Marker position={coordinates} icon={customIcon}>
                                                        <Popup>{availableDestinations[index]}</Popup>
                                                    </Marker>
                                                    <Polyline
                                                        positions={[getCoordinates(pickup), coordinates]}
                                                        color="blue"
                                                        weight={1}
                                                    />
                                                </React.Fragment>
                                            ))}
                                    </>
                                )}

                                {/* If only destination is selected, show marker for destination and markers for all available pick-ups, and draw polylines */}
                                {destination !== 'None' && pickup === 'None' && (
                                    <>
                                        <Marker position={getCoordinates(destination)} icon={customIcon}>
                                            <Popup>{destination}</Popup>
                                        </Marker>

                                        {availablePickups
                                            .map((pickupZone) => getCoordinates(pickupZone))
                                            .filter(filterNullCoordinates)
                                            .map((coordinates, index) => (
                                                <React.Fragment key={index}>
                                                    <Marker position={coordinates} icon={customIcon}>
                                                        <Popup>{availablePickups[index]}</Popup>
                                                    </Marker>
                                                    <Polyline
                                                        positions={[coordinates, getCoordinates(destination)]}
                                                        color="blue"
                                                        weight={1}
                                                    />
                                                </React.Fragment>
                                            ))}
                                    </>
                                )}
                            </>
                        ) : null}

                        <ZoomControl position="topright" />
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

const cardStyle = {
    padding: '10px',
    borderRadius: '8px',
    border: '2px solid',
    backgroundColor: '#ffeddf',
    flex: 1,
    margin: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

export default NYCMap;
