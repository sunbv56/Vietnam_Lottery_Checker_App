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
    # --- MIỀN NAM (Full 21 lotteries) ---
    "tp.hcm": "tp-hcm",
    "hồ chí minh": "tp-hcm",
    "tp hồ chí minh": "tp-hcm",
    "thành phố hồ chí minh": "tp-hcm",
    "vĩnh long": "vinh-long",
    "bình dương": "binh-duong",
    "trà vinh": "tra-vinh",
    "long an": "long-an",
    "hậu giang": "hau-giang",
    "bình phước": "binh-phuoc",
    "tiền giang": "tien-giang",
    "kiên giang": "kien-giang",
    "đà lạt": "da-lat",
    "lâm đồng": "da-lat",
    "cà mau": "ca-mau",
    "đồng tháp": "dong-thap",
    "bến tre": "ben-tre",
    "vũng tàu": "vung-tau",
    "bạc liêu": "bac-lieu",
    "đồng nai": "dong-nai",
    "cần thơ": "can-tho",
    "sóc trăng": "soc-trang",
    "tây ninh": "tay-ninh",
    "an giang": "an-giang",
    "bình thuận": "binh-thuan",
    
    # --- MIỀN TRUNG ---
    "thừa thiên huế": "thua-thien-hue",
    "huế": "thua-thien-hue",
    "phú yên": "phu-yen",
    "đắk lắk": "dak-lak",
    "đắc lắc": "dak-lak",
    "quảng nam": "quang-nam",
    "đà nẵng": "da-nang",
    "quảng bình": "quang-binh",
    "quảng trị": "quang-tri",
    "bình định": "binh-dinh",
    "gia lai": "gia-lai",
    "khánh hòa": "khanh-hoa",
    "nha trang": "khanh-hoa",
    "kon tum": "kon-tum",
    "ninh thuận": "ninh-thuan",
    "quảng ngãi": "quang-ngai",
    "đắk nông": "dak-nong",
    
    # --- MIỀN BẮC ---
    "miền bắc": "mien-bac",
    "hà nội": "mien-bac",
    "quảng ninh": "quang-ninh",
    "bắc ninh": "bac-ninh",
    "thái bình": "thai-binh",
    "nam định": "nam-dinh",
    "hải phòng": "hai-phong"
}

# Danh sách các model để fallback (ưu tiên model cao nhất/mới nhất)
MODELS_TO_TRY = [
    'gemma-3-27b-it',
    'gemma-3-12b-it',
    # 'gemini-2.5-flash',
    # 'gemini-2.5-flash-preview-09-2025',
    # 'gemini-3-flash-preview',
    # 'gemini-2.5-flash-lite',
    # 'gemini-2.0-flash'
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

def normalize_date(date_str):
    """Chuyển đổi các định dạng ngày về DD-MM-YYYY"""
    if not date_str: return ""
    # Thay thế / , . bằng -
    date_str = re.sub(r'[/\.,\s]', '-', str(date_str))
    # Loại bỏ các ký tự không phải số hoặc -
    date_str = re.sub(r'[^0-9-]', '', date_str)
    
    # Xử lý trường hợp YYYY-MM-DD
    match_iso = re.match(r'(\d{4})-(\d{2})-(\d{2})', date_str)
    if match_iso:
        y, m, d = match_iso.groups()
        return f"{d}-{m}-{y}"
        
    # Đảm bảo có đủ 2 dấu gạch ngang
    parts = date_str.split('-')
    if len(parts) == 3:
        d, m, y = parts
        # Thêm số 0 nếu thiếu (vd: 1-1-2025 -> 01-01-2025)
        d = d.zfill(2)
        m = m.zfill(2)
        if len(y) == 2: y = "20" + y # 25 -> 2025
        return f"{d}-{m}-{y}"
        
    return date_str

def extract_ticket_info(image_bytes, api_key=None):
    """
    Sử dụng Gemini để trích xuất thông tin Tỉnh, Ngày và Số từ ảnh vé số.
    """
    if api_key:
        genai.configure(api_key=api_key)
    else:
        # Fallback to env key
        env_key = os.getenv("GEMINI_API_KEY")
        if env_key: genai.configure(api_key=env_key)

    img = Image.open(io.BytesIO(image_bytes))
    
    prompt = f"""
    ### NHIỆM VỤ: TRÍCH XUẤT THÔNG TIN VÉ SỐ VIỆT NAM ###
    Bạn là một trợ lý AI chuyên nghiệp. Hãy phân tích ảnh và trích xuất thông tin của TỐI ĐA 3 tờ vé số rõ nhất.
    
    YÊU CẦU DỮ LIỆU:
    1. province: Tên tỉnh/thành phố (ví dụ: An Giang, Tiền Giang...).
    2. date: Ngày mở thưởng (Định dạng: DD-MM-YYYY).
    3. number: Dãy số dự thưởng (chuỗi số, thường là 6 chữ số).
    
    DANH SÁCH TỈNH HỢP LỆ: {list(PROVINCE_MAP.keys())[:30]}...
    
    MẪU TRẢ VỀ (JSON ARRAY):
    [
      {{"province": "An Giang", "date": "25-12-2025", "number": "123456"}}
    ]
    
    CHỈ TRẢ VỀ JSON, KHÔNG GIẢI THÍCH GÌ THÊM.
    """
    
    import json
    for model_name in MODELS_TO_TRY:
        try:
            print(f"Đang thử trích xuất bằng: {model_name}...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content([prompt, img])
            text = response.text.strip()

            # Robust JSON Extraction
            # 1. Clean markdown
            text = re.sub(r'```json\s*|```', '', text)
            
            # 2. Find array or object using regex
            match_array = re.search(r'\[\s*\{.*\}\s*\]', text, re.DOTALL)
            match_obj = re.search(r'\{\s*".*"\s*:\s*".*"\s*\}', text, re.DOTALL)
            
            json_str = ""
            if match_array:
                json_str = match_array.group()
            elif match_obj:
                json_str = f"[{match_obj.group()}]"
            
            if json_str:
                tickets = json.loads(json_str)
                if isinstance(tickets, list):
                    # Normalize dates in results
                    for t in tickets:
                        if 'date' in t:
                            t['date'] = normalize_date(t['date'])
                    return tickets

        except Exception as e:
            print(f"Lỗi với model {model_name}: {str(e)}")
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
