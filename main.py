import json
import pandas as pd
import plotly.express as px
from dash import Dash, dcc, html, Input, Output, State
import numpy as np
import shapely.wkt
import shapely.geometry
from datetime import datetime, timedelta
import calendar

# Initialize the Dash app
app = Dash(__name__)

# Available months (assuming all months are available)
MONTHS = [
    {'label': calendar.month_name[i], 'value': i} for i in range(1, 13)
]

# Load taxi zones data (this is static)
print("Loading zone data...")
zones_df = pd.read_csv('taxi_zones.csv', header=None, skiprows=1)
zones_df.columns = [
    'LocationID', 'area', 'geometry', 'area2', 'zone', 'borough_code', 'borough'
]

# Parse polygons from WKT to GeoJSON
def wkt_to_geojson(wkt_str):
    try:
        geom = shapely.wkt.loads(wkt_str)
        return shapely.geometry.mapping(geom)
    except Exception:
        return None

print("Processing zone geometries...")
zones_df['geojson'] = zones_df['geometry'].apply(wkt_to_geojson)
zones_df = zones_df[zones_df['geojson'].notnull()]

# Build GeoJSON FeatureCollection
features = []
for _, row in zones_df.iterrows():
    features.append({
        "type": "Feature",
        "id": str(row['LocationID']),
        "properties": {
            "LocationID": row['LocationID'],
            "zone": row['zone'],
            "borough": row['borough']
        },
        "geometry": row['geojson']
    })

taxi_zones_geojson = {"type": "FeatureCollection", "features": features}

# Create the app layout
app.layout = html.Div([
    html.H1("NYC Taxi Data Analysis Dashboard", style={'textAlign': 'center'}),
    
    # Month Selection
    html.Div([
        html.Label('Select Month:'),
        dcc.Dropdown(
            id='month-dropdown',
            options=MONTHS,
            value=1,  # Default to January
            clearable=False,
            style={'width': '200px', 'margin': '0 auto'}
        ),
    ], style={'margin': '20px', 'textAlign': 'center'}),
    
    # Week Selection (initially hidden)
    html.Div([
        html.Label('Select Week (Optional):'),
        dcc.Dropdown(
            id='week-dropdown',
            options=[],
            value=None,
            clearable=True,
            style={'width': '200px', 'margin': '0 auto'}
        ),
    ], style={'margin': '20px', 'textAlign': 'center', 'display': 'none'}, id='week-selector'),
    
    # Visualization Type Selection
    html.Div([
        dcc.RadioItems(
            id='viz-type',
            options=[
                {'label': 'Activity Frequency', 'value': 'frequency'},
                {'label': 'Tip Analysis', 'value': 'tips'}
            ],
            value='frequency',
            labelStyle={'display': 'inline-block', 'margin': '10px'}
        ),
    ], style={'margin': '20px', 'textAlign': 'center'}),
    
    # Activity-specific controls (shown when frequency is selected)
    html.Div([
        dcc.RadioItems(
            id='location-type',
            options=[
                {'label': 'Pickup Locations', 'value': 'pickup'},
                {'label': 'Dropoff Locations', 'value': 'dropoff'}
            ],
            value='pickup',
            labelStyle={'display': 'inline-block', 'margin': '10px'}
        ),
        dcc.RadioItems(
            id='scale-type',
            options=[
                {'label': 'Linear Scale', 'value': 'linear'},
                {'label': 'Log Scale', 'value': 'log'}
            ],
            value='log',
            labelStyle={'display': 'inline-block', 'margin': '10px'}
        ),
    ], style={'margin': '20px', 'textAlign': 'center'}, id='activity-controls'),
    
    # Main visualization
    dcc.Graph(id='choropleth', style={'height': '800px'}),
    
    # Statistics display
    html.Div(id='stats-display', style={'margin': '20px', 'padding': '20px', 'backgroundColor': '#f8f9fa', 'borderRadius': '5px'}),
    
    # Zones with no data
    html.Div([
        html.H3("Zones with No Data", style={'textAlign': 'center'}),
        html.Div(id='no-data-zones', style={'padding': '20px', 'backgroundColor': '#f8f9fa', 'borderRadius': '5px'})
    ])
])

# Callback to update week options based on selected month
@app.callback(
    [Output('week-dropdown', 'options'),
     Output('week-selector', 'style')],
    [Input('month-dropdown', 'value')]
)
def update_week_options(selected_month):
    if selected_month is None:
        return [], {'display': 'none'}
    
    # Load the data for the selected month
    month_name = calendar.month_name[selected_month].lower()
    try:
        df = pd.read_json(f'yellow_{month_name}.json')
        df['tpep_pickup_datetime'] = pd.to_datetime(df['tpep_pickup_datetime'], unit='s')
        df['date'] = df['tpep_pickup_datetime'].dt.date
        
        # Calculate week ranges
        min_date = df['date'].min()
        max_date = df['date'].max()
        week_ranges = []
        current_date = min_date
        week_num = 1
        
        while current_date <= max_date:
            week_end = min(current_date + timedelta(days=6), max_date)
            week_ranges.append((current_date, week_end))
            current_date = week_end + timedelta(days=1)
            week_num += 1
            
        week_options = [
            {'label': f'Week {i+1}', 'value': i} for i in range(len(week_ranges))
        ]
        
        return week_options, {'display': 'block'}
    except Exception as e:
        print(f"Error loading data: {e}")
        return [], {'display': 'none'}

# Main callback to update the visualization
@app.callback(
    [Output('choropleth', 'figure'),
     Output('stats-display', 'children'),
     Output('no-data-zones', 'children')],
    [Input('month-dropdown', 'value'),
     Input('week-dropdown', 'value'),
     Input('viz-type', 'value'),
     Input('location-type', 'value'),
     Input('scale-type', 'value')]
)
def update_visualization(selected_month, selected_week, viz_type, location_type, scale_type):
    if selected_month is None:
        return {}, html.Div("Please select a month"), []
    
    # Load the data for the selected month
    month_name = calendar.month_name[selected_month].lower()
    try:
        df = pd.read_json(f'yellow_{month_name}.json')
        df['tpep_pickup_datetime'] = pd.to_datetime(df['tpep_pickup_datetime'], unit='s')
        df['date'] = df['tpep_pickup_datetime'].dt.date
        
        # Filter by week if selected
        if selected_week is not None:
            min_date = df['date'].min()
            week_start = min_date + timedelta(days=selected_week*7)
            week_end = week_start + timedelta(days=6)
            df = df[(df['date'] >= week_start) & (df['date'] <= week_end)]
        
        if viz_type == 'frequency':
            # Activity frequency visualization
            location_col = 'PULocationID' if location_type == 'pickup' else 'DOLocationID'
            counts = df[location_col].value_counts().reset_index()
            counts.columns = ['LocationID', 'count']
            
            # Merge with zones data
            merged = pd.merge(zones_df, counts, on='LocationID', how='left').fillna({'count': 0})
            merged['count'] = merged['count'].astype(int)
            
            # Apply scale transformation
            if scale_type == 'log':
                merged['transformed_count'] = np.log1p(merged['count'])
                color_col = 'transformed_count'
            else:
                color_col = 'count'
            
            # Create the choropleth
            fig = px.choropleth_mapbox(
                merged,
                geojson=taxi_zones_geojson,
                locations='LocationID',
                featureidkey='properties.LocationID',
                color=color_col,
                color_continuous_scale='Viridis',
                mapbox_style="carto-positron",
                zoom=10,
                center={"lat": 40.7128, "lon": -74.0060},
                opacity=0.7,
                hover_data={
                    'zone': True,
                    'borough': True,
                    'count': True
                },
                labels={
                    'count': 'Number of Trips',
                    color_col: 'Trip Count'
                }
            )
            
            # Statistics
            stats = [
                html.P(f"Total trips: {merged['count'].sum():,}"),
                html.P(f"Zones with activity: {len(merged[merged['count'] > 0]):,}"),
                html.P(f"Average trips per zone: {merged['count'].mean():.1f}")
            ]
            
            # Zones with no data
            no_data_zones = merged[merged['count'] == 0][['zone', 'borough']]
            
        else:  # Tips visualization
            # Calculate tip percentage
            df['tip_percent'] = (df['tip_amount'] / df['total_amount']) * 100
            
            # Filter valid trips
            valid_trips = df[
                (df['tip_percent'] >= 0) & 
                (df['tip_percent'] <= 100) &
                (df['total_amount'] > 0)
            ]
            
            # Group by location and calculate statistics
            location_stats = valid_trips.groupby('DOLocationID').agg({
                'tip_percent': ['mean', 'std'],
                'tip_amount': 'mean',
                'total_amount': 'count'
            }).reset_index()
            
            location_stats.columns = ['LocationID', 'avg_tip_percent', 'tip_percent_std', 'avg_tip', 'trip_count']
            
            # Merge with zones data
            merged = pd.merge(zones_df, location_stats, on='LocationID', how='left').fillna({
                'avg_tip_percent': 0,
                'tip_percent_std': 0,
                'avg_tip': 0,
                'trip_count': 0
            })
            
            # Apply scale transformation
            if scale_type == 'log':
                merged['transformed_tip'] = np.log10(merged['avg_tip_percent'] + 0.1)
                color_col = 'transformed_tip'
                color_range = (np.log10(0.1), np.log10(20.1))
            else:
                color_col = 'avg_tip_percent'
                color_range = (0, 12)
            
            # Create the choropleth
            fig = px.choropleth_mapbox(
                merged,
                geojson=taxi_zones_geojson,
                locations='LocationID',
                featureidkey='properties.LocationID',
                color=color_col,
                color_continuous_scale='RdYlGn',
                range_color=color_range,
                mapbox_style="carto-positron",
                zoom=10,
                center={"lat": 40.7128, "lon": -74.0060},
                opacity=0.7,
                hover_data={
                    'zone': True,
                    'borough': True,
                    'avg_tip_percent': ':.1f',
                    'tip_percent_std': ':.1f',
                    'avg_tip': '$.2f',
                    'trip_count': True
                },
                labels={
                    'avg_tip_percent': 'Average Tip (%)',
                    'tip_percent_std': 'Tip % Std Dev',
                    'avg_tip': 'Average Tip ($)',
                    'trip_count': 'Number of Trips'
                }
            )
            
            # Statistics
            stats = [
                html.P(f"Total valid trips: {merged['trip_count'].sum():,}"),
                html.P(f"Average tip percentage: {merged['avg_tip_percent'].mean():.1f}%"),
                html.P(f"Zones with tip data: {len(merged[merged['trip_count'] > 0]):,}")
            ]
            
            # Zones with no data
            no_data_zones = merged[merged['trip_count'] == 0][['zone', 'borough']]
        
        # Format zones with no data
        if len(no_data_zones) == 0:
            no_data_text = "All zones have some data"
        else:
            no_data_text = [
                html.Div([
                    f"{row['zone']} ({row['borough']})"
                ]) for _, row in no_data_zones.iterrows()
            ]
        
        return fig, stats, no_data_text
        
    except Exception as e:
        print(f"Error processing data: {e}")
        return {}, html.Div(f"Error loading data: {str(e)}"), []

if __name__ == '__main__':
    app.run(debug=True) 