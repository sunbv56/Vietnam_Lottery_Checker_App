import os
import base64
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from utils import extract_ticket_info, normalize_date, check_win, crawl_kqxs_final, PROVINCE_MAP

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/manifest.json')
def manifest():
    return app.send_static_file('manifest.json')

@app.route('/sw.js')
def sw():
    return app.send_static_file('sw.js')

@app.route('/check', methods=['POST'])
def check_ticket():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    try:
        api_key = data.get('apiKey')
        tickets = []
        
        # Priority 1: Manual Info (User corrected OCR or entered manually)
        if 'manualInfo' in data:
            tickets = [data['manualInfo']]
        # Priority 2: Image (Standard OCR flow)
        elif 'image' in data:
            image_data = base64.b64decode(data['image'].split(',')[1])
            tickets = extract_ticket_info(image_data, api_key=api_key)
        else:
            return jsonify({"error": "Vui lòng cung cấp ảnh hoặc thông tin vé số."}), 400
 
        if not tickets:
            return jsonify({"error": "Không thể nhận diện thông tin từ ảnh. Vui lòng thử lại với ảnh rõ nét hơn hoặc nhập thủ công."}), 400
        
        final_results = []
        
        for info in tickets:
            province = str(info.get('province', '')).lower()
            date = normalize_date(str(info.get('date', '')))
            number = str(info.get('number', ''))
            
            # Find province slug
            province_slug = None
            for name, slug in PROVINCE_MAP.items():
                if name in province:
                    province_slug = slug
                    break
            
            ticket_res = {
                "info": info,
                "success": False,
                "status": "ERROR"
            }

            if not province_slug:
                ticket_res["message"] = f"Không hỗ trợ tỉnh: {province}."
                final_results.append(ticket_res)
                continue
                
            # Scrape results
            results = crawl_kqxs_final(province_slug, date)
            
            if results == "NOT_READY":
                message = f"Đài {province.title()} ngày {date} hiện chưa có kết quả chính thức. Vui lòng quay lại sau nhé!"
                ticket_res["status"] = "NOT_READY"
                ticket_res["message"] = message
                final_results.append(ticket_res)
                continue
                
            if not results:
                ticket_res["message"] = f"Không tìm thấy kết quả cho {province} ngày {date}."
                final_results.append(ticket_res)
                continue
                
            # Check win
            win_details = check_win(number, results)
            
            ticket_res.update({
                "success": True,
                "status": "OK",
                "results": results,
                "win_details": win_details
            })
            final_results.append(ticket_res)
        
        return jsonify({
            "is_batch": True,
            "results": final_results
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)
