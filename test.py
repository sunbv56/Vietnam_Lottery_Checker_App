import requests
from bs4 import BeautifulSoup
import re

def crawl_kqxs_final(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return f"Lỗi kết nối: {response.status_code}"
        
        raw_js = response.text
        
        # 1. Lấy toàn bộ nội dung trong các hàm .append()
        html_chunks = re.findall(r"\.append\('(.*?)'\);", raw_js, re.DOTALL)
        if not html_chunks:
            return "Không tìm thấy dữ liệu HTML"
        
        full_html = "".join(html_chunks).replace("\\'", "'").replace("\\/", "/").replace("\\t", "")

        # 2. Parse HTML
        soup = BeautifulSoup(full_html, 'html.parser')

        # 3. Tìm bảng mỏ neo từ 'giaidb'
        giai_db_node = soup.find('td', class_='giaidb')
        if not giai_db_node:
            return "Không tìm thấy bảng kết quả"

        target_table = giai_db_node.find_parent('table')

        class_mapping = {
            'giaidb': 'Giải Đặc Biệt',
            'giai1': 'Giải Nhất',
            'giai2': 'Giải Nhì',
            'giai3': 'Giải Ba',
            'giai4': 'Giải Tư',
            'giai5': 'Giải Năm',
            'giai6': 'Giải Sáu',
            'giai7': 'Giải Bảy',
            'giai8': 'Giải Tám'
        }

        results = {}

        for class_name, label in class_mapping.items():
            td_cell = target_table.find('td', class_=class_name)
            if td_cell:
                # --- PHẦN XỬ LÝ QUAN TRỌNG TẠI ĐÂY ---
                # Lấy toàn bộ text trong ô (ví dụ: "09355 - 11568")
                raw_text = td_cell.get_text(strip=True)
                
                # Tách chuỗi bằng dấu gạch ngang "-"
                # strip() từng phần tử để loại bỏ khoảng trắng thừa
                if "-" in raw_text:
                    numbers = [n.strip() for n in raw_text.split("-") if n.strip()]
                else:
                    # Nếu không có dấu gạch ngang (chỉ có 1 số), lấy luôn số đó vào list
                    numbers = [raw_text] if raw_text else []
                
                results[label] = numbers

        return results

    except Exception as e:
        return f"Lỗi: {str(e)}"

# --- CHẠY THỬ ---
url_js = "https://www.minhngoc.net.vn/getkqxs/ben-tre/18-11-2025.js"
data = crawl_kqxs_final(url_js)

# Kết quả mong muốn:
import json
print(json.dumps(data, indent=4, ensure_ascii=False))