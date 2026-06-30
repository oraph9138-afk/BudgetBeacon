import numpy as np

# Pre-computed averages from 5000 synthetic training samples
# business multipliers: [1.0, 0.8, 1.2, 0.9, 0.7]
# location multipliers: [1.1, 1.0, 0.95, 0.85, 1.05, 0.9, 0.8]
# Expected overhead ~15%

BUSINESS_TYPE_LABELS = {
    "agriculture": "Agriculture", "retail": "Retail/Trade",
    "manufacturing": "Manufacturing", "transport": "Transport", "services": "Services",
}

AVG_COST_BY_TYPE = {
    "agriculture": 920000,
    "retail": 740000,
    "manufacturing": 1100000,
    "transport": 830000,
    "services": 640000,
}

AVG_MATERIAL_BY_TYPE = {
    "agriculture": 520000,
    "retail": 310000,
    "manufacturing": 680000,
    "transport": 180000,
    "services": 120000,
}

AVG_TRANSPORT_BY_TYPE = {
    "agriculture": 120000,
    "retail": 90000,
    "manufacturing": 150000,
    "transport": 200000,
    "services": 60000,
}

AVG_LABOR_BY_TYPE = {
    "agriculture": 280000,
    "retail": 220000,
    "manufacturing": 350000,
    "transport": 250000,
    "services": 300000,
}

AVG_DAYS_BY_TYPE = {
    "agriculture": 25,
    "retail": 15,
    "manufacturing": 35,
    "transport": 20,
    "services": 12,
}

AVG_COST_BY_LOC = {
    "Dar es Salaam": 1050000,
    "Arusha": 900000,
    "Mwanza": 850000,
    "Dodoma": 780000,
    "Zanzibar": 950000,
    "Mbeya": 810000,
    "Other": 740000,
}

AVG_MATERIAL_BY_LOC = {
    "Dar es Salaam": 450000,
    "Arusha": 380000,
    "Mwanza": 350000,
    "Dodoma": 320000,
    "Zanzibar": 420000,
    "Mbeya": 330000,
    "Other": 300000,
}

AVG_TRANSPORT_BY_LOC = {
    "Dar es Salaam": 110000,
    "Arusha": 95000,
    "Mwanza": 100000,
    "Dodoma": 85000,
    "Zanzibar": 105000,
    "Mbeya": 90000,
    "Other": 80000,
}

THRESHOLD_HIGH = 1.30  # 30% above average triggers warning
THRESHOLD_LOW = 0.70   # 30% below average triggers note


def generate_tips(data, prediction):
    tips = []
    btype = data.business_type
    loc = data.location
    label = BUSINESS_TYPE_LABELS.get(btype, btype)

    # Material cost comparison
    avg_mat_type = AVG_MATERIAL_BY_TYPE.get(btype, 300000)
    avg_mat_loc = AVG_MATERIAL_BY_LOC.get(loc, 300000)
    avg_mat = (avg_mat_type + avg_mat_loc) / 2

    if avg_mat > 0 and data.material_cost > avg_mat * THRESHOLD_HIGH:
        pct = int((data.material_cost / avg_mat - 1) * 100)
        tips.append(
            f"Material costs are {pct}% above average for {label} in {loc}. "
            "Consider bulk purchasing or negotiating with suppliers."
        )
    elif avg_mat > 0 and data.material_cost < avg_mat * THRESHOLD_LOW and data.material_cost > 0:
        tips.append(
            f"Material costs are well below average for {label} — your sourcing strategy looks efficient."
        )

    # Transport cost comparison
    avg_trp_type = AVG_TRANSPORT_BY_TYPE.get(btype, 90000)
    avg_trp_loc = AVG_TRANSPORT_BY_LOC.get(loc, 90000)
    avg_trp = (avg_trp_type + avg_trp_loc) / 2

    if avg_trp > 0 and data.transport_cost > avg_trp * THRESHOLD_HIGH:
        pct = int((data.transport_cost / avg_trp - 1) * 100)
        tips.append(
            f"Transport costs are {pct}% above average for {label} in {loc}. "
            "Consolidating shipments or sourcing locally could reduce expenses."
        )
    elif avg_trp > 0 and data.transport_cost < avg_trp * THRESHOLD_LOW and data.transport_cost > 0:
        tips.append(
            f"Transport costs are below average — your logistics setup appears cost-effective."
        )

    # Labor cost comparison
    avg_lab_type = AVG_LABOR_BY_TYPE.get(btype, 200000)
    avg_lab = avg_lab_type

    if avg_lab > 0 and data.labor_cost > avg_lab * THRESHOLD_HIGH:
        pct = int((data.labor_cost / avg_lab - 1) * 100)
        tips.append(
            f"Labor costs are {pct}% above average for {label}. "
            "Review workforce allocation or consider automation where feasible."
        )
    elif avg_lab > 0 and data.labor_cost < avg_lab * THRESHOLD_LOW and data.labor_cost > 0:
        tips.append(
            f"Labor costs are below average — ensure staffing levels are adequate."
        )

    # Production days comparison
    avg_days = AVG_DAYS_BY_TYPE.get(btype, 20)
    if avg_days > 0 and data.production_days > avg_days * THRESHOLD_HIGH:
        pct = int((data.production_days / avg_days - 1) * 100)
        tips.append(
            f"Production timeline is {pct}% longer than typical for {label}. "
            "Process optimization could reduce cycle time."
        )

    # Confidence-based tip
    if prediction.get("confidence_pct", 100) < 50:
        tips.append(
            "Confidence is low — try using cost values closer to typical ranges "
            "for your business type and location."
        )
    elif prediction.get("confidence_pct", 100) >= 90:
        tips.append(
            "Confidence is very high. This estimate is reliable for budgeting and planning."
        )

    return tips
