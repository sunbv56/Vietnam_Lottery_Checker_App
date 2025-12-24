from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
from utils import extract_ticket_info, crawl_kqxs_final, check_win, PROVINCE_MAP
import base64
import socket

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
        info = None
        
        # Priority 1: Manual Info (User corrected OCR or entered manually)
        if 'manualInfo' in data:
            info = data['manualInfo']
        # Priority 2: Image (Standard OCR flow)
        elif 'image' in data:
            image_data = base64.b64decode(data['image'].split(',')[1])
            info = extract_ticket_info(image_data, api_key=api_key)
        else:
            return jsonify({"error": "Vui lòng cung cấp ảnh hoặc thông tin vé số."}), 400

        if not info:
            return jsonify({"error": "Không thể nhận diện thông tin từ ảnh. Vui lòng thử lại với ảnh rõ nét hơn hoặc nhập thủ công."}), 400
        
        province = str(info.get('province', '')).lower()
        date = str(info.get('date', ''))
        number = str(info.get('number', ''))
        
        # Find province slug
        province_slug = None
        for name, slug in PROVINCE_MAP.items():
            if name in province:
                province_slug = slug
                break
        
        if not province_slug:
            return jsonify({
                "error": f"Không hỗ trợ tỉnh: {province}. Vui lòng kiểm tra lại.",
                "info": info
            }), 400
            
        # Scrape results
        results = crawl_kqxs_final(province_slug, date)
        
        if results == "NOT_READY":
            message = f"Đài {province.title()} ngày {date} hiện chưa có kết quả chính thức. Vui lòng quay lại sau nhé!"
            return jsonify({
                "success": False,
                "status": "NOT_READY",
                "message": message,
                "error": message,  # Fallback for generic error handlers
                "info": info
            }), 202
            
        if not results:
            return jsonify({
                "error": f"Không tìm thấy kết quả cho {province} ngày {date}.",
                "info": info
            }), 404
            
        # Check win
        win_details = check_win(number, results)
        
        return jsonify({
            "success": True,
            "info": info,
            "results": results,
            "win_details": win_details
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    def get_local_ip():
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            # doesn't even have to be reachable
            s.connect(('10.255.255.255', 1))
            IP = s.getsockname()[0]
        except Exception:
            IP = '127.0.0.1'
        finally:
            s.close()
        return IP

    local_ip = get_local_ip()
    print(f"\n{'='*55}")
    print(f"🚀 Ứng dụng Kiểm Tra Vé Số đã sẵn sàng!")
    print(f"💻 Truy cập trên máy tính: http://localhost:5000")
    print(f"📱 Truy cập từ điện thoại (cùng WiFi/LAN): http://{local_ip}:5000")
    print(f"{'='*55}\n")
    
    app.run(host='0.0.0.0', debug=True, port=5000)
