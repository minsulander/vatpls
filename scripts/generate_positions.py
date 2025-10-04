#!/usr/bin/env python3

'''
Creates valid positions for vatpls from a .ese file. Only really needs to be run with updated positions.

1. Place the .ese file in the same folder as this script. It should start with ESAA and end with .ese
2. Run the script
3. The available positions will be saved in ../src/data/positions.txt
'''

from dataclasses import dataclass
from typing import Optional, List
import os

@dataclass
class Position:
    callsign: str
    radio: str
    airport: str
    si: str
    type: str
        
    def position_name(self) -> Optional[str]:
        parts = self.callsign.split("_")
        
        match (parts[0], self.type):
            case ("ESSR", _):
                return self.radio
            case ("ESAA", "CTR"):
                return "ESAA"
            case (_, "CTR") if len(parts) <= 2:
                return self.si
            case (prefix, "CTR"):
                return f"{prefix[2:]} {parts[1]}"
            case (_, "APP"):
                return self._get_app_name(parts)
            case (_, "TWR"):
               return self._get_twr_name(parts) 
            case (_, "GND"):
                airport_code = self.airport[2:]
                if (len(parts) == 3):
                    return f"{airport_code} {parts[2]}-{parts[1]}"
                return f"{airport_code} GND"
            case (_, "DEL"):
                airport_code = self.airport[2:]
                return f"{airport_code} DEL"
            case _:
                return None

    def _get_app_name(self, parts: List[str]) -> str:
        is_arrival = self.radio.split(" ")[1] == "Arrival"
        airport_code = self.airport[2:]
        
        match self.airport:
            case "ESSA":
                return "OS DIR" if is_arrival else f"OS ARR-{parts[1]}"
            case "ESSB":
                return "OS APP-S"
            case "ESSP":
                return f"{self.si} APP"
            case "ESMS":
                if (parts[1]) == "APP":
                    return "MM L"
                return f"MM {parts[1]}"
            case _ if len(parts) == 3:
                return f"{airport_code} ARR" if is_arrival else f"{airport_code} {parts[2]}-{parts[1]}"
            case _:
                return f"{airport_code} APP"

    def _get_twr_name(self, parts: List[str]) -> str:
        airport_code = self.airport[2:]
        if (len(parts) == 3):
            return f"{airport_code} {parts[2]}-{parts[1]}"
        return f"{airport_code} TWR"

def main():
    # Specify the directory path
    directory = '.'

    # List all file names (excluding directories)
    files = [f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))]
    filename = None 
    for f in files:
        if f.startswith("ESAA") and f.endswith(".ese"):
            filename = os.path.join(directory, f)
            break

    if not filename:
        print("Please provide a .ese file (from sector the sector pack) and place it in the same folder as this script.")
        exit(1)

    print("extracting positions from", filename)


    file = open(filename, "r", encoding="latin-1", errors="ignore")
    content = file.read()
    file.close()
    row = content.splitlines()



    positions = []
    for idx, r in enumerate(row):
        if (idx > 300):
            break
        r = r.split(":")
        if not (r[0].startswith("ES")):
            continue
        if (r[0] == "[SIDSSTARS]"):
            break
        if (len(r) < 5):
            continue

        position = Position(
            callsign=r[0],
            radio=r[1],
            airport=r[5],
            si=r[3],
            type=r[6]
        )
        positions.append(position)

    if not os.path.exists("../src/data"):
        os.makedirs("../src/data")
        print("Created directory ../src/data")

    file = open("../src/data/callsigns.txt", "w")
    count = 0
    for c in positions :
        if (c.position_name() is not None):
            file.write(c.position_name() + "\n")
            count += 1
    file.close()

    print("saved a total of", count, "positions to ../src/data/callsigns.txt")

if __name__ == "__main__":
    main()