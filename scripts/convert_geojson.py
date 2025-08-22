import json
import os

def convert_geojson():
    # Get the absolute path to the project root directory
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_file = os.path.join(project_root, 'lib', 'bhuvan_states.geojsonl')
    output_file = os.path.join(project_root, 'lib', 'states.json')

    # Initialize the FeatureCollection structure
    feature_collection = {
        "type": "FeatureCollection",
        "crs": {
            "type": "name",
            "properties": {
                "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
            }
        },
        "features": []
    }

    # Read and process the input file
    with open(input_file, 'r') as f:
        for line in f:
            feature = json.loads(line.strip())
            
            # Extract state name and code from properties
            state_name = feature["properties"]["s_name"]
            state_code = feature["properties"]["s_code"]
            
            # Create new feature with required properties
            new_feature = {
                "type": "Feature",
                "properties": {
                    "ID_0": 105,  # India's ID
                    "ISO": "IND",
                    "NAME_0": "India",
                    "ID_1": int(state_code),
                    "NAME_1": state_name,
                    "NL_NAME_1": None,
                    "VARNAME_1": None,
                    "TYPE_1": "State",
                    "ENGTYPE_1": "State"
                },
                "geometry": feature["geometry"]
            }
            
            # Special cases for Union Territories
            union_territories = {
                "Delhi", "Puducherry", "Andaman & Nicobar",
                "Chandigarh", "Dadra & Nagar Haveli", "Daman & Diu", "Lakshadweep"
            }
            if state_name in union_territories:
                new_feature["properties"]["TYPE_1"] = "Union Territory"
                new_feature["properties"]["ENGTYPE_1"] = "Union Territory"
            
            feature_collection["features"].append(new_feature)

    # Write the output file
    with open(output_file, 'w') as f:
        json.dump(feature_collection, f, indent=2)

if __name__ == "__main__":
    convert_geojson()
