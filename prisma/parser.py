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

def save_processed_data(states: list, districts: list, output_file: str):
    """Save processed data to a JSON file that matches our schema format"""
    processed_data = {
        "states": states,
        "districts": districts
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(processed_data, f, indent=2)

def process_geojson(data: Dict[str, Any]):
    states = {}  # To store unique states
    districts = []  # To store all districts
    
    for feature in data['features']:
        props = feature['properties']
        state_name = props['State_Name']
        district_name = props.get('District_Name')  # Some features might be state-level
        geometry = feature['geometry']
        
        # Process state
        if state_name not in states:
            states[state_name] = {
                "name": state_name,
                "geometry": geometry
            }
        
        # Process district if it exists
        if district_name:
            district = {
                "name": district_name,
                "stateName": state_name,  
                "geometry": geometry
            }
            districts.append(district)
    
    return list(states.values()), districts

def main():
    if len(sys.argv) != 2:
        print("Usage: python parser.py <json_file>")
        sys.exit(1)
        
    json_file = sys.argv[1]
    data = load_json_file(json_file)
    
    # Process the GeoJSON data
    states, districts = process_geojson(data)
    
    # Save to a format that's easy to import with our Prisma script
    
    output_file = 'processed_geo_data.json'
    save_processed_data(states, districts, output_file)
    
    print(f"Processed {len(states)} states and {len(districts)} districts")
    print(f"Data saved to {output_file}")

if __name__ == "__main__":
    main()

