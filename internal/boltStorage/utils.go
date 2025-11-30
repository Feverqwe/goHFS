package boltstorage

import (
	"encoding/json"
	"fmt"
)

func InterfaceToJSON(data interface{}) ([]byte, error) {
	if data == nil {
		return []byte("null"), nil
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal interface to JSON: %w", err)
	}

	return jsonData, nil
}

func JSONToInterface(data []byte) (interface{}, error) {
	if len(data) == 0 {
		return nil, nil
	}

	var result interface{}
	err := json.Unmarshal(data, &result)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON to interface: %w", err)
	}

	return result, nil
}
