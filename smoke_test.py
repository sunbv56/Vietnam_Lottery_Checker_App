from utils import crawl_kqxs_final, check_win
import json

def smoke_test_crawler():
    print("Testing crawler for Bến Tre (24-12-2025)...")
    # Note: This might return None if the date is in the future or not available
    # But let's try a known date that should have results
    res = crawl_kqxs_final("ben-tre", "24-12-2025")
    if res == "NOT_READY":
        print("Result: NOT_READY (Correct behavior if date is future/current)")
    elif res:
        print("Result: Success")
        print(json.dumps(res, indent=2, ensure_ascii=False))
    else:
        print("Result: FAILED (Check internet or Minh Ngoc structure)")

if __name__ == "__main__":
    smoke_test_crawler()
