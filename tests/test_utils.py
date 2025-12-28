import pytest
from utils import check_win, PRIZE_VALUES, PROVINCE_MAP

def test_check_win_special():
    results = {
        "Giải Đặc Biệt": ["123456"]
    }
    # Jackpot
    win = check_win("123456", results)
    assert len(win) == 1
    assert win[0]["name"] == "Giải Đặc Biệt"
    assert win[0]["value"] == 2000000000

def test_check_win_phu_dac_biet():
    results = {
        "Giải Đặc Biệt": ["123456"]
    }
    # Sai số đầu, đúng 5 số cuối
    win = check_win("023456", results)
    assert any(w["name"] == "Giải Phụ Đặc Biệt" for w in win)
    assert any(w["value"] == 50000000 for w in win)

def test_check_win_khuyen_khich():
    results = {
        "Giải Đặc Biệt": ["123456"]
    }
    # Đúng số đầu, sai đúng 1 trong 5 số còn lại
    win = check_win("123450", results)
    assert any(w["name"] == "Giải Khuyến Khích" for w in win)
    assert any(w["value"] == 6000000 for w in win)

def test_check_win_eight():
    results = {
        "Giải Tám": ["56"]
    }
    win = check_win("123456", results)
    assert len(win) == 1
    assert win[0]["name"] == "Giải Tám"
    assert win[0]["value"] == 100000

def test_check_win_none():
    results = {
        "Giải Đặc Biệt": ["123456"],
        "Giải Nhất": ["654321"]
    }
    win = check_win("000000", results)
    assert len(win) == 0

def test_province_mapping():
    # Test lowercase and direct mapping
    cases = [
        ("bến tre", "ben-tre"),
        ("hồ chí minh", "tp-hcm"),
        ("đà lạt", "da-lat"),
        ("cà mau", "ca-mau"),
        ("đồng tháp", "dong-thap")
    ]
    for name, slug in cases:
        found = False
        for p_name, p_slug in PROVINCE_MAP.items():
            if name.lower() in p_name.lower():
                assert p_slug == slug
                found = True
                break
        assert found, f"Province {name} not found in map"

def test_normalize_date():
    from utils import normalize_date
    assert normalize_date("24/12/2025") == "24-12-2025"
    assert normalize_date("24.12.2025") == "24-12-2025"
    assert normalize_date("2025-12-24") == "24-12-2025"
    assert normalize_date("1-1-25") == "01-01-2025"
    assert normalize_date("01-01-2025") == "01-01-2025"
