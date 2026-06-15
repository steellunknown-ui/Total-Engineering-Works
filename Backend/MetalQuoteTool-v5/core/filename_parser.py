import re

def parse_material_from_filename(fname: str) -> str:
    fu = fname.upper()
    # Replace anything that isn't a letter or number with a space
    fu_clean = re.sub(r'[^A-Z0-9]', ' ', fu)

    # Check more specific materials first
    if re.search(r'\b(?:CRCA|CRC)\b', fu_clean): return "CRCA"
    if re.search(r'\b(?:GI|GALV|GALVANIZED|GALVANICE)\b', fu_clean): return "GI Sheet"
    if re.search(r'\b(?:SS|STAINLESS|SS304|SS316|304|316)\b', fu_clean): return "SS-304"
    if re.search(r'\b(?:AL|ALU|ALUM|ALUMINIUM|ALUMINUM)\b', fu_clean): return "Aluminium"
    if re.search(r'\b(?:HR|HOT|HRS)\b', fu_clean): return "HR Sheet"
    if re.search(r'\b(?:CR|COLD)\b', fu_clean): return "CR Sheet"
    if re.search(r'\b(?:MS|MILD)\b', fu_clean): return "MS Sheet"
    
    # Fallback: exact substrings without word boundaries (helps if squished like PART1MS)
    if "CRCA" in fu: return "CRCA"
    if "SS304" in fu or "SS316" in fu: return "SS-304"
    if "ALUM" in fu: return "Aluminium"
    
    # Look for MS/SS just before the extension or as its own block
    stem = fu.rsplit('.', 1)[0]
    if stem.endswith("MS") or stem.endswith("_MS") or stem.endswith("-MS"):
        return "MS Sheet"
    if stem.endswith("SS") or stem.endswith("_SS") or stem.endswith("-SS"):
        return "SS-304"
        
    return ""

def parse_thickness_from_filename(fname: str) -> float:
    fu = fname.upper()
    # Keep dot for decimals, replace other separators
    fu_clean = re.sub(r'[_\-\,]', ' ', fu) 
    
    # 1. Match explicit markers: 3MM, 3.0 THK, 3T, 3p0mm, T3, THK 3.0
    for pat in [
        r"(?:^|[^0-9\.]+)([0-9]+(?:[\.pP][0-9]+)?)\s*(?:MM|THK|T|GAUGE)\b",
        r"(?:^|[^0-9\.]+)(?:T|THK)\s*([0-9]+(?:[\.pP][0-9]+)?)\b",
    ]:
        m = re.search(pat, fu_clean)
        if m:
            try:
                v = float(m.group(1).replace('P', '.').replace('p', '.'))
                if 0.3 <= v <= 25.0:
                    return v
            except ValueError:
                pass

    # 2. Standalone common sheet thicknesses (e.g. " 1.5 ", " 3 ")
    common_thk = [0.5, 0.8, 1.0, 1.2, 1.5, 1.6, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 16.0, 20.0, 25.0]
    for match in re.finditer(r"\b([0-9]+(?:\.[0-9]+)?)\b", fu_clean):
        try:
            v = float(match.group(1))
            if v in common_thk:
                return v
            # If it has a decimal point and is in range, accept it (e.g., 2.1)
            if '.' in match.group(1) and 0.3 <= v <= 25.0:
                return v
        except ValueError:
            pass

    return 0.0
