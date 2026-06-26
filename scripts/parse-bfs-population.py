#!/usr/bin/env python3
"""Extract BFS commune population totals from the published Excel table."""
import json
import sys
import zipfile
import xml.etree.ElementTree as ET

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def main() -> None:
    path = sys.argv[1]
    with zipfile.ZipFile(path) as archive:
        shared_strings = []
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
        for item in root.findall(".//m:si", NS):
            shared_strings.append(
                "".join((node.text or "") for node in item.findall(".//m:t", NS))
            )

        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        population_by_bfs: dict[str, int] = {}

        for row in sheet.findall(".//m:row", NS):
            values: list[str] = []
            for cell in row.findall("m:c", NS):
                value_node = cell.find("m:v", NS)
                if value_node is None:
                    continue
                if cell.attrib.get("t") == "s":
                    values.append(shared_strings[int(value_node.text)])
                else:
                    values.append(value_node.text or "")

            if len(values) < 2:
                continue

            label = str(values[0]).strip()
            if (
                not label
                or label == "Gemeinde"
                or label.startswith("cc-")
                or label == "Schweiz"
            ):
                continue

            bfs_label = label.split(" ", 1)[0]
            try:
                bfs_number = int(bfs_label)
            except ValueError:
                continue

            try:
                population = int(str(values[1]).replace("'", "").replace(" ", ""))
            except ValueError:
                continue

            if population > 0:
                population_by_bfs[str(bfs_number)] = population

    print(json.dumps(population_by_bfs))


if __name__ == "__main__":
    main()
