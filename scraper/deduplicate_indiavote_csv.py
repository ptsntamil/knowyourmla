import csv
import argparse
import os

def deduplicate_csv(filepath: str):
    """Removes exact row duplicates from a CSV file while preserving the header."""
    if not os.path.exists(filepath):
        print(f"Error: File not found: {filepath}")
        return

    with open(filepath, 'r', newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        try:
            header = next(reader)
        except StopIteration:
            print(f"Error: File is empty: {filepath}")
            return
        rows = list(reader)

    original_count = len(rows)
    unique_rows = []
    seen = set()

    for row in rows:
        row_tuple = tuple(row)
        if row_tuple not in seen:
            unique_rows.append(row)
            seen.add(row_tuple)

    new_count = len(unique_rows)

    if original_count == new_count:
        print(f"No duplicates found in {filepath}. Total data rows: {new_count}")
        return

    print(f"File: {filepath}")
    print(f"Original data row count: {original_count}")
    print(f"Unique data row count: {new_count}")
    print(f"Removed {original_count - new_count} duplicates.")

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(unique_rows)

    print(f"Successfully deduplicated and saved to {filepath}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Deduplicate a CSV file by removing exact row duplicates.")
    parser.add_argument("filepath", help="Path to the CSV file to deduplicate")
    args = parser.parse_args()

    deduplicate_csv(args.filepath)
