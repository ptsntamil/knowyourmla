# Test file for flag determination logic
import unittest

def determine_flags(user_records):
    # Logic from the script
    new_comer = (len(user_records) == 1)
    is_incumbent = any(
        r.get('year', 0) >= 2021 and 
        r.get('year', 0) < 2026 and 
        r.get('is_winner') is True 
        for r in user_records
    )
    return new_comer, is_incumbent

class TestCandidateFlags(unittest.TestCase):
    def test_new_comer_simple(self):
        # Only one record (2026)
        user_records = [{'year': 2026, 'is_winner': False}]
        new_comer, is_incumbent = determine_flags(user_records)
        self.assertTrue(new_comer)
        self.assertFalse(is_incumbent)

    def test_not_new_comer_historical(self):
        # 2026 candidate with 2016 history
        user_records = [
            {'year': 2026, 'is_winner': False},
            {'year': 2016, 'is_winner': False}
        ]
        new_comer, is_incumbent = determine_flags(user_records)
        self.assertFalse(new_comer)
        self.assertFalse(is_incumbent)

    def test_not_new_comer_multiple_2026(self):
        # 2026 candidate contesting 2 seats
        user_records = [
            {'year': 2026, 'is_winner': False},
            {'year': 2026, 'is_winner': False}
        ]
        new_comer, is_incumbent = determine_flags(user_records)
        self.assertFalse(new_comer, "Should not be a newcomer if contesting multiple seats")
        self.assertFalse(is_incumbent)

    def test_is_incumbent_2021_winner(self):
        # 2021 winner contesting in 2026
        user_records = [
            {'year': 2026, 'is_winner': False},
            {'year': 2021, 'is_winner': True}
        ]
        new_comer, is_incumbent = determine_flags(user_records)
        self.assertFalse(new_comer)
        self.assertTrue(is_incumbent)

    def test_is_incumbent_bye_election_winner(self):
        # 2023 bye-election winner contesting in 2026
        user_records = [
            {'year': 2026, 'is_winner': False},
            {'year': 2023, 'is_winner': True}
        ]
        new_comer, is_incumbent = determine_flags(user_records)
        self.assertFalse(new_comer)
        self.assertTrue(is_incumbent)

    def test_not_incumbent_2021_loser(self):
        # 2021 loser contesting in 2026
        user_records = [
            {'year': 2026, 'is_winner': False},
            {'year': 2021, 'is_winner': False}
        ]
        new_comer, is_incumbent = determine_flags(user_records)
        self.assertFalse(new_comer)
        self.assertFalse(is_incumbent)

if __name__ == '__main__':
    unittest.main()
