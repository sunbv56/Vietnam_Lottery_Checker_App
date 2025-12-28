from utils import normalize_date, PROVINCE_MAP

print(f"Testing normalize_date('24/12/2025'): {normalize_date('24/12/2025')}")
print(f"Testing normalize_date('1/1/25'): {normalize_date('1/1/25')}")
print(f"Testing normalize_date('2025-12-24'): {normalize_date('2025-12-24')}")

count = 0
for p in ["Cà Mau", "Đồng Tháp", "Bến Tre", "Vũng Tàu", "Bạc Liêu", "Đồng Nai", "Cần Thơ", "Sóc Trăng", "Tây Ninh", "An Giang", "Bình Thuận", "Vĩnh Long", "Bình Dương", "Trà Vinh", "Hồ Chí Minh", "Long An", "Hậu Giang", "Bình Phước", "Tiền Giang", "Kiên Giang", "Đà Lạt"]:
    found = False
    for k in PROVINCE_MAP:
        if p.lower() in k:
            found = True
            break
    if found:
        count += 1
    else:
        print(f"Missing province: {p}")

print(f"Southern Provinces Found: {count}/21")
