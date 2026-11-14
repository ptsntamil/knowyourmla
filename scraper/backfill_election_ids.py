"""Backfill canonical election_id attributes on elections and candidate items.

Dry run by default. Candidate records are classified only by their legacy year,
so ambiguous years MUST be mapped explicitly. Example:
  python backfill_election_ids.py --map 2026=AC_GEN_2026 --map 202610=AC_BYE_2026
  python backfill_election_ids.py --map 2026=AC_GEN_2026 --map 202610=AC_BYE_2026 --apply
"""

import argparse
from typing import Any

import boto3


def scan(table: Any) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    response = table.scan()
    items.extend(response.get("Items", []))
    while response.get("LastEvaluatedKey"):
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response.get("Items", []))
    return items


def parse_maps(values: list[str]) -> dict[str, str]:
    result = {}
    for value in values:
        year, separator, election_id = value.partition("=")
        if not separator or not year.isdigit() or not election_id:
            raise ValueError(f"Invalid --map {value!r}; expected YEAR=ELECTION_ID")
        result[year] = election_id
    return result


def election_record_id(item: dict[str, Any], year_map: dict[str, str]) -> str:
    year = str(item.get("year", ""))
    election_type = str(item.get("type", "")).lower()
    category = str(item.get("category", "")).lower()
    mode = "LS" if "lok" in election_type else "AC"
    kind = "BYE" if "bye" in category else "GEN"
    inferred = f"{mode}_{kind}_{year}"
    return inferred


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--region", default="ap-south-2")
    parser.add_argument("--candidates-table", default="knowyourmla_candidates")
    parser.add_argument("--elections-table", default="knowyourmla_elections")
    parser.add_argument("--map", action="append", default=[], metavar="YEAR=ID",
                        help="Explicit legacy candidate year mapping; repeatable")
    parser.add_argument("--apply", action="store_true", help="Write changes; default is dry run")
    args = parser.parse_args()
    year_map = parse_maps(args.map)

    dynamodb = boto3.resource("dynamodb", region_name=args.region)
    tables = {
        args.candidates_table: dynamodb.Table(args.candidates_table),
        args.elections_table: dynamodb.Table(args.elections_table),
    }
    # Only inspect years explicitly supplied by the operator. This makes the
    # command a scoped migration rather than an implicit whole-table backfill.
    selected_ids = set(year_map.values())
    records = {
        args.candidates_table: [
            item for item in scan(tables[args.candidates_table])
            if str(item.get("year", "")) in year_map
        ],
        args.elections_table: [
            item for item in scan(tables[args.elections_table])
            if item.get("election_id") in selected_ids
            or election_record_id(item, year_map) in selected_ids
        ],
    }
    updates = []

    for table_name, items in records.items():
        for item in items:
            if item.get("election_id"):
                continue
            if table_name == args.elections_table:
                election_id = election_record_id(item, year_map)
            else:
                legacy_year = str(item.get("year", ""))
                if legacy_year not in year_map:
                    raise ValueError(
                        f"Candidate {item.get('PK')} has year={legacy_year!r} but no mapping. "
                        "Add --map YEAR=ID; do not guess when one year can represent multiple elections."
                    )
                election_id = year_map[legacy_year]
            updates.append((table_name, item, election_id))
            print(f"{table_name}: {item['PK']} / {item['SK']} -> {election_id}")

    print(f"{len(updates)} updates; mode={'APPLY' if args.apply else 'DRY RUN'}")
    if not args.apply:
        return
    for table_name, item, election_id in updates:
        tables[table_name].update_item(
            Key={"PK": item["PK"], "SK": item["SK"]},
            UpdateExpression="SET election_id = :id",
            ConditionExpression="attribute_not_exists(election_id)",
            ExpressionAttributeValues={":id": election_id},
        )


if __name__ == "__main__":
    main()
