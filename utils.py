import requests
from bs4 import BeautifulSoup
import re
import os
import google.generativeai as genai
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

PROVINCE_MAP = {
    "bến tre": "ben-tre",
    "vũng tàu": "vung-tau",
    "bạc liêu": "bac-lieu",
    "đồng nai": "dong-nai",
    "cần thơ": "can-tho",
    "sóc trăng": "soc-trang",
    "tây ninh": "tay-ninh",
    "an giang": "an-giang",
    "bình thuận": "binh-thuan",
    "vĩnh long": "vinh-long",
    "bình dương": "binh-duong",
    "trà vinh": "tra-vinh",
    "tp.hcm": "tp-hcm",
    "hồ chí minh": "tp-hcm",
    "tp hồ chí minh": "tp-hcm",
    "thành phố hồ chí minh": "tp-hcm",
    "long an": "long-an",
    "hậu giang": "hau-giang",
    "bình phước": "binh-phuoc",
    "tiền giang": "tien-giang",
    "kiên giang": "kien-giang",
    "đà lạt": "da-lat",
}

# Danh sách các model để fallback (ưu tiên model cao nhất/mới nhất)
MODELS_TO_TRY = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-preview-09-2025',
    'gemini-3-flash-preview',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash'
]

PRIZE_VALUES = {
    "Giải Đặc Biệt": 2000000000,
    "Giải Nhất": 30000000,
    "Giải Nhì": 15000000,
    "Giải Ba": 10000000,
    "Giải Tư": 3000000,
    "Giải Năm": 1000000,
    "Giải Sáu": 400000,
    "Giải Bảy": 200000,
    "Giải Tám": 100000,
    "Giải Phụ Đặc Biệt": 50000000,
    "Giải Khuyến Khích": 6000000
}

def extract_ticket_info(image_bytes, api_key=None):
    """
    Sử dụng Gemini để trích xuất thông tin Tỉnh, Ngày và Số từ ảnh vé số.
    --- CHÍNH SÁCH BẢO MẬT ---
    - api_key được truyền từ client và chỉ tồn tại trong bộ nhớ (RAM) của tiến trình xử lý request.
    - Server CAM KẾT không ghi log, không lưu trữ (no persistence) API Key của người dùng.
    - Mỗi request sẽ cấu hình lại genai để đảm bảo tính độc lập (stateless).
    """
    if api_key:
        genai.configure(api_key=api_key)
    else:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

    img = Image.open(io.BytesIO(image_bytes))
    
    prompt = f"""
    ### QUY TẮC QUAN TRỌNG: TRÍCH XUẤT TỐI ĐA 3 TỜ VÉ SỐ ###
    Bạn là một chuyên gia về vé số Việt Nam. Hãy quan sát ảnh và tìm tất cả các tờ vé số có trong ảnh.
    
    HÃY THỰC HIỆN CÁC BƯỚC:
    1. NHẬN DIỆN: Tìm tối đa 3 tờ vé số rõ nhất trong ảnh.
    2. TRÍCH XUẤT THÔNG TIN cho TỪNG tờ vé:
       - province: Tên tỉnh/thành phố (ví dụ: Bến Tre, Vũng Tàu...).
       - date: Ngày mở thưởng (định dạng DD-MM-YYYY).
       - number: Dãy số dự thưởng (chuỗi số, thường là 6 chữ số).
    3. ĐỊNH DẠNG TRẢ VỀ: Một MẢNG các đối tượng JSON.

    ĐỊNH DẠNG TRẢ VỀ MẪU:
    [
      {{
          "province": "Bến Tre",
          "date": "24-12-2025",
          "number": "123456"
      }},
      {{
          "province": "Vũng Tàu",
          "date": "24-12-2025",
          "number": "654321"
      }}
    ]

    Tỉnh phải thuộc danh sách: {list(PROVINCE_MAP.keys())}
    - Nếu chỉ thấy 1 vé, trả về mảng có 1 phần tử.
    - Nếu không thấy vé nào, trả về mảng rỗng [].
    - Đảm bảo "number" chỉ chứa các chữ số.
    
    ### CHỈ TRẢ VỀ JSON ARRAY, KHÔNG GIẢI THÍCH, KHÔNG TEXT THỪA ###
    """
    
    for model_name in MODELS_TO_TRY:
        try:
            print(f"Đang thử trích xuất thông tin bằng model: {model_name}...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content([prompt, img])
            
            # Extract JSON Array using regex
            match = re.search(r'\[.*\]', response.text, re.DOTALL)
            if match:
                import json
                tickets = json.loads(match.group())
                if isinstance(tickets, list) and len(tickets) > 0:
                    print(f"Thành công với model: {model_name}. Tìm thấy {len(tickets)} vé.")
                    return tickets
                elif isinstance(tickets, dict): # Fallback for single object
                    return [tickets]
            
            # Second attempt if no array found but maybe a single object
            match_obj = re.search(r'\{.*?\}', response.text, re.DOTALL)
            if match_obj:
                import json
                info = json.loads(match_obj.group())
                if info.get('number'):
                    return [info]
                    
            print(f"Model {model_name} trả về kết quả không hợp lệ, thử model tiếp theo...")
        except Exception as e:
            print(f"Lỗi khi sử dụng model {model_name}: {str(e)}")
            continue
            
    return []

def crawl_kqxs_final(province_slug, date_str):
    """
    Crawls lottery results for a given province and date.
    date_str format: DD-MM-YYYY
    """
    url = f"https://www.minhngoc.net.vn/getkqxs/{province_slug}/{date_str}.js"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return None
        
        raw_js = response.text
        html_chunks = re.findall(r"\.append\('(.*?)'\);", raw_js, re.DOTALL)
        if not html_chunks:
            return None
        
        full_html = "".join(html_chunks).replace("\\'", "'").replace("\\/", "/").replace("\\t", "")
        soup = BeautifulSoup(full_html, 'html.parser')

        # --- Check if result is actually for the requested date ---
        # The user's logic: find select#box_kqxs_ngay and check its selected option's value
        try:
            date_select = soup.find('select', id='box_kqxs_ngay')
            if date_select:
                selected_option = date_select.find('option', selected=True)
                if selected_option:
                    actual_date = selected_option.get('value')
                    if actual_date != date_str:
                        print(f"Kết quả cho ngày {date_str} chưa có (đang hiển thị ngày {actual_date})")
                        return "NOT_READY"
        except Exception as e:
            print(f"Lỗi khi kiểm tra tính khả dụng của kết quả: {e}")

        giai_db_node = soup.find('td', class_='giaidb')
        if not giai_db_node:
            return None

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
                raw_text = td_cell.get_text(strip=True)
                if "-" in raw_text:
                    numbers = [n.strip() for n in raw_text.split("-") if n.strip()]
                else:
                    numbers = [raw_text] if raw_text else []
                results[label] = numbers

        return results

    except Exception as e:
        print(f"Error crawling: {e}")
        return None

def check_win(ticket_number, results):
    """
    So khớp số vé với kết quả xổ số.
    Trả về danh sách các giải trúng (tên giải và số tiền).
    """
    win_details = []
    
    # Đảm bảo ticket_number là string và đủ 6 số (nếu là vé miền Nam)
    ticket_number = str(ticket_number).strip()
    
    for prize, winning_numbers in results.items():
        for win_num in winning_numbers:
            win_num = str(win_num).strip()
            
            # Logic so khớp đuôi cho các giải từ 8 đến 1
            if prize == 'Giải Tám':
                if ticket_number.endswith(win_num):
                    win_details.append({"name": prize, "value": PRIZE_VALUES.get(prize, 0)})
            elif prize == 'Giải Bảy':
                if ticket_number.endswith(win_num):
                    win_details.append({"name": prize, "value": PRIZE_VALUES.get(prize, 0)})
            elif prize == 'Giải Sáu':
                if ticket_number.endswith(win_num):
                    win_details.append({"name": prize, "value": PRIZE_VALUES.get(prize, 0)})
            elif prize == 'Giải Năm':
                if ticket_number.endswith(win_num):
                    win_details.append({"name": prize, "value": PRIZE_VALUES.get(prize, 0)})
            elif prize == 'Giải Tư':
                if ticket_number.endswith(win_num):
                    win_details.append({"name": prize, "value": PRIZE_VALUES.get(prize, 0)})
            elif prize == 'Giải Ba':
                if ticket_number.endswith(win_num):
                    win_details.append({"name": prize, "value": PRIZE_VALUES.get(prize, 0)})
            elif prize == 'Giải Nhì':
                if ticket_number.endswith(win_num):
                    win_details.append({"name": prize, "value": PRIZE_VALUES.get(prize, 0)})
            elif prize == 'Giải Nhất':
                if ticket_number.endswith(win_num):
                    win_details.append({"name": prize, "value": PRIZE_VALUES.get(prize, 0)})
            
            # Giải Đặc Biệt và các giải liên quan
            elif prize == 'Giải Đặc Biệt':
                if ticket_number == win_num:
                    win_details.append({"name": prize, "value": PRIZE_VALUES.get(prize, 0)})
                
                # Logic cho vé 6 chữ số (Miền Nam/Miền Trung)
                elif len(ticket_number) == 6 and len(win_num) == 6:
                    # 1. Giải Phụ Đặc Biệt: Sai chữ số đầu tiên (hàng trăm ngàn), đúng 5 số cuối
                    if ticket_number[1:] == win_num[1:]:
                        win_details.append({"name": "Giải Phụ Đặc Biệt", "value": PRIZE_VALUES.get("Giải Phụ Đặc Biệt", 0)})
                    
                    # 2. Giải Khuyến Khích: Đúng chữ số đầu tiên, sai đúng 1 trong 5 số còn lại
                    elif ticket_number[0] == win_num[0]:
                        # Đếm số vị trí khác nhau trong 5 số cuối
                        diff_count = 0
                        for i in range(1, 6):
                            if ticket_number[i] != win_num[i]:
                                diff_count += 1
                        
                        if diff_count == 1:
                            win_details.append({"name": "Giải Khuyến Khích", "value": PRIZE_VALUES.get("Giải Khuyến Khích", 0)})
    
    return win_details
