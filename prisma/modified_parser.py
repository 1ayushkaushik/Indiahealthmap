import json
import sys
from typing import Dict, Any

def load_json_file(filepath: str) -> Dict[str, Any]:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: File {filepath} not found")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: File {filepath} is not valid JSON")
        sys.exit(1)
    except Exception as e:
        print(f"Error loading file: {str(e)}")
        sys.exit(1)

def save_geojson(data: Dict[str, Any], output_file: str):
    """Save processed data to a GeoJSON file in the format needed for the app"""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

def process_india_district_geojson(data: Dict[str, Any]):
    """Process the india_district.json file to match the districts2.json format"""
    # Create a new GeoJSON structure
    processed_data = {
        "type": "FeatureCollection",
        "features": []
    }
    
    # Process each feature
    for feature in data['features']:
        if not feature['geometry']:
            continue  # Skip features with null geometry
            
        state_name = feature['properties'].get('st_nm')
        district_name = feature['properties'].get('district')
        
        if not state_name or not district_name:
            continue  # Skip features without state or district names
        
        # Create a new feature with the required properties
        new_feature = {
            "type": "Feature",
            "geometry": feature['geometry'],
            "properties": {
                "State_Name": state_name,
                "District_Name": district_name,
                "stateName": state_name,  # Add this for compatibility
                "name": district_name     # Add this for compatibility
            }
        }
        
        processed_data['features'].append(new_feature)
    
    return processed_data

def main():
    if len(sys.argv) != 2:
        print("Usage: python modified_parser.py <india_district_json_file>")
        sys.exit(1)
        
    json_file = sys.argv[1]
    data = load_json_file(json_file)
    
    # Process the GeoJSON data
    processed_data = process_india_district_geojson(data)
    
    # Save to a format that matches districts2.json
    output_file = 'districts2.json'
    save_geojson(processed_data, output_file)
    
    print(f"Processed {len(processed_data['features'])} district features")
    print(f"Data saved to {output_file}")

if __name__ == "__main__":
    main() 