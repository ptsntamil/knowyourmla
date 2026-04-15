import os
import json
import pytest
from unittest.mock import MagicMock, patch
from batch_extract_affidavits import batch_process

def test_batch_process_nesting_structure(tmp_path):
    # Setup test data in a temporary directory
    test_file = tmp_path / "test_candidates.json"
    candidates = [
        {
            "name": "Candidate 1",
            "constituency": "Const 1",
            "affidavite_file_location": "dummy.pdf"
        }
    ]
    
    with open(test_file, 'w', encoding='utf-8') as f:
        json.dump(candidates, f)

    # Mock dependencies
    mock_extractor_instance = MagicMock()
    mock_extractor_instance.run.return_value = {"pan_number": "ABCDE1234F", "education": "PhD"}

    # We need to mock os.path.exists for the dummy PDF
    with patch('batch_extract_affidavits.AffidavitExtractor', return_value=mock_extractor_instance), \
         patch('batch_extract_affidavits.load_dotenv'), \
         patch('os.path.exists', side_effect=lambda p: True if p == str(test_file) or p == "dummy.pdf" else False), \
         patch('batch_extract_affidavits.save_json_atomic') as mock_save:
        
        # We manually call save_json_atomic logic or just check how it's called
        batch_process(limit=1, input_file=str(test_file))

    # Check that data was saved (or would be)
    # Since save_json_atomic is mocked, we check its arguments
    args, _ = mock_save.call_args
    saved_data = args[0]
    
    c1 = saved_data[0]
    assert c1["extraction_status"] == "success"
    assert "extracted_data" in c1
    assert c1["extracted_data"]["pan_number"] == "ABCDE1234F"
    assert "name" in c1  # Still has metadata

def test_batch_process_skip_logic(tmp_path):
    test_file = tmp_path / "test_skip.json"
    candidates = [
        {
            "name": "Already Done",
            "extraction_status": "success",
            "extracted_data": {"pan": "OLD"}
        }
    ]
    with open(test_file, 'w', encoding='utf-8') as f:
        json.dump(candidates, f)

    mock_extractor_instance = MagicMock()

    with patch('batch_extract_affidavits.AffidavitExtractor', return_value=mock_extractor_instance), \
         patch('batch_extract_affidavits.load_dotenv'), \
         patch('os.path.exists', return_value=True), \
         patch('batch_extract_affidavits.save_json_atomic') as mock_save:
        
        batch_process(limit=1, input_file=str(test_file))

    # Extractor should NOT be called
    mock_extractor_instance.run.assert_not_called()
